import { Metadata } from 'next';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'VoidWander - Explore the Unknown',
  description:
    'Plan your perfect trip with activity discovery and travel planning.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <div className="bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Explore the Unknown
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Discover amazing activities and plan your trips with real-time
                data from Google Places. Your next adventure awaits in the void.
              </p>
              <div className="space-x-4">
                <a
                  href="/auth/register"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Start Planning
                </a>
                <a
                  href="/destinations"
                  className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-700 transition-colors"
                >
                  Browse Destinations
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Current Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Core travel planning tools that work today, with advanced
                features in development.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Activity Discovery
                </h3>
                <p className="text-gray-600">
                  Browse hundreds of activities powered by Google Places API,
                  with smart caching and real-time data for popular
                  destinations.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Trip Scheduling
                </h3>
                <p className="text-gray-600">
                  Schedule activities with timezone-aware conflict detection. No
                  more double-booking across different time zones.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Cost Tracking
                </h3>
                <p className="text-gray-600">
                  Track estimated vs actual spending with city-specific cost
                  adjustments and detailed trip budget summaries.
                </p>
              </div>
            </div>

            {/* Future Features Section */}
            <div className="mt-24 pt-16 border-t border-gray-200">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Coming Soon
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Advanced features in development to make your travel planning
                  even smarter.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 opacity-60">
                {/* Amadeus Integration */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-orange-600"
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Flight & Hotel Data
                  </h3>
                  <p className="text-gray-600">
                    Powered by Amadeus API - search flights, check hotel
                    availability, and get pricing estimates for complete trip
                    planning.
                  </p>
                  <p className="text-sm text-orange-600 mt-2 font-medium">
                    Coming Q4 2026
                  </p>
                </div>

                {/* AI Recommendations */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI Trip Optimization
                  </h3>
                  <p className="text-gray-600">
                    Smart recommendations based on your preferences, spending
                    patterns, and optimal activity sequencing using machine
                    learning.
                  </p>
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Coming Q4 2026
                  </p>
                </div>

                {/* Google Maps Integration */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-indigo-600"
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Smart Route Planning
                  </h3>
                  <p className="text-gray-600">
                    Google Maps integration for travel time calculations, route
                    optimization, and realistic scheduling between activities.
                  </p>
                  <p className="text-sm text-indigo-600 mt-2 font-medium">
                    Coming Q1 2027
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
