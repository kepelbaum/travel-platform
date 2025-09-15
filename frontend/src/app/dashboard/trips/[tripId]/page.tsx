'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { tripsApi } from '@/lib/api';
import { Trip } from '@/types';
import { useState, use } from 'react';
import Link from 'next/link';
import { DestinationMiniCard } from '@/components/destinations/DestinationMiniCard';
import { TripDetails } from '@/components/trips/TripDetails';
import { DeleteTripModal } from '@/components/trips/DeleteTripModal';
import { DeleteDestinationModal } from '@/components/trips/DeleteDestinationModal';
import ActivityBrowser from '@/components/activities/ActivityBrowser';
import TripTimeline from '@/components/trip-activities/TripTimeline';
import { useTripPlanningStore } from '@/store/tripPlanning';
import { getCountryFlag } from '@/lib/utils/CountryFlagHelper';
import { BudgetTracker } from '@/components/ui/BudgetTracker';

interface TripDetailsPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteDestinationConfirm, setShowDeleteDestinationConfirm] =
    useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
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

  const deleteDestinationMutation = useMutation({
    mutationFn: (destinationId: number) => {
      return tripsApi.removeDestinationFromTrip(
        tripId,
        destinationId,
        user?.id || 0
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      await queryClient.invalidateQueries({ queryKey: ['trips', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to remove destination:', error);
    },
  });

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const handleRemoveDestination = (
    destinationId: number,
    destinationName: string
  ) => {
    setDestinationToDelete({ id: destinationId, name: destinationName });
    setShowDeleteDestinationConfirm(true);
  };

  const confirmRemoveDestination = () => {
    if (destinationToDelete) {
      deleteDestinationMutation.mutate(destinationToDelete.id);
      setShowDeleteDestinationConfirm(false);
      setDestinationToDelete(null);
    }
  };

  const getDestinationImage = (destination: any) => {
    return destination.imageUrl || null;
  };

  if (trip?.destinations?.length === 1 && !selectedDestinationId) {
    setSelectedDestinationId(trip.destinations[0].id);
  }

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-24">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error?.message.includes('404')) {
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
                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      {trip && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 sm:pb-24">
          {/* Trip header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1
                  className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                >
                  {trip.name}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center mt-2 space-y-1 sm:space-y-0 sm:space-x-4">
                  <span
                    className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Link
                  href={`/dashboard/trips/${trip.id}/edit`}
                  className={`inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                    isDark
                      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                      : 'border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Edit Trip
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Delete Trip
                </button>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="mb-4 sm:mb-6">
            <div className="flex space-x-1 p-1 bg-gray-800 rounded-lg">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'overview'
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'timeline'
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Timeline
              </button>
              <button
                onClick={() => {
                  if (trip.destinations && trip.destinations.length > 0) {
                    setSelectedDestinationId(trip.destinations[0].id);
                  }
                  setActiveTab('activities');
                }}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'activities'
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                🎯 Activities
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div>
              <TripDetails trip={trip} />

              {/* Enhanced destinations section */}
              <div
                className={`rounded-lg shadow-lg ${
                  isDark
                    ? 'bg-gray-800 border border-gray-700 shadow-purple-500/25'
                    : 'bg-white border border-gray-300 shadow-gray-400/20'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4 sm:mb-6">
                    <h2
                      className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                    >
                      Destinations
                    </h2>
                    <button
                      onClick={() => {
                        setActiveTrip(trip);
                        router.push('/destinations');
                      }}
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Add Destinations
                    </button>
                  </div>

                  {!trip.destinations || trip.destinations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div
                        className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                      >
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
                      <h3
                        className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                      >
                        No destinations yet
                      </h3>
                      <p
                        className={`mb-4 text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                      >
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
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {trip.destinations.map((destination) => (
                          <div key={destination.id} className="space-y-3">
                            <DestinationMiniCard
                              destination={destination}
                              onRemove={() =>
                                handleRemoveDestination(
                                  destination.id,
                                  destination.name
                                )
                              }
                              activityImage={getDestinationImage(destination)}
                            />
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

                      {/* FIX #3: Improved "Get Started" button layout */}
                      <div
                        className={`mt-6 p-4 border rounded-lg ${
                          isDark
                            ? 'bg-blue-900/30 border-blue-700/50'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-900'}`}
                            >
                              Ready to plan activities?
                            </h3>
                            <p
                              className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}
                            >
                              Browse Google Places activities for your
                              destinations and create your itinerary.
                            </p>
                          </div>
                          <button
                            onClick={() => setActiveTab('activities')}
                            className="w-full lg:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
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

          {activeTab === 'timeline' && trip && (
            <div className="space-y-4 sm:space-y-6">
              <BudgetTracker tripId={tripId} trip={trip} />
              <TripTimeline tripId={tripId} trip={trip} />
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              {/* Destination selector for multiple destinations */}
              {trip.destinations && trip.destinations.length > 1 && (
                <div
                  className={`mb-4 sm:mb-6 border-2 rounded-lg p-4 sm:p-5 ${
                    isDark
                      ? 'bg-blue-900/30 border-blue-700/50'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">🗺️</span>
                    <h3
                      className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}
                    >
                      Choose your destination:
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {trip.destinations.map((destination) => (
                      <button
                        key={destination.id}
                        onClick={() => setSelectedDestinationId(destination.id)}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border-2 ${
                          selectedDestinationId === destination.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : isDark
                              ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
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
                <div
                  className={`text-center py-8 sm:py-12 rounded-lg shadow-lg ${
                    isDark
                      ? 'bg-gray-800 border border-gray-700 shadow-purple-500/25'
                      : 'bg-white border border-gray-300 shadow-gray-400/20'
                  }`}
                >
                  <div className="text-4xl sm:text-6xl mb-4">📍</div>
                  <h3
                    className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                  >
                    Select a destination to browse activities
                  </h3>
                  <p
                    className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  >
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

          {showDeleteDestinationConfirm && destinationToDelete && (
            <DeleteDestinationModal
              destinationName={destinationToDelete.name}
              isDeleting={deleteDestinationMutation.isPending}
              onConfirm={confirmRemoveDestination}
              onCancel={() => {
                setShowDeleteDestinationConfirm(false);
                setDestinationToDelete(null);
              }}
            />
          )}
        </main>
      )}
    </>
  );
}
