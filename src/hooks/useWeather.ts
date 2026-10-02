import { useState, useEffect, useCallback } from 'react';
import { WeatherData, WeatherUnit } from '../types';

export function mapWmoCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: 'Sun' };
  if (code === 1) return { condition: 'Mainly Clear', icon: 'SunDim' };
  if (code === 2) return { condition: 'Partly Cloudy', icon: 'CloudSun' };
  if (code === 3) return { condition: 'Overcast', icon: 'Cloud' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { condition: 'Snowfall', icon: 'CloudSnow' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'CloudRainWind' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'CloudLightning' };
  return { condition: 'Partly Cloudy', icon: 'CloudSun' };
}

export function useWeather(
  unit: WeatherUnit = 'c',
  locationMode: 'auto' | 'manual' = 'auto',
  manualCity: string = 'San Francisco',
  manualLat?: number,
  manualLon?: number
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    let lat = manualLat || 37.7749;
    let lon = manualLon || -122.4194;
    let cityName = manualCity || 'San Francisco';

    if (locationMode === 'auto' && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 7000,
            maximumAge: 600000,
          });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        cityName = 'Local Weather';
      } catch {
        // Fall back to manual or IP/default
        console.warn('Geolocation denied or timed out, using fallback coordinates.');
      }
    } else if (locationMode === 'manual' && manualCity && (!manualLat || !manualLon)) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualCity)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
          cityName = `${geoData.results[0].name}${geoData.results[0].admin1 ? ', ' + geoData.results[0].admin1 : ''}`;
        }
      } catch (e) {
        console.warn('Failed to geocode manual city:', e);
      }
    }

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
      );
      if (!weatherRes.ok) throw new Error('Weather API returned error status');

      const data = await weatherRes.json();
      const current = data.current;
      const daily = data.daily;
      const { condition, icon } = mapWmoCode(current.weather_code);

      let temp = current.temperature_2m;
      let maxTemp = daily?.temperature_2m_max?.[0];
      let minTemp = daily?.temperature_2m_min?.[0];

      if (unit === 'f') {
        temp = (temp * 9) / 5 + 32;
        if (maxTemp !== undefined) maxTemp = (maxTemp * 9) / 5 + 32;
        if (minTemp !== undefined) minTemp = (minTemp * 9) / 5 + 32;
      }

      setWeather({
        city: cityName,
        temperature: Math.round(temp),
        condition,
        weatherCode: current.weather_code,
        iconName: icon,
        windSpeed: Math.round(current.wind_speed_10m),
        humidity: current.relative_humidity_2m,
        high: maxTemp !== undefined ? Math.round(maxTemp) : undefined,
        low: minTemp !== undefined ? Math.round(minTemp) : undefined,
        lastUpdated: Date.now(),
      });
      setLoading(false);
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      setError('Unable to load weather');
      // If we don't have weather, provide an elegant minimal placeholder
      if (!weather) {
        setWeather({
          city: cityName,
          temperature: unit === 'c' ? 21 : 70,
          condition: 'Partly Cloudy',
          weatherCode: 2,
          iconName: 'CloudSun',
          windSpeed: 8,
          humidity: 55,
          lastUpdated: Date.now(),
        });
      }
      setLoading(false);
    }
  }, [unit, locationMode, manualCity, manualLat, manualLon]);

  useEffect(() => {
    fetchWeather();
    // Refresh every 20 minutes
    const interval = setInterval(fetchWeather, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, loading, error, refreshWeather: fetchWeather };
}
