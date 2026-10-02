import React, { useState } from 'react';
import {
  Sun,
  SunDim,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudRainWind,
  CloudLightning,
  Droplets,
  Wind,
  RotateCw,
} from 'lucide-react';
import { useWeather } from '../../hooks/useWeather';
import { useApp } from '../../context/AppContext';

export const WeatherWidget: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const { weather, loading, refreshWeather } = useWeather(
    settings.weatherUnit,
    settings.weatherLocationMode,
    settings.manualCity,
    settings.manualLat,
    settings.manualLon
  );

  const [showDetails, setShowDetails] = useState(false);

  const toggleUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSettings({
      weatherUnit: settings.weatherUnit === 'c' ? 'f' : 'c',
    });
  };

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 text-amber-300 animate-pulse-subtle' };
    switch (iconName) {
      case 'Sun':
        return <Sun {...props} className="w-4 h-4 text-amber-400" />;
      case 'SunDim':
        return <SunDim {...props} className="w-4 h-4 text-amber-300" />;
      case 'CloudSun':
        return <CloudSun {...props} className="w-4 h-4 text-amber-200" />;
      case 'Cloud':
        return <Cloud {...props} className="w-4 h-4 text-slate-300" />;
      case 'CloudFog':
        return <CloudFog {...props} className="w-4 h-4 text-slate-300" />;
      case 'CloudDrizzle':
        return <CloudDrizzle {...props} className="w-4 h-4 text-cyan-300" />;
      case 'CloudRain':
        return <CloudRain {...props} className="w-4 h-4 text-blue-400" />;
      case 'CloudSnow':
        return <CloudSnow {...props} className="w-4 h-4 text-blue-200" />;
      case 'CloudRainWind':
        return <CloudRainWind {...props} className="w-4 h-4 text-indigo-300" />;
      case 'CloudLightning':
        return <CloudLightning {...props} className="w-4 h-4 text-amber-400" />;
      default:
        return <CloudSun {...props} className="w-4 h-4 text-amber-300" />;
    }
  };

  if (!weather && loading) {
    return (
      <div className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-white/50 animate-pulse">
        <Sun className="w-3.5 h-3.5 animate-spin" />
        <span>Loading weather...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        onClick={() => setShowDetails(!showDetails)}
        className="glass-pill px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-all duration-200 select-none shadow-glass-sm"
        title="Click for weather details"
      >
        {weather && renderIcon(weather.iconName)}
        <span className="text-sm font-semibold text-white">
          {weather?.temperature}°{settings.weatherUnit.toUpperCase()}
        </span>
        <span className="hidden sm:inline text-xs text-white/70 truncate max-w-[120px]">
          {weather?.condition}
        </span>
      </div>

      {/* Popover detailed info */}
      {showDetails && weather && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-12 z-50 w-64 glass-panel rounded-2xl p-4 shadow-glass-lg animate-scale-in text-xs text-white"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div>
              <p className="font-semibold text-sm text-white">{weather.city}</p>
              <p className="text-white/60 text-[11px]">{weather.condition}</p>
            </div>
            <button
              onClick={refreshWeather}
              title="Refresh weather"
              className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {renderIcon(weather.iconName)}
              <span className="text-2xl font-bold text-white font-display">
                {weather.temperature}°{settings.weatherUnit.toUpperCase()}
              </span>
            </div>
            <button
              onClick={toggleUnit}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors"
            >
              Switch to °{settings.weatherUnit === 'c' ? 'F' : 'C'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-white/70">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Humidity: {weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-300" />
              <span>Wind: {weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
