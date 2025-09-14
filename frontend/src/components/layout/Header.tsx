'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-500 border-b ${
          isDark
            ? 'bg-gray-900/90 border-gray-700'
            : 'bg-white/90 border-gray-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with glow animation */}
            <Link
              href="/"
              className={`text-xl font-bold transition-all duration-500 ${
                isDark
                  ? 'text-white'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
              style={{
                animation: isDark
                  ? 'pulseGlow 3s ease-in-out infinite'
                  : 'none',
              }}
            >
              VoidWander
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/destinations"
                className={`transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:text-cyan-300'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Destinations
              </Link>
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className={`transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:text-cyan-300'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  My Trips
                </Link>
              )}
            </nav>

            {/* Desktop Auth + Theme Toggle */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span
                    className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Hello, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isDark
                        ? 'text-gray-300 hover:text-cyan-300'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 border-2 ${
                      isDark
                        ? 'border-gray-500 text-gray-300 hover:border-cyan-400 hover:text-cyan-400'
                        : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-400/50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                    : 'bg-black/10 hover:bg-black/20 border border-black/20'
                }`}
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                    : 'bg-black/10 hover:bg-black/20 border border-black/20'
                }`}
              >
                {isDark ? (
                  <svg
                    className="w-4 h-4 text-yellow-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md transition-colors ${
                  isDark
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu*/}
          {isMobileMenuOpen && (
            <div
              className={`md:hidden border-t pt-4 pb-3 ${
                isDark
                  ? 'border-gray-700 bg-gray-900/95'
                  : 'border-gray-300 bg-white/95'
              } backdrop-blur-md`}
            >
              {/* Navigation Links - centered and full-width touchable */}
              <div className="space-y-1 mb-4">
                <Link
                  href="/destinations"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block py-3 px-4 rounded-md transition-all duration-200 text-center font-medium ${
                    isDark
                      ? 'text-gray-300 hover:text-cyan-300 hover:bg-gray-800/50 active:bg-gray-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  Destinations
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-3 px-4 rounded-md transition-all duration-200 text-center font-medium ${
                      isDark
                        ? 'text-gray-300 hover:text-cyan-300 hover:bg-gray-800/50 active:bg-gray-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    My Trips
                  </Link>
                )}
              </div>

              {/* Auth Section - centered buttons */}
              {isAuthenticated ? (
                <div className="px-4">
                  <div
                    className={`text-center py-2 mb-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Hello, {user?.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className={`block w-full py-3 px-4 rounded-md transition-all duration-200 text-center font-medium cursor-pointer ${
                      isDark
                        ? 'text-gray-300 hover:text-cyan-300 hover:bg-gray-800/50 active:bg-gray-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-3 px-4">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-3 px-4 rounded-md text-center font-medium border-2 transition-all duration-300 ${
                      isDark
                        ? 'border-gray-500 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/10'
                        : 'border-gray-300 text-gray-600 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-3 px-4 rounded-md text-center font-medium transition-all duration-300 ${
                      isDark
                        ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-400 active:bg-cyan-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CSS for VoidWander glow animation */}
      <style jsx>{`
        @keyframes pulseGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 2px rgba(34, 211, 238, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))
              drop-shadow(0 0 15px rgba(34, 211, 238, 0.2));
          }
        }
      `}</style>
    </>
  );
}
