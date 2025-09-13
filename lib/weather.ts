/**
 * Weather service using Open-Meteo API
 * Includes workability calculations for construction
 */

interface WeatherResponse {
  location: {
    city?: string;
    state?: string;
    address: string;
  };
  current: {
    tempF: number;
    apparentF: number;
    humidity: number;
    windMph: number;
    precipMmHr: number;
    code: number;
    text: string;
  };
  workability: {
    score: number;
    label: 'Good' | 'Fair' | 'Poor';
    reasons: string[];
    bestWindow?: {
      startISO: string;
      endISO: string;
    };
  };
  today: {
    events: number;
  };
  hourly: Array<{
    timeISO: string;
    tempF: number;
    windMph: number;
    precipMmHr: number;
    code: number;
  }>;
  daily: Array<{
    dateISO: string;
    maxF: number;
    minF: number;
    precipMm: number;
    code: number;
  }>;
}

/**
 * Get weather condition text from WMO code
 */
function getWeatherText(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
  };
  return conditions[code] || 'Unknown';
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return Math.round(celsius * 9 / 5 + 32);
}

/**
 * Convert km/h to mph
 */
function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

/**
 * Compute workability based on weather conditions
 */
export function computeWorkability(data: {
  current: any;
  hourly: any;
}): {
  score: number;
  label: 'Good' | 'Fair' | 'Poor';
  reasons: string[];
  bestWindow?: { start: string; end: string };
} {
  const reasons: string[] = [];
  let score = 100;

  const currentHour = new Date().getHours();
  const current = data.current;

  // Temperature factors
  const tempF = celsiusToFahrenheit(current.temperature_2m);
  if (tempF < 32) {
    score -= 40;
    reasons.push('Freezing conditions');
  } else if (tempF < 40) {
    score -= 25;
    reasons.push('Very cold');
  } else if (tempF > 95) {
    score -= 30;
    reasons.push('Extreme heat');
  } else if (tempF > 85) {
    score -= 15;
    reasons.push('High temperature');
  }

  // Wind factors
  const windMph = kmhToMph(current.wind_speed_10m);
  if (windMph > 35) {
    score -= 40;
    reasons.push('Dangerous winds');
  } else if (windMph > 25) {
    score -= 25;
    reasons.push('Strong winds');
  } else if (windMph > 15) {
    score -= 10;
    reasons.push('Moderate winds');
  }

  // Precipitation factors
  const precipMm = current.precipitation || 0;
  if (precipMm > 10) {
    score -= 50;
    reasons.push('Heavy precipitation');
  } else if (precipMm > 5) {
    score -= 30;
    reasons.push('Moderate precipitation');
  } else if (precipMm > 0) {
    score -= 15;
    reasons.push('Light precipitation');
  }

  // Weather code factors
  const code = current.weather_code;
  if (code >= 95) {
    score -= 50;
    reasons.push('Thunderstorm');
  } else if (code >= 80 && code <= 82) {
    score -= 30;
    reasons.push('Rain showers');
  } else if (code >= 71 && code <= 77) {
    score -= 35;
    reasons.push('Snow conditions');
  }

  // Find best window in next 8 hours
  let bestWindow: { start: string; end: string } | undefined;
  if (data.hourly && data.hourly.time) {
    const times = data.hourly.time.slice(currentHour, currentHour + 8);
    const temps = data.hourly.temperature_2m.slice(currentHour, currentHour + 8);
    const precip = data.hourly.precipitation.slice(currentHour, currentHour + 8);
    const wind = data.hourly.wind_speed_10m.slice(currentHour, currentHour + 8);

    let bestStart = -1;
    let bestEnd = -1;
    let inGoodWindow = false;

    for (let i = 0; i < times.length; i++) {
      const tempF = celsiusToFahrenheit(temps[i]);
      const windMph = kmhToMph(wind[i]);
      const precipMm = precip[i];

      const isGood = tempF >= 40 && tempF <= 85 && windMph < 15 && precipMm === 0;

      if (isGood && !inGoodWindow) {
        bestStart = i;
        inGoodWindow = true;
      } else if (!isGood && inGoodWindow) {
        bestEnd = i - 1;
        break;
      }
    }

    if (inGoodWindow && bestEnd === -1) {
      bestEnd = times.length - 1;
    }

    if (bestStart !== -1 && bestEnd !== -1) {
      bestWindow = {
        start: times[bestStart],
        end: times[bestEnd]
      };
    }
  }

  // Determine label
  let label: 'Good' | 'Fair' | 'Poor';
  if (score >= 70) {
    label = 'Good';
  } else if (score >= 40) {
    label = 'Fair';
  } else {
    label = 'Poor';
  }

  // If no reasons but score is low, add generic reason
  if (reasons.length === 0 && score < 100) {
    reasons.push('Suboptimal conditions');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    reasons,
    bestWindow
  };
}

/**
 * Fetch weather from Open-Meteo API
 */
export async function fetchWeather(
  lat: number,
  lng: number,
  tz: string = 'America/New_York'
): Promise<any> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: tz,
    forecast_days: '3'
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
    throw new Error('Unknown weather fetch error');
  }
}

/**
 * Format weather data for API response
 */
export function formatWeatherResponse(
  data: any,
  address: string,
  events: number = 0
): WeatherResponse {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;

  // Parse location from address
  const parts = address.split(',').map(p => p.trim());
  const city = parts[0];
  const state = parts.length > 1 ? parts[parts.length - 1] : undefined;

  // Compute workability
  const workability = computeWorkability({ current, hourly });

  // Format hourly (next 8 hours)
  const currentHour = new Date().getHours();
  const hourlyFormatted = [];
  if (hourly && hourly.time) {
    for (let i = currentHour; i < Math.min(currentHour + 8, hourly.time.length); i++) {
      hourlyFormatted.push({
        timeISO: hourly.time[i],
        tempF: celsiusToFahrenheit(hourly.temperature_2m[i]),
        windMph: kmhToMph(hourly.wind_speed_10m[i]),
        precipMmHr: hourly.precipitation[i],
        code: hourly.weather_code[i]
      });
    }
  }

  // Format daily (next 3 days)
  const dailyFormatted = [];
  if (daily && daily.time) {
    for (let i = 0; i < Math.min(3, daily.time.length); i++) {
      dailyFormatted.push({
        dateISO: daily.time[i],
        maxF: celsiusToFahrenheit(daily.temperature_2m_max[i]),
        minF: celsiusToFahrenheit(daily.temperature_2m_min[i]),
        precipMm: daily.precipitation_sum[i],
        code: daily.weather_code[i]
      });
    }
  }

  return {
    location: {
      city,
      state,
      address
    },
    current: {
      tempF: celsiusToFahrenheit(current.temperature_2m),
      apparentF: celsiusToFahrenheit(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windMph: kmhToMph(current.wind_speed_10m),
      precipMmHr: current.precipitation,
      code: current.weather_code,
      text: getWeatherText(current.weather_code)
    },
    workability: {
      score: workability.score,
      label: workability.label,
      reasons: workability.reasons,
      bestWindow: workability.bestWindow ? {
        startISO: workability.bestWindow.start,
        endISO: workability.bestWindow.end
      } : undefined
    },
    today: {
      events
    },
    hourly: hourlyFormatted,
    daily: dailyFormatted
  };
}