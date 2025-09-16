'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
}

interface KPICarouselProps {
  cards: KPICard[];
  className?: string;
}

export function KPICarousel({ cards, className }: KPICarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
    loop: true,
    slidesToScroll: 1,
    // Show 1.2 cards on mobile for peek effect
    breakpoints: {
      '(min-width: 640px)': { active: false }, // Disable carousel on larger screens
    },
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  return (
    <div className={cn('relative', className)}>
      {/* Mobile Carousel View */}
      <div className="sm:hidden">
        <div className="overflow-hidden px-4" ref={emblaRef}>
          <div className="flex gap-3">
            {cards.map((card, index) => (
              <div
                key={index}
                className={cn(
                  "flex-[0_0_80%] min-w-0",
                  index === cards.length - 1 ? "mr-3" : ""
                )}
              >
                <Card className="bg-white/5 border-white/10 h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
                    <CardTitle className="text-xs font-medium text-white/60">
                      {card.title}
                    </CardTitle>
                    <card.icon className={cn('h-3.5 w-3.5', card.iconColor || 'text-white/40')} />
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-white">{card.value}</div>
                    <p className="text-[11px] text-white/60 mt-0.5">{card.subtitle}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  index === selectedIndex
                    ? 'w-5 bg-blue-500'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                )}
                onClick={() => scrollTo(index)}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet/Desktop Grid View */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/60">
                {card.title}
              </CardTitle>
              <card.icon className={cn('h-4 w-4', card.iconColor || 'text-white/40')} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <p className="text-xs text-white/60 mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}