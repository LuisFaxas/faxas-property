import { cn } from '@/lib/utils';

interface WidgetProps {
  children: React.ReactNode;
  className?: string;
}

export function Widget({ children, className }: WidgetProps) {
  return (
    <div className={cn('glass-card p-4 md:p-6', className)}>
      {children}
    </div>
  );
}