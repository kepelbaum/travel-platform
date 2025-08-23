'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import ActivityScheduleForm from '../forms/ActivityScheduleForm';

interface ActivityCardProps {
  activity: Activity;
  tripId?: number;
}

export default function ActivityCard({ activity, tripId }: ActivityCardProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Duration TBD';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      tourist_attraction: '🏛️',
      museum: '🎨',
      restaurant: '🍽️',
      amusement_park: '🎢',
      shopping_mall: '🛍️',
      park: '🌳',
      church: '⛪',
      art_gallery: '🖼️',
      zoo: '🦁',
    };
    return icons[category] || '📍';
  };

  const getNeighborhood = (address?: string) => {
    if (!address) return null;
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || 'Paris';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[420px] flex flex-col">
        {/* Image */}
        <div className="relative h-42 flex-shrink-0">
          {activity.photoUrl ? (
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl">
                {getCategoryIcon(activity.category)}
              </span>
            </div>
          )}

          {activity.rating && (
            <div className="absolute top-3 right-3 bg-white bg-opacity-90 rounded-full px-2 py-1 text-sm font-semibold">
              ⭐ {activity.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title - fixed height */}
          <div className="h-8 mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              {activity.name}
            </h3>
          </div>

          {/* Google Places Description - fixed height */}
          <div className="h-10 mb-3">
            {activity.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>

          {/* Duration/Cost - fixed height */}
          <div className="h-6 mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>⏱️ {formatDuration(activity.durationMinutes)}</span>
              <span>
                💰{' '}
                {activity.estimatedCost ? `$${activity.estimatedCost}` : 'Free'}
              </span>
            </div>
          </div>

          {/* Location info - fixed height */}
          <div className="h-10 mb-3">
            <p className="text-xs text-gray-500">
              🏛️ {activity.category.replace(/_/g, ' ')}
            </p>
            {activity.address && (
              <p className="text-xs text-gray-500 truncate">
                📍 {activity.address}
              </p>
            )}
          </div>

          {/* Button - at bottom */}
          <div className="mt-auto">
            {tripId && (
              <button
                onClick={() => setShowScheduleForm(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add to Trip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && tripId && (
        <ActivityScheduleForm
          activity={activity}
          tripId={tripId}
          onClose={() => setShowScheduleForm(false)}
          onScheduled={() => {
            setShowScheduleForm(false);
          }}
        />
      )}
    </>
  );
}
