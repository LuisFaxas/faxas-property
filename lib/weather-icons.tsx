import React from 'react';
import { cn } from '@/lib/utils';

export type WeatherCondition =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'wind'
  | 'unknown';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  temperature?: number; // For gradient effects
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48
};

// Map weather codes to our conditions
export function mapWeatherCode(code: number, isDay: boolean = true): WeatherCondition {
  // Based on standard weather API codes
  if (code === 1000) return isDay ? 'clear-day' : 'clear-night';
  if (code === 1003) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if ([1006, 1009].includes(code)) return 'cloudy';
  if ([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1240].includes(code)) return 'rain';
  if ([1192, 1195, 1198, 1201, 1243, 1246].includes(code)) return 'heavy-rain';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'thunderstorm';
  if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return 'snow';
  if ([1030, 1135, 1147].includes(code)) return 'fog';
  return 'unknown';
}

// Temperature-based gradient for background
export function getTemperatureGradient(temp?: number): string {
  if (!temp) return 'from-blue-500/20 to-blue-600/20';
  if (temp < 32) return 'from-blue-600/20 to-indigo-600/20'; // Freezing
  if (temp < 50) return 'from-blue-500/20 to-cyan-500/20'; // Cold
  if (temp < 70) return 'from-cyan-400/20 to-teal-400/20'; // Cool
  if (temp < 85) return 'from-amber-400/20 to-orange-400/20'; // Warm
  return 'from-orange-500/20 to-red-500/20'; // Hot
}

export function WeatherIcon({ condition, size = 'md', className, animated = true, temperature }: WeatherIconProps) {
  const pixelSize = sizeMap[size];
  const strokeWidth = size === 'sm' ? 2 : size === 'xl' ? 3 : 2.5;

  const baseClasses = cn(
    "weather-icon",
    animated && "animate-weather",
    className
  );

  switch (condition) {
    case 'clear-day':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <defs>
            <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="10"
            fill="url(#sunGradient)"
            className={animated ? "animate-pulse-slow" : ""}
          />
          {/* Sun rays */}
          <g className={animated ? "animate-spin-slow origin-center" : ""}>
            {[...Array(8)].map((_, i) => (
              <line
                key={i}
                x1="24"
                y1="8"
                x2="24"
                y2="2"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                transform={`rotate(${i * 45} 24 24)`}
              />
            ))}
          </g>
        </svg>
      );

    case 'clear-night':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <defs>
            <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="100%" stopColor="#C7D2FE" />
            </linearGradient>
          </defs>
          <path
            d="M 24 8 C 16 8 10 14 10 22 C 10 30 16 36 24 36 C 20 36 16 32 16 26 C 16 20 20 16 26 16 C 26 12 24 8 24 8"
            fill="url(#moonGradient)"
            className={animated ? "animate-pulse-slow" : ""}
          />
          {/* Stars */}
          <g className={animated ? "animate-twinkle" : ""}>
            <circle cx="36" cy="12" r="1" fill="#E0E7FF" />
            <circle cx="38" cy="20" r="1" fill="#E0E7FF" />
            <circle cx="32" cy="28" r="1" fill="#E0E7FF" />
          </g>
        </svg>
      );

    case 'partly-cloudy-day':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <defs>
            <linearGradient id="sunGradientPartly" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Sun behind */}
          <circle cx="18" cy="18" r="8" fill="url(#sunGradientPartly)" opacity="0.8" />
          {/* Cloud */}
          <g className={animated ? "animate-drift" : ""}>
            <path
              d="M 28 22 C 30 20 33 20 35 22 C 37 22 38 24 38 26 C 38 28 36 30 34 30 L 22 30 C 20 30 18 28 18 26 C 18 24 20 22 22 22 C 22 20 24 18 26 18 C 28 18 30 20 28 22"
              fill="white"
              opacity="0.9"
            />
          </g>
        </svg>
      );

    case 'cloudy':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <g className={animated ? "animate-drift" : ""}>
            {/* Back cloud */}
            <path
              d="M 20 18 C 22 16 25 16 27 18 C 29 18 30 20 30 22 C 30 24 28 26 26 26 L 14 26 C 12 26 10 24 10 22 C 10 20 12 18 14 18 C 14 16 16 14 18 14 C 20 14 22 16 20 18"
              fill="#E5E7EB"
              opacity="0.6"
            />
            {/* Front cloud */}
            <path
              d="M 28 24 C 30 22 33 22 35 24 C 37 24 38 26 38 28 C 38 30 36 32 34 32 L 22 32 C 20 32 18 30 18 28 C 18 26 20 24 22 24 C 22 22 24 20 26 20 C 28 20 30 22 28 24"
              fill="#9CA3AF"
            />
          </g>
        </svg>
      );

    case 'rain':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          {/* Cloud */}
          <path
            d="M 28 20 C 30 18 33 18 35 20 C 37 20 38 22 38 24 C 38 26 36 28 34 28 L 22 28 C 20 28 18 26 18 24 C 18 22 20 20 22 20 C 22 18 24 16 26 16 C 28 16 30 18 28 20"
            fill="#6B7280"
          />
          {/* Rain drops */}
          <g className={animated ? "animate-rain" : ""}>
            <line x1="20" y1="32" x2="18" y2="36" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="24" y1="32" x2="22" y2="36" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="28" y1="32" x2="26" y2="36" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="32" y1="32" x2="30" y2="36" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'heavy-rain':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          {/* Dark cloud */}
          <path
            d="M 28 18 C 30 16 33 16 35 18 C 37 18 38 20 38 22 C 38 24 36 26 34 26 L 22 26 C 20 26 18 24 18 22 C 18 20 20 18 22 18 C 22 16 24 14 26 14 C 28 14 30 16 28 18"
            fill="#4B5563"
          />
          {/* Heavy rain drops */}
          <g className={animated ? "animate-rain-heavy" : ""}>
            <line x1="18" y1="30" x2="15" y2="36" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="22" y1="30" x2="19" y2="36" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="26" y1="30" x2="23" y2="36" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="30" y1="30" x2="27" y2="36" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="34" y1="30" x2="31" y2="36" stroke="#3B82F6" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'thunderstorm':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          {/* Storm cloud */}
          <path
            d="M 28 16 C 30 14 33 14 35 16 C 37 16 38 18 38 20 C 38 22 36 24 34 24 L 22 24 C 20 24 18 22 18 20 C 18 18 20 16 22 16 C 22 14 24 12 26 12 C 28 12 30 14 28 16"
            fill="#374151"
          />
          {/* Lightning */}
          <g className={animated ? "animate-flash" : ""}>
            <path
              d="M 26 26 L 24 32 L 28 32 L 22 40 L 24 34 L 20 34 L 26 26"
              fill="#FBBF24"
              stroke="#F59E0B"
              strokeWidth="1"
            />
          </g>
        </svg>
      );

    case 'snow':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          {/* Cloud */}
          <path
            d="M 28 20 C 30 18 33 18 35 20 C 37 20 38 22 38 24 C 38 26 36 28 34 28 L 22 28 C 20 28 18 26 18 24 C 18 22 20 20 22 20 C 22 18 24 16 26 16 C 28 16 30 18 28 20"
            fill="#E5E7EB"
          />
          {/* Snowflakes */}
          <g className={animated ? "animate-snow" : ""}>
            <text x="20" y="36" fill="#E0E7FF" fontSize="8">❄</text>
            <text x="26" y="34" fill="#E0E7FF" fontSize="8">❄</text>
            <text x="32" y="36" fill="#E0E7FF" fontSize="8">❄</text>
          </g>
        </svg>
      );

    case 'fog':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <g opacity="0.6">
            <line x1="10" y1="16" x2="38" y2="16" stroke="#9CA3AF" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="12" y1="22" x2="36" y2="22" stroke="#9CA3AF" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="10" y1="28" x2="38" y2="28" stroke="#9CA3AF" strokeWidth={strokeWidth} strokeLinecap="round" />
            <line x1="14" y1="34" x2="34" y2="34" stroke="#9CA3AF" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'wind':
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <g className={animated ? "animate-wind" : ""}>
            <path d="M 10 20 L 30 20 C 32 20 34 18 34 16 C 34 14 32 12 30 12" stroke="#60A5FA" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
            <path d="M 10 28 L 32 28 C 35 28 38 31 38 34 C 38 37 35 40 32 40" stroke="#93C5FD" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
            <line x1="10" y1="24" x2="26" y2="24" stroke="#60A5FA" strokeWidth={strokeWidth} strokeLinecap="round" />
          </g>
        </svg>
      );

    default:
      return (
        <svg width={pixelSize} height={pixelSize} viewBox="0 0 48 48" className={baseClasses}>
          <circle cx="24" cy="24" r="2" fill="#9CA3AF" />
          <text x="24" y="30" textAnchor="middle" fill="#9CA3AF" fontSize="12">?</text>
        </svg>
      );
  }
}

// Add these CSS animations to your global styles
export const weatherAnimations = `
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes drift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

@keyframes rain {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(8px); opacity: 0; }
}

@keyframes rain-heavy {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(10px); opacity: 0; }
}

@keyframes snow {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(10px) rotate(360deg); opacity: 0.5; }
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes wind {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(2px); }
  75% { transform: translateX(-2px); }
}

.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 20s linear infinite; }
.animate-drift { animation: drift 4s ease-in-out infinite; }
.animate-rain { animation: rain 1s linear infinite; }
.animate-rain-heavy { animation: rain-heavy 0.8s linear infinite; }
.animate-snow { animation: snow 3s linear infinite; }
.animate-flash { animation: flash 2s ease-in-out infinite; }
.animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
.animate-wind { animation: wind 2s ease-in-out infinite; }

.origin-center { transform-origin: center; }
`;