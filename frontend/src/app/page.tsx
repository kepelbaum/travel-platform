import { Metadata } from 'next';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'VoidWander - Explore the Unknown',
  description:
    'Plan your perfect trip with intelligent recommendations and seamless travel planning.',
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
                Plan your perfect trip with intelligent recommendations,
                seamless booking, and real-time travel insights. Your next
                adventure awaits in the void.
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
                Why Choose VoidWander?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We make travel planning effortless with smart tools and
                personalized recommendations.
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Smart Planning
                </h3>
                <p className="text-gray-600">
                  AI-powered recommendations help you discover the perfect
                  destinations and create optimized itineraries.
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Budget Tracking
                </h3>
                <p className="text-gray-600">
                  Keep your travel costs under control with real-time budget
                  tracking and spending insights.
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Updates
                </h3>
                <p className="text-gray-600">
                  Get instant notifications about price changes, weather
                  updates, and travel advisories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
