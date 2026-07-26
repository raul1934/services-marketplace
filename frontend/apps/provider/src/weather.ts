import type { WeatherType } from './field/api';

export const WEATHER_TYPES: { type: WeatherType; label: string; icon: string }[] = [
  { type: 'claro', label: 'Claro', icon: '☀️' },
  { type: 'parcialmente-nublado', label: 'Parcialmente nublado', icon: '⛅' },
  { type: 'nublado', label: 'Nublado', icon: '☁️' },
  { type: 'chuvoso', label: 'Chuvoso', icon: '🌧️' },
  { type: 'tempestade', label: 'Tempestade', icon: '⛈️' },
  { type: 'neblina', label: 'Neblina', icon: '🌫️' },
];

export const weatherOf = (type: WeatherType) => WEATHER_TYPES.find((w) => w.type === type);
