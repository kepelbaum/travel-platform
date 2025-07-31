'use client';

import { Destination } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useTripPlanningStore } from '@/store/tripPlanning';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '@/lib/api';
import Link from 'next/link';

export function DestinationCard({ destination }: { destination: Destination }) {
  const { user } = useAuthStore();
  const { activeTrip } = useTripPlanningStore();
  const queryClient = useQueryClient();

  const isInTrip =
    activeTrip?.destinations?.some((dest) => dest.id === destination.id) ||
    false;

  const addMutation = useMutation({
    mutationFn: () =>
      tripsApi.addDestinationToTrip(
        activeTrip!.id,
        destination.id,
        user?.id || 0
      ),
    onSuccess: (updatedTrip) => {
      useTripPlanningStore.getState().setActiveTrip(updatedTrip);
      queryClient.invalidateQueries({ queryKey: ['trip', activeTrip!.id] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error) => {
      console.error('Failed to add destination:', error);
      // TODO: Show toast notification
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      tripsApi.removeDestinationFromTrip(
        activeTrip!.id,
        destination.id,
        user?.id || 0
      ),
    onSuccess: (updatedTrip) => {
      useTripPlanningStore.getState().setActiveTrip(updatedTrip);
      queryClient.invalidateQueries({ queryKey: ['trip', activeTrip!.id] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error) => {
      console.error('Failed to remove destination:', error);
      // TODO: Show toast notification
    },
  });

  const handleTripAction = () => {
    if (isInTrip) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const isLoading = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow h-[420px] flex flex-col">
      {/* Image placeholder*/}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center relative flex-shrink-0">
        {destination.imageUrl ? (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-white">
            <h3 className="text-2xl font-bold">{destination.name}</h3>
            <p className="text-sm opacity-90">{destination.country}</p>
          </div>
        )}

        {destination.imageUrl && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold">{destination.name}</h3>
              <p className="text-sm opacity-90">{destination.country}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 overflow-hidden">
          <span className="line-clamp-4">{destination.description}</span>
        </p>

        <div className="mt-auto space-y-4">
          {destination.coordinates && (
            <p className="text-xs text-gray-500">
              📍 {destination.coordinates.latitude.toFixed(4)},{' '}
              {destination.coordinates.longitude.toFixed(4)}
            </p>
          )}

          {activeTrip ? (
            <button
              onClick={handleTripAction}
              disabled={isLoading}
              className={`w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                isInTrip
                  ? 'text-white bg-red-500 hover:bg-red-700 border-red-800'
                  : 'text-white bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                  {isInTrip ? 'Removing...' : 'Adding...'}
                </span>
              ) : isInTrip ? (
                'Remove'
              ) : (
                'Add to Trip'
              )}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 text-center text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:border-gray-400 transition-colors cursor-pointer"
            >
              Select a trip to add destinations
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
