import React from 'react';
import { cn } from '@/lib/utils';

export type WeatherCondition =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'overcast'
  | 'rain-light'
  | 'rain'
  | 'rain-heavy'
  | 'thunderstorm'
  | 'snow-light'
  | 'snow'
  | 'snow-heavy'
  | 'fog'
  | 'unknown';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64
};

// Map WMO Weather Interpretation Codes to our conditions
export function mapWMOCode(code: number, isDay: boolean = true): WeatherCondition {
  // WMO Code 0-3: Clear and partly cloudy
  if (code === 0) return isDay ? 'clear-day' : 'clear-night';
  if (code === 1) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (code === 2) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (code === 3) return 'overcast';

  // WMO Code 45-48: Fog
  if (code >= 45 && code <= 48) return 'fog';

  // WMO Code 51-67: Drizzle and rain
  if (code >= 51 && code <= 55) return 'rain-light';
  if (code >= 56 && code <= 57) return 'rain-light'; // Freezing drizzle
  if (code === 61) return 'rain-light';
  if (code === 63 || code === 65) return 'rain';
  if (code === 66 || code === 67) return 'rain'; // Freezing rain

  // WMO Code 71-77: Snow
  if (code === 71 || code === 73) return 'snow-light';
  if (code === 75 || code === 77) return 'snow-heavy';
  if (code === 85) return 'snow-light';
  if (code === 86) return 'snow-heavy';

  // WMO Code 80-82: Rain showers
  if (code === 80) return 'rain-light';
  if (code === 81 || code === 82) return 'rain-heavy';

  // WMO Code 95-99: Thunderstorm
  if (code >= 95 && code <= 99) return 'thunderstorm';

  return 'unknown';
}

// Temperature-based background color for weather widget
export function getTemperatureBackground(temp?: number): string {
  if (!temp) return 'bg-slate-800/20';
  if (temp < 32) return 'bg-blue-900/30'; // Freezing
  if (temp < 50) return 'bg-blue-700/25'; // Cold
  if (temp < 70) return 'bg-teal-700/20'; // Cool
  if (temp < 85) return 'bg-orange-700/25'; // Warm
  return 'bg-orange-800/30'; // Hot
}

export function WeatherIcon({ condition, size = 'md', className, animated = true }: WeatherIconProps) {
  const pixelSize = sizeMap[size];
  const strokeWidth = size === 'sm' ? 2 : size === 'xl' ? 2.5 : 2;

  const baseClasses = cn(
    "weather-icon flex-shrink-0",
    className
  );

  switch (condition) {
    case 'clear-day':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          <defs>
            <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDB813" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Sun core */}
          <circle
            cx="32"
            cy="32"
            r="12"
            fill="url(#sunGradient)"
            filter="url(#glow)"
            className={animated ? "animate-pulse-slow" : ""}
          />
          {/* Sun rays */}
          <g className={animated ? "animate-spin-slow origin-center" : ""} style={{transformOrigin: '32px 32px'}}>
            {[...Array(8)].map((_, i) => (
              <line
                key={i}
                x1="32"
                y1="10"
                x2="32"
                y2="4"
                stroke="#FDB813"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                transform={`rotate(${i * 45} 32 32)`}
              />
            ))}
          </g>
        </svg>
      );

    case 'clear-night':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          <defs>
            <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>
          </defs>
          {/* Crescent moon */}
          <path
            d="M 32 10 C 22 10 14 18 14 28 C 14 38 22 46 32 46 C 26 46 21 41 21 34 C 21 27 26 22 33 22 C 33 16 32 10 32 10"
            fill="url(#moonGradient)"
            className={animated ? "animate-pulse-slow" : ""}
          />
          {/* Stars */}
          <g className={animated ? "animate-twinkle" : ""}>
            <circle cx="45" cy="15" r="1.5" fill="#E0E7FF" />
            <circle cx="50" cy="25" r="1" fill="#E0E7FF" />
            <circle cx="42" cy="38" r="1.2" fill="#E0E7FF" />
          </g>
        </svg>
      );

    case 'partly-cloudy-day':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          <defs>
            <linearGradient id="sunGradientPartly" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDB813" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Sun behind */}
          <circle cx="24" cy="24" r="10" fill="url(#sunGradientPartly)" opacity="0.9" />
          {/* Cloud */}
          <g className={animated ? "animate-drift" : ""}>
            <ellipse cx="40" cy="36" rx="14" ry="10" fill="white" opacity="0.95" />
            <ellipse cx="32" cy="38" rx="10" ry="8" fill="white" opacity="0.95" />
            <ellipse cx="48" cy="38" rx="10" ry="8" fill="white" opacity="0.95" />
          </g>
        </svg>
      );

    case 'partly-cloudy-night':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Moon behind */}
          <path
            d="M 24 12 C 18 12 13 17 13 23 C 13 29 18 34 24 34 C 20 34 17 31 17 27 C 17 23 20 20 24 20 C 24 16 24 12 24 12"
            fill="#C7D2FE"
            opacity="0.8"
          />
          {/* Cloud */}
          <g className={animated ? "animate-drift" : ""}>
            <ellipse cx="40" cy="36" rx="14" ry="10" fill="white" opacity="0.9" />
            <ellipse cx="32" cy="38" rx="10" ry="8" fill="white" opacity="0.9" />
            <ellipse cx="48" cy="38" rx="10" ry="8" fill="white" opacity="0.9" />
          </g>
        </svg>
      );

    case 'cloudy':
    case 'overcast':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          <g className={animated ? "animate-drift" : ""}>
            {/* Back cloud */}
            <ellipse cx="28" cy="26" rx="12" ry="9" fill="#9CA3AF" opacity="0.6" />
            <ellipse cx="20" cy="28" rx="9" ry="7" fill="#9CA3AF" opacity="0.6" />
            <ellipse cx="36" cy="28" rx="9" ry="7" fill="#9CA3AF" opacity="0.6" />
            {/* Front cloud */}
            <ellipse cx="38" cy="36" rx="14" ry="10" fill="#6B7280" />
            <ellipse cx="30" cy="38" rx="10" ry="8" fill="#6B7280" />
            <ellipse cx="46" cy="38" rx="10" ry="8" fill="#6B7280" />
          </g>
        </svg>
      );

    case 'rain-light':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Cloud */}
          <ellipse cx="32" cy="24" rx="14" ry="10" fill="#6B7280" />
          <ellipse cx="24" cy="26" rx="10" ry="8" fill="#6B7280" />
          <ellipse cx="40" cy="26" rx="10" ry="8" fill="#6B7280" />
          {/* Light rain drops */}
          <g className={animated ? "animate-rain" : ""}>
            <line x1="24" y1="36" x2="22" y2="42" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="32" y1="36" x2="30" y2="42" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="40" y1="36" x2="38" y2="42" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'rain':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Dark cloud */}
          <ellipse cx="32" cy="24" rx="14" ry="10" fill="#4B5563" />
          <ellipse cx="24" cy="26" rx="10" ry="8" fill="#4B5563" />
          <ellipse cx="40" cy="26" rx="10" ry="8" fill="#4B5563" />
          {/* Rain drops */}
          <g className={animated ? "animate-rain" : ""}>
            <line x1="20" y1="36" x2="17" y2="44" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="26" y1="36" x2="23" y2="44" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="32" y1="36" x2="29" y2="44" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="38" y1="36" x2="35" y2="44" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="44" y1="36" x2="41" y2="44" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'rain-heavy':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Very dark cloud */}
          <ellipse cx="32" cy="22" rx="15" ry="11" fill="#374151" />
          <ellipse cx="23" cy="24" rx="11" ry="9" fill="#374151" />
          <ellipse cx="41" cy="24" rx="11" ry="9" fill="#374151" />
          {/* Heavy rain drops */}
          <g className={animated ? "animate-rain-heavy" : ""}>
            <line x1="18" y1="34" x2="14" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
            <line x1="24" y1="34" x2="20" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
            <line x1="30" y1="34" x2="26" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
            <line x1="36" y1="34" x2="32" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
            <line x1="42" y1="34" x2="38" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
            <line x1="48" y1="34" x2="44" y2="46" stroke="#2563EB" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'thunderstorm':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Storm cloud */}
          <ellipse cx="32" cy="20" rx="16" ry="12" fill="#1F2937" />
          <ellipse cx="22" cy="22" rx="12" ry="10" fill="#1F2937" />
          <ellipse cx="42" cy="22" rx="12" ry="10" fill="#1F2937" />
          {/* Lightning */}
          <g className={animated ? "animate-flash" : ""}>
            <path
              d="M 34 30 L 30 42 L 36 42 L 28 54 L 32 44 L 26 44 L 34 30"
              fill="#FBBF24"
              stroke="#F59E0B"
              strokeWidth="1"
            />
          </g>
        </svg>
      );

    case 'snow-light':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Cloud */}
          <ellipse cx="32" cy="24" rx="14" ry="10" fill="#D1D5DB" />
          <ellipse cx="24" cy="26" rx="10" ry="8" fill="#D1D5DB" />
          <ellipse cx="40" cy="26" rx="10" ry="8" fill="#D1D5DB" />
          {/* Snowflakes */}
          <g className={animated ? "animate-snow" : ""}>
            <text x="22" y="42" fill="#E0E7FF" fontSize="8" opacity="0.9">❄</text>
            <text x="30" y="40" fill="#E0E7FF" fontSize="8" opacity="0.9">❄</text>
            <text x="38" y="42" fill="#E0E7FF" fontSize="8" opacity="0.9">❄</text>
          </g>
        </svg>
      );

    case 'snow':
    case 'snow-heavy':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Cloud */}
          <ellipse cx="32" cy="22" rx="15" ry="11" fill="#9CA3AF" />
          <ellipse cx="23" cy="24" rx="11" ry="9" fill="#9CA3AF" />
          <ellipse cx="41" cy="24" rx="11" ry="9" fill="#9CA3AF" />
          {/* Snowflakes */}
          <g className={animated ? "animate-snow" : ""}>
            <text x="18" y="40" fill="#E0E7FF" fontSize="10" opacity="0.95">❄</text>
            <text x="26" y="38" fill="#E0E7FF" fontSize="10" opacity="0.95">❄</text>
            <text x="34" y="40" fill="#E0E7FF" fontSize="10" opacity="0.95">❄</text>
            <text x="42" y="38" fill="#E0E7FF" fontSize="10" opacity="0.95">❄</text>
          </g>
        </svg>
      );

    case 'fog':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          <g opacity="0.7">
            <line x1="12" y1="20" x2="52" y2="20" stroke="#9CA3AF" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
            <line x1="16" y1="28" x2="48" y2="28" stroke="#9CA3AF" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
            <line x1="12" y1="36" x2="52" y2="36" stroke="#9CA3AF" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
            <line x1="18" y1="44" x2="46" y2="44" stroke="#9CA3AF" strokeWidth={strokeWidth + 1} strokeLinecap="round" />
          </g>
        </svg>
      );

    default:
      // Better fallback icon - generic weather symbol
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 64 64" className={baseClasses}>
          {/* Cloud with sun/moon hybrid */}
          <circle cx="24" cy="24" r="8" fill="#9CA3AF" opacity="0.5" />
          <ellipse cx="40" cy="36" rx="14" ry="10" fill="#6B7280" opacity="0.8" />
          <ellipse cx="32" cy="38" rx="10" ry="8" fill="#6B7280" opacity="0.8" />
          <ellipse cx="48" cy="38" rx="10" ry="8" fill="#6B7280" opacity="0.8" />
        </svg>
      );
  }
}