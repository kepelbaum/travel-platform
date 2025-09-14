'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { tripsApi } from '@/lib/api';
import { Trip } from '@/types';
import { use } from 'react';
import TripForm from '@/components/forms/TripForm';
import { useRouter } from 'next/navigation';

interface EditTripPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default function EditTripPage({ params }: EditTripPageProps) {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const { tripId: tripIdString } = use(params);
  const tripId = parseInt(tripIdString);
  const router = useRouter();

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTripById(tripId, user?.id || 0),
    enabled: !!user?.id && !!tripId,
  });

  if (isLoading) {
    return (
      <main className="py-12 pb-32 sm:pb-24">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-24">
        <div className="text-center py-12">
          <div
            className={`w-16 h-16 mx-auto mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09m0 0L4 20h16l-2.709-2.91z"
              />
            </svg>
          </div>
          <h1
            className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          >
            Trip Not Found
          </h1>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            The trip you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <button
            onClick={() => router.back()}
            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer ${
              isDark
                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 hover:border-gray-500'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const initialData = {
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: trip.budget || undefined,
  };

  return (
    <main className="py-12 pb-32 sm:pb-24">
      <TripForm initialData={initialData} tripId={trip.id} />
    </main>
  );
}
