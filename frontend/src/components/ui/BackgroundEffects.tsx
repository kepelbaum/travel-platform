'use client';

import { useThemeStore } from '@/store/theme';

export default function BackgroundEffects() {
  const { isDark } = useThemeStore();

  // Generate static background stars (stay in place)
  const generateStaticStars = () => {
    return Array.from({ length: 75 }, (_, i) => {
      const isLarge = Math.random() > 0.8;

      return (
        <div
          key={`static-${i}`}
          className={`absolute rounded-full ${
            isLarge ? 'w-1 h-1' : 'w-0.5 h-0.5'
          } bg-white`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `twinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
            opacity: isLarge ? 0.7 : 0.3,
          }}
        />
      );
    });
  };

  // Generate moving background stars (travel across screen)
  const generateMovingStars = () => {
    return Array.from({ length: 113 }, (_, i) => {
      const isLarge = Math.random() > 0.8;
      const speed = Math.random() * 2 + 1;

      return (
        <div
          key={`moving-${i}`}
          className={`absolute rounded-full ${
            isLarge ? 'w-1 h-1' : 'w-0.5 h-0.5'
          } bg-white`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationName: 'twinkle, spaceshipMovement',
            animationDuration: `3s, ${15 / speed}s`,
            animationIterationCount: 'infinite, infinite',
            animationTimingFunction: 'ease-in-out, linear',
            animationDelay: `${Math.random() * 3}s, ${Math.random() * 5}s`,
            opacity: isLarge ? 0.8 : 0.4,
          }}
        />
      );
    });
  };

  // Generate overlay stars (in front of content)
  const generateOverlayStars = () => {
    return Array.from({ length: 63 }, (_, i) => {
      const isLarge = Math.random() > 0.8;
      const speed = Math.random() * 2 + 1;

      return (
        <div
          key={`overlay-${i}`}
          className={`absolute rounded-full ${
            isLarge ? 'w-1 h-1' : 'w-0.5 h-0.5'
          } bg-white pointer-events-none`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationName: 'twinkle, spaceshipMovement',
            animationDuration: `3s, ${15 / speed}s`,
            animationIterationCount: 'infinite, infinite',
            animationTimingFunction: 'ease-in-out, linear',
            animationDelay: `${Math.random() * 3}s, ${Math.random() * 5}s`,
            opacity: isLarge ? 0.8 : 0.4,
          }}
        />
      );
    });
  };

  return (
    <>
      {/* Background layer - behind content */}
      {isDark ? (
        <div className="fixed inset-0 z-0 overflow-hidden">
          {generateStaticStars()}
          {generateMovingStars()}
        </div>
      ) : (
        <div className="fixed inset-0 z-0 overflow-hidden">
          {/* Light floating particles */}
          {Array.from({ length: 25 }, (_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationName: 'gentleFloat',
                animationDuration: `${8 + Math.random() * 4}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out',
                animationDelay: `${Math.random() * 8}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay layer - in front of content, only for dark mode */}
      {isDark && (
        <div className="fixed inset-0 z-20 overflow-hidden pointer-events-none">
          {generateOverlayStars()}
        </div>
      )}

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes gentleFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-1deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }

        @keyframes spaceshipMovement {
          0% {
            transform: translateX(-20vw) translateY(0) scale(0.8);
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(120vw) translateY(-10vh) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
      `}</style>
    </>
  );
}
