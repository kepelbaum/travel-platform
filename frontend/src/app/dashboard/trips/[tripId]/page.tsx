'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { tripsApi } from '@/lib/api';
import { Trip } from '@/types';
import { useState, use } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { DestinationMiniCard } from '@/components/destinations/DestinationMiniCard';
import { TripDetails } from '@/components/trips/TripDetails';
import { DeleteTripModal } from '@/components/trips/DeleteTripModal';

interface TripDetailsPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { tripId: tripIdString } = use(params);
  const tripId = parseInt(tripIdString);

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTripById(tripId, user?.id || 0),
    enabled: !!user?.id && !!tripId,
    staleTime: 0, // Data is stale immediately
    gcTime: 0, // Don't cache at all
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      return tripsApi.deleteTrip(tripId, user?.id || 0);
    },
    onSuccess: async () => {
      // Force immediate refetch of trips list
      await queryClient.refetchQueries({
        queryKey: ['trips', user?.id],
        type: 'active',
      });

      router.push('/dashboard?tripDeleted=true');
    },
    onError: (error) => {},
  });
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PLANNED':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleRemoveDestination = (destinationId: number) => {
    // TODO: Implement remove destination functionality
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error?.message.includes('404')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09m0 0L4 20h16l-2.709-2.91z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Trip Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The trip you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {trip && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {trip.name}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}
                  >
                    {trip.status}
                  </span>
                  <span className="text-gray-500">
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <Link
                  href={`/dashboard/trips/${trip.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Trip
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Delete Trip
                </button>
              </div>
            </div>
          </div>

          <TripDetails trip={trip} />

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Destinations
                </h2>
                <Link
                  href="/destinations"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Destinations
                </Link>
              </div>

              {!trip.destinations || trip.destinations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No destinations yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start building your itinerary by adding some destinations to
                    visit.
                  </p>
                  <Link
                    href="/destinations"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Destinations
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trip.destinations.map((destination) => (
                    <DestinationMiniCard
                      key={destination.id}
                      destination={destination}
                      onRemove={() => handleRemoveDestination(destination.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {showDeleteConfirm && (
            <DeleteTripModal
              trip={trip}
              isDeleting={deleteMutation.isPending}
              onConfirm={handleDelete}
              onCancel={() => setShowDeleteConfirm(false)}
            />
          )}
        </main>
      )}
    </div>
  );
}
