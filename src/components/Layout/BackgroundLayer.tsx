import React from 'react';
import { useApp } from '../../context/AppContext';

export const BackgroundLayer: React.FC = () => {
  const { wallpaper, settings } = useApp();

  const isGradient = wallpaper.url?.startsWith('linear-gradient') || wallpaper.type === 'gradient';
  const isPureBlack = settings.themePreset === 'pureblack';

  // CSS filter calculations
  const filterStyle = {
    filter: `brightness(${wallpaper.brightness}%) blur(${wallpaper.blur}px) contrast(${wallpaper.contrast}%) saturate(${wallpaper.saturation}%)`,
    transform: wallpaper.blur > 0 ? 'scale(1.04)' : 'scale(1)', // prevent white border blur artifacts
  };

  const overlayStyle = {
    backgroundColor: isPureBlack
      ? `rgba(0, 0, 0, ${Math.max(wallpaper.overlayOpacity / 100, 0.4)})`
      : `rgba(0, 0, 0, ${wallpaper.overlayOpacity / 100})`,
  };

  const transitionDuration = settings.reduceMotion ? 'duration-0' : 'duration-700';

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 ${isPureBlack ? 'bg-black' : 'bg-[#07090e]'}`}>
      {/* Background Image or Gradient */}
      <div
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all ${transitionDuration} ease-out`}
        style={{
          backgroundImage: isGradient ? wallpaper.url : `url(${wallpaper.url})`,
          ...filterStyle,
        }}
      />

      {/* Dimming overlay */}
      <div
        className={`absolute inset-0 w-full h-full transition-colors ${settings.reduceMotion ? 'duration-0' : 'duration-500'}`}
        style={overlayStyle}
      />

      {/* Vignette effect */}
      {wallpaper.vignette > 0 && (
        <div
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity ${settings.reduceMotion ? 'duration-0' : 'duration-500'}`}
          style={{
            background: `radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, ${
              wallpaper.vignette / 100
            }) 100%)`,
          }}
        />
      )}

      {/* Subtle scanline / film grain shimmer */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/[0.03] to-black/[0.25] pointer-events-none" />
    </div>
  );
};
