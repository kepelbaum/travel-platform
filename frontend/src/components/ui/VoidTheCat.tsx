'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/store/theme';

export default function VoidTheCat() {
  const { isDark } = useThemeStore();
  const [catMessage, setCatMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isEvilMessage, setIsEvilMessage] = useState(false);

  useEffect(() => {
    // Random cat messages
    const showRandomMessage = () => {
      const darkMessages = [
        'The void whispers secrets...',
        'Ready to explore the unknown?',
        'Stars align for your journey...',
        'Adventure calls from the depths...',
        'Time to wander through infinity...',
      ];

      const evilMessages = [
        'Your soul belongs to the void now...',
        'I see everything you click...',
        'The darkness grows stronger...',
        'Your dreams are mine to collect...',
      ];

      const lightMessages = [
        'Meow! Adventure time!',
        "Let's discover new places!",
        'Purr... so many destinations!',
        'Ready for a new sunny adventure?',
        "Let's plan something amazing!",
        'The world is full of wonders!',
        'Time to explore and discover!',
      ];

      if (Math.random() > 0.8) {
        // 20% chance to show message
        const isEvil = isDark && Math.random() > 0.85; // 15% chance for evil message in dark mode
        const messages = isEvil
          ? evilMessages
          : isDark
            ? darkMessages
            : lightMessages;
        const message = messages[Math.floor(Math.random() * messages.length)];

        setCatMessage(message);
        setIsEvilMessage(isEvil);
        setShowMessage(true);

        setTimeout(() => {
          setShowMessage(false);
          setCatMessage('');
          setIsEvilMessage(false);
        }, 3500);
      }
    };

    const interval = setInterval(showRandomMessage, 6000);
    return () => clearInterval(interval);
  }, [isDark]);

  const handleCatClick = () => {
    const messages = isDark
      ? [
          'Purr... hello there...',
          'The void calls to you...',
          'Ready to explore the darkness?',
        ]
      : [
          'Meow! Adventure time!',
          "Let's discover new places!",
          'Purr... so many destinations!',
        ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    setCatMessage(message);
    setIsEvilMessage(false);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  };

  return (
    <>
      {/* Cat speech bubble */}
      {showMessage && (
        <div
          className={`fixed bottom-22 sm:bottom-32 right-3 sm:right-5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg backdrop-blur-sm z-50 animate-bounce border max-w-xs ${
            isEvilMessage
              ? 'bg-red-900/90 border-red-500/60 shadow-lg shadow-red-500/20'
              : isDark
                ? 'bg-gray-900/90 border-purple-400/30'
                : 'bg-white/95 border-orange-300'
          }`}
        >
          <div
            className={`text-xs sm:text-sm ${
              isEvilMessage
                ? 'text-red-200'
                : isDark
                  ? 'text-purple-200'
                  : 'text-orange-600'
            }`}
          >
            {catMessage}
          </div>
          <div
            className={`absolute bottom-0 right-6 sm:right-8 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent transform translate-y-full ${
              isEvilMessage
                ? 'border-t-red-900/90'
                : isDark
                  ? 'border-t-gray-900/90'
                  : 'border-t-white/95'
            }`}
          />
        </div>
      )}

      {/* Void the Cat - responsive sizing */}
      <div
        className={`fixed bottom-3 right-3 sm:bottom-5 sm:right-5 w-16 h-16 sm:w-20 sm:h-20 rounded-full z-50 cursor-pointer transition-all duration-300 hover:scale-110 shadow-lg border-2 ${
          isDark
            ? 'bg-black border-purple-400/30'
            : 'bg-white border-orange-400/60'
        }`}
        style={{
          animationName: 'float',
          animationDuration: '3s',
          animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
          boxShadow: isDark
            ? '0 0 20px rgba(139, 92, 246, 0.3)'
            : '0 0 15px rgba(249, 115, 22, 0.5)',
        }}
        title={isDark ? 'Void the Cat' : 'Sunny the Cat'}
        onClick={handleCatClick}
      >
        {/* Large triangular ears */}
        <div
          className={`absolute -top-2 sm:-top-3 left-1 sm:left-2 w-0 h-0 border-l-4 border-r-4 border-b-6 sm:border-l-6 sm:border-r-6 sm:border-b-8 border-transparent ${
            isDark ? 'border-b-black' : 'border-b-white'
          }`}
        />
        <div
          className={`absolute -top-2 sm:-top-3 right-1 sm:right-2 w-0 h-0 border-l-4 border-r-4 border-b-6 sm:border-l-6 sm:border-r-6 sm:border-b-8 border-transparent ${
            isDark ? 'border-b-black' : 'border-b-white'
          }`}
        />

        {/* Inner ears */}
        <div
          className={`absolute -top-1 sm:-top-2 left-2 sm:left-3 w-0 h-0 border-l-2 border-r-2 border-b-3 sm:border-l-4 sm:border-r-4 sm:border-b-5 border-transparent ${
            isDark ? 'border-b-purple-400' : 'border-b-orange-400'
          }`}
        />
        <div
          className={`absolute -top-1 sm:-top-2 right-2 sm:right-3 w-0 h-0 border-l-2 border-r-2 border-b-3 sm:border-l-4 sm:border-r-4 sm:border-b-5 border-transparent ${
            isDark ? 'border-b-purple-400' : 'border-b-orange-400'
          }`}
        />

        {/* Eyes */}
        <div
          className={`absolute top-4 sm:top-5 left-4 sm:left-5 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
            isDark ? 'bg-purple-400' : 'bg-green-500'
          }`}
          style={{
            animationName: 'blink',
            animationDuration: '4s',
            animationIterationCount: 'infinite',
          }}
        />
        <div
          className={`absolute top-4 sm:top-5 right-4 sm:right-5 w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
            isDark ? 'bg-purple-400' : 'bg-green-500'
          }`}
          style={{
            animationName: 'blink',
            animationDuration: '4s',
            animationIterationCount: 'infinite',
          }}
        />

        {/* Extended whiskers */}
        <div
          className={`absolute top-5 sm:top-7 -left-3 sm:-left-4 w-6 h-px sm:w-8 ${
            isDark ? 'bg-purple-300/60' : 'bg-orange-300/80'
          } opacity-60`}
        />
        <div
          className={`absolute top-6 sm:top-8 -left-2 sm:-left-3 w-4 h-px sm:w-6 ${
            isDark ? 'bg-purple-300/60' : 'bg-orange-300/80'
          } opacity-60`}
        />
        <div
          className={`absolute top-5 sm:top-7 -right-3 sm:-right-4 w-6 h-px sm:w-8 ${
            isDark ? 'bg-purple-300/60' : 'bg-orange-300/80'
          } opacity-60`}
        />
        <div
          className={`absolute top-6 sm:top-8 -right-2 sm:-right-3 w-4 h-px sm:w-6 ${
            isDark ? 'bg-purple-300/60' : 'bg-orange-300/80'
          } opacity-60`}
        />
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes blink {
          0%,
          90%,
          100% {
            opacity: 1;
          }
          95% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
