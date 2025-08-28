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
import ActivityBrowser from '@/components/activities/ActivityBrowser';
import TripTimeline from '@/components/trip-activities/TripTimeline';
import { useTripPlanningStore } from '@/store/tripPlanning';
import { getCountryFlag } from '@/lib/utils/CountryFlagHelper';

interface TripDetailsPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'activities'
  >('overview');
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    number | null
  >(null);

  const { tripId: tripIdString } = use(params);
  const tripId = parseInt(tripIdString);
  const { setActiveTrip } = useTripPlanningStore();

  const {
    data: trip,
    isLoading,
    error,
  } = useQuery<Trip>({
    queryKey: ['trip', tripId],
    queryFn: () => tripsApi.getTripById(tripId, user?.id || 0),
    enabled: !!user?.id && !!tripId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      return tripsApi.deleteTrip(tripId, user?.id || 0);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ['trips', user?.id],
        type: 'active',
      });
      router.push('/dashboard?tripDeleted=true');
    },
    onError: (error) => {},
  });

  // Destination deletion mutation
  const deleteDestinationMutation = useMutation({
    mutationFn: (destinationId: number) => {
      return tripsApi.removeDestinationFromTrip(
        tripId,
        destinationId,
        user?.id || 0
      );
    },
    onSuccess: async () => {
      // Invalidate the current trip query to refresh the page
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      // Also invalidate trips list in case this affects trip status
      await queryClient.invalidateQueries({ queryKey: ['trips', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to remove destination:', error);
    },
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
    deleteDestinationMutation.mutate(destinationId);
  };

  // Simple destination image logic - no activity images needed
  const getDestinationImage = (destination: any) => {
    return destination.imageUrl || null; // Use gradient fallback if no image
  };

  // Auto-select destination if only one exists
  if (trip?.destinations?.length === 1 && !selectedDestinationId) {
    setSelectedDestinationId(trip.destinations[0].id);
  }

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trip header */}
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

          {/* Tab navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 Overview
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'timeline'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📅 Timeline
                </button>
                <button
                  onClick={() => setActiveTab('activities')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activities'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎯 Browse Activities
                </button>
              </nav>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div>
              <TripDetails trip={trip} />

              {/* Enhanced destinations section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Destinations
                    </h2>
                    <button
                      onClick={() => {
                        setActiveTrip(trip);
                        router.push('/destinations');
                      }}
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Destinations
                    </button>
                  </div>

                  {!trip.destinations || trip.destinations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                        Start building your itinerary by adding some
                        destinations to visit.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTrip(trip);
                          router.push('/destinations');
                        }}
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Destinations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {trip.destinations.map((destination) => (
                          <div
                            key={destination.id}
                            className="space-y-3 p-4 border-2 border-gray-200 rounded-lg bg-gray-50"
                          >
                            <DestinationMiniCard
                              destination={destination}
                              onRemove={() =>
                                handleRemoveDestination(destination.id)
                              }
                              activityImage={getDestinationImage(destination)}
                            />
                            {/* Browse activities button */}
                            <button
                              onClick={() => {
                                setSelectedDestinationId(destination.id);
                                setActiveTab('activities');
                              }}
                              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Browse Activities
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick activity preview */}
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-blue-900">
                              Ready to plan activities?
                            </h3>
                            <p className="text-sm text-blue-700 mt-1">
                              Browse Google Places activities for your
                              destinations and create your itinerary.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('activities')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                          >
                            Get Started
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && <TripTimeline tripId={tripId} />}

          {activeTab === 'activities' && (
            <div>
              {/* Destination selector for multiple destinations */}
              {trip.destinations && trip.destinations.length > 1 && (
                <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">🗺️</span>
                    <h3 className="text-sm font-semibold text-blue-900">
                      Choose your destination:
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {trip.destinations.map((destination) => (
                      <button
                        key={destination.id}
                        onClick={() => setSelectedDestinationId(destination.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                          selectedDestinationId === destination.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm'
                        }`}
                      >
                        {getCountryFlag(destination.country)} {destination.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity browser */}
              {selectedDestinationId ? (
                <ActivityBrowser
                  destinationId={selectedDestinationId}
                  tripId={tripId}
                />
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-6xl mb-4">📍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a destination to browse activities
                  </h3>
                  <p className="text-gray-500">
                    Choose a destination to see available activities with Google
                    Places data.
                  </p>
                </div>
              )}
            </div>
          )}

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
