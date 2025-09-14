'use client';

import Link from 'next/link';
import { useThemeStore } from '@/store/theme';
import ThemedLayout from '@/components/layout/ThemedLayout';

export default function HomePage() {
  const { isDark } = useThemeStore();

  return (
    <main>
      {/* Hero Section with smoother transition */}
      <div
        className={`relative ${
          isDark
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
            : 'bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900'
        }`}
      >
        {/* Gradient transition overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 h-32 ${
            isDark
              ? 'bg-gradient-to-t from-black/80 via-gray-900/50 to-transparent'
              : 'bg-gradient-to-t from-gray-50/60 to-transparent'
          }`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1
              className={`text-4xl md:text-6xl font-bold mb-6 transition-all duration-500 ${
                isDark ? 'text-white' : 'text-white'
              }`}
            >
              Choose Your Adventure
            </h1>
            <p
              className={`text-xl mb-8 max-w-3xl mx-auto ${
                isDark ? 'text-purple-200' : 'text-blue-100'
              }`}
            >
              Discover amazing activities and plan your trips with real-time
              data from Google Places. Your next adventure awaits in the void.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 justify-center">
              <Link
                href="/auth/register"
                className={`flex items-center justify-center px-8 py-3 border text-base font-medium rounded-md transition-all duration-300 ${
                  isDark
                    ? 'border-blue-500/50 text-blue-200 hover:bg-blue-500/10 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105'
                    : 'border-cyan-400 text-cyan-100 hover:bg-cyan-400 hover:text-blue-900 hover:shadow-xl hover:shadow-cyan-400/60 hover:scale-105'
                }`}
              >
                Start Planning
              </Link>
              <Link
                href="/destinations"
                className={`flex items-center justify-center px-8 py-3 border text-base font-medium rounded-md transition-all duration-300 ${
                  isDark
                    ? 'border-pink-500/50 text-pink-200 hover:bg-pink-500/10 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105'
                    : 'border-orange-400 text-orange-100 hover:bg-orange-400 hover:text-purple-900 hover:shadow-xl hover:shadow-orange-400/60 hover:scale-105'
                }`}
              >
                Browse Destinations
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - no background, uses black from ThemedLayout */}
      <div className={`py-24 ${isDark ? '' : 'bg-gray-50/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl font-bold mb-4 ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              Current Features
            </h2>
            <p
              className={`text-lg max-w-2xl mx-auto ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Core travel planning tools that work today, with advanced features
              in development.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div
              className={`text-center p-8 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 ${
                isDark
                  ? 'bg-gray-800/60 border border-gray-700 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30'
                  : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-200/30'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-purple-500/20' : 'bg-blue-100'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-blue-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                Activity Discovery
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Browse hundreds of activities powered by Google Places API, with
                smart caching and real-time data for popular destinations.
              </p>
            </div>

            <div
              className={`text-center p-8 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 ${
                isDark
                  ? 'bg-gray-800/60 border border-gray-700 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30'
                  : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-300/50 hover:shadow-lg hover:shadow-purple-200/30'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                Trip Scheduling
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Schedule activities with timezone-aware conflict detection. No
                more double-booking across different time zones.
              </p>
            </div>

            <div
              className={`text-center p-8 rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-2 ${
                isDark
                  ? 'bg-gray-800/60 border border-gray-700 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30'
                  : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-green-300/50 hover:shadow-lg hover:shadow-green-200/30'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-purple-500/20' : 'bg-green-100'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-green-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3
                className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                Cost Tracking
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                Track estimated vs actual spending with city-specific cost
                adjustments and detailed trip budget summaries.
              </p>
            </div>
          </div>

          {/* Future Features Section */}
          <div
            className={`mt-24 pt-16 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="text-center mb-16">
              <h2
                className={`text-3xl font-bold mb-4 ${
                  isDark ? 'text-gray-100' : 'text-gray-900'
                }`}
              >
                Coming Soon
              </h2>
              <p
                className={`text-lg max-w-2xl mx-auto ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Advanced features in development to make your travel planning
                even smarter.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 opacity-60">
              <div
                className={`text-center p-8 rounded-2xl ${
                  isDark
                    ? 'bg-gray-800/40 border border-gray-700/50'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}
                >
                  <svg
                    className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  Flight & Hotel Data
                </h3>
                <p
                  className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Powered by Amadeus API - search flights, check hotel
                  availability, and get pricing estimates for complete trip
                  planning.
                </p>
                <p
                  className={`text-sm font-medium ${
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  }`}
                >
                  Coming Q4 2026
                </p>
              </div>

              <div
                className={`text-center p-8 rounded-2xl ${
                  isDark
                    ? 'bg-gray-800/40 border border-gray-700/50'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-red-500/20' : 'bg-red-100'
                  }`}
                >
                  <svg
                    className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  AI Trip Optimization
                </h3>
                <p
                  className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Smart recommendations based on your preferences, spending
                  patterns, and optimal activity sequencing using machine
                  learning.
                </p>
                <p
                  className={`text-sm font-medium ${
                    isDark ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  Coming Q4 2026
                </p>
              </div>

              <div
                className={`text-center p-8 rounded-2xl ${
                  isDark
                    ? 'bg-gray-800/40 border border-gray-700/50'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}
                >
                  <svg
                    className={`w-8 h-8 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  }`}
                >
                  Smart Route Planning
                </h3>
                <p
                  className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Google Maps integration for travel time calculations, route
                  optimization, and realistic scheduling between activities.
                </p>
                <p
                  className={`text-sm font-medium ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  Coming Q1 2027
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
