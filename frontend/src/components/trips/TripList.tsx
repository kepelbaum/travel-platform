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

  // Sort trips by start date (earliest to latest)
  const sortedTrips = trips.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2
          className={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
        >
          Your Trips
        </h2>
        <Link
          href="/dashboard/trips/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          New Trip
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedTrips.map((trip: Trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}
