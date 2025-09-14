'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { destinationsApi } from '@/lib/api';
import { Destination } from '@/types';
import { useMemo } from 'react';
import { DestinationCard } from './DestinationCard';
import { useTripPlanningStore } from '@/store/tripPlanning';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/store/theme';

export default function DestinationList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeTrip, clearActiveTrip } = useTripPlanningStore();
  const { isDark } = useThemeStore();

  const router = useRouter();

  const { data: allDestinations = [], isLoading } = useQuery({
    queryKey: ['destinations', 'all'],
    queryFn: () => destinationsApi.getAllDestinations(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return allDestinations;

    const query = searchQuery.toLowerCase();
    return allDestinations.filter((destination) =>
      destination.name.toLowerCase().includes(query)
    );
  }, [allDestinations, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1
            className={`text-2xl sm:text-3xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            Explore Destinations
          </h1>

          {activeTrip && (
            <div
              className={`mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg px-3 sm:px-4 py-3 border space-y-2 sm:space-y-0 ${
                isDark
                  ? 'bg-blue-900/30 border-blue-700/50 backdrop-blur-sm'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <span
                  className={`font-medium text-sm sm:text-base ${isDark ? 'text-blue-300' : 'text-blue-800'}`}
                >
                  🎯 Planning: {activeTrip.name}
                </span>
                <span
                  className={`text-xs sm:text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  {activeTrip.destinations?.length || 0} destination
                  {(activeTrip.destinations?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-center">
                <Link
                  href={`/dashboard/trips/${activeTrip.id}`}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                    isDark
                      ? 'text-blue-400 hover:text-blue-300'
                      : 'text-blue-700 hover:text-blue-800'
                  }`}
                >
                  View Trip
                </Link>
                <button
                  onClick={() => {
                    clearActiveTrip();
                    router.push('/dashboard');
                  }}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors cursor-pointer ${
                    isDark
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Back to Trips
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className={`flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-l-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              <button
                type="submit"
                className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-l-0 rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap ${
                  isDark
                    ? 'border-gray-600 bg-blue-600 text-white hover:bg-blue-700'
                    : 'border-gray-300 bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDestinations.map((destination: Destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </div>
    </div>
  );
}
