'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { tripsApi } from '@/lib/api';
import { Trip } from '@/types';
import { TripCard } from './TripCard';
import Link from 'next/link';
import { useThemeStore } from '@/store/theme';

export default function TripList() {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  const {
    data: trips = [],
    isLoading,
    error,
  } = useQuery<Trip[]>({
    queryKey: ['trips', user?.id],
    queryFn: () => {
      return tripsApi.getUserTrips(user?.id || 0);
    },
    enabled: !!user?.id,
  });

  // Helper function to check if a trip is completed (end date is in the past)
  const isCompletedTrip = (trip: Trip) => {
    const today = new Date();
    const endDate = new Date(trip.endDate);
    return endDate < today;
  };

  // Separate trips into upcoming/current and completed
  const upcomingTrips = trips
    .filter((trip) => !isCompletedTrip(trip))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const completedTrips = trips
    .filter((trip) => isCompletedTrip(trip))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <h3
          className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
        >
          No trips yet
        </h3>
        <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Start planning your next adventure!
        </p>
        <Link
          href="/dashboard/trips/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Your First Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming/Current Trips */}
      {upcomingTrips.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h2
                className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
              >
                Your Trips
              </h2>
              <span
                className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                  isDark
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {upcomingTrips.length}
              </span>
            </div>
            <Link
              href="/dashboard/trips/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              New Trip
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTrips.map((trip: Trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Trips */}
      {completedTrips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center">
            <h2
              className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            >
              Completed Trips
            </h2>
            <span
              className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                isDark
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedTrips.length}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTrips.map((trip: Trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* Show New Trip button if no upcoming trips but there are completed ones */}
      {upcomingTrips.length === 0 && completedTrips.length > 0 && (
        <div className="text-center py-8">
          <h3
            className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            Ready for your next adventure?
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Plan a new trip to add to your collection!
          </p>
          <Link
            href="/dashboard/trips/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Plan New Trip
          </Link>
        </div>
      )}
    </div>
  );
}
