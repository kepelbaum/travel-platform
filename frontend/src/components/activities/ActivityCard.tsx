'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import ActivityScheduleForm from '../forms/ActivityScheduleForm';

interface ActivityCardProps {
  activity: Activity;
  tripId?: number;
  onShowDetails?: (activity: Activity) => void;
}

export default function ActivityCard({
  activity,
  tripId,
  onShowDetails,
}: ActivityCardProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Duration TBD';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      landmark: '🏛️',
      attraction: '🎢',
      museum: '🎨',
      restaurant: '🍽️',
      park: '🌳',
      nightlife: '🍻',
      shopping: '🛍️',
      tourist_attraction: '🎢',
      amusement_park: '🎢',
      art_gallery: '🎨',
      shopping_mall: '🛍️',
      department_store: '🛍️',
      church: '🏛️',
      mosque: '🏛️',
      synagogue: '🏛️',
      temple: '🏛️',
      zoo: '🎢',
      aquarium: '🎢',
      casino: '🍻',
      night_club: '🍻',
      bar: '🍻',
      bakery: '🍽️',
      cafe: '🍽️',
      meal_takeaway: '🍽️',
      campground: '🌳',
      rv_park: '🌳',
    };
    return icons[category] || '📍';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      landmark: 'Landmark',
      attraction: 'Attraction',
      museum: 'Museum',
      restaurant: 'Restaurant',
      park: 'Park',
      nightlife: 'Nightlife',
      shopping: 'Shopping',
      tourist_attraction: 'Attraction',
      amusement_park: 'Attraction',
      art_gallery: 'Museum',
      shopping_mall: 'Shopping',
      department_store: 'Shopping',
      church: 'Landmark',
      mosque: 'Landmark',
      synagogue: 'Landmark',
      temple: 'Landmark',
      zoo: 'Attraction',
      aquarium: 'Attraction',
      casino: 'Nightlife',
      night_club: 'Nightlife',
      bar: 'Nightlife',
      bakery: 'Restaurant',
      cafe: 'Restaurant',
      meal_takeaway: 'Restaurant',
      campground: 'Park',
      rv_park: 'Park',
    };
    return labels[category] || category.replace(/_/g, ' ');
  };

  const formatRatingCount = (count?: number) => {
    if (!count) return '';

    if (count >= 1000000) {
      return `(${(count / 1000000).toFixed(1)}M)`;
    } else if (count >= 1000) {
      return `(${(count / 1000).toFixed(1)}k)`;
    } else {
      return `(${count})`;
    }
  };

  const formatPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined || priceLevel === null) return 'Variable';

    switch (priceLevel) {
      case 0:
        return 'Free';
      case 1:
        return '$';
      case 2:
        return '$$';
      case 3:
        return '$$$';
      case 4:
        return '$$$$';
      default:
        return 'Variable';
    }
  };

  const truncateTitle = (title: string, maxLength: number = 45) => {
    if (title.length <= maxLength) return title;

    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  };

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[440px] flex flex-col cursor-pointer"
        onClick={() => onShowDetails?.(activity)}
      >
        {/* Image */}
        <div className="relative h-44 flex-shrink-0">
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

          {/* Rating badge - single line format */}
          {activity.rating && (
            <div className="absolute top-3 right-3 bg-white bg-opacity-95 rounded-full px-2 py-1 text-sm font-semibold shadow-sm">
              ⭐ {activity.rating.toFixed(1)}{' '}
              <span className="text-gray-500">
                {formatRatingCount(activity.userRatingsTotal)}
              </span>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white rounded-full px-2 py-1 text-xs font-medium">
            {getCategoryIcon(activity.category)}{' '}
            {getCategoryLabel(activity.category)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title - flexible height with better handling */}
          <div className="mb-3">
            <h3
              className="font-semibold text-base text-gray-900 leading-tight"
              title={activity.name}
            >
              {truncateTitle(activity.name)}
            </h3>
          </div>

          {/* Description - flexible height */}
          <div className="mb-3 flex-1 min-h-[2.5rem]">
            {activity.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <span className="mr-1">⏱️</span>
              <span>{formatDuration(activity.durationMinutes)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="mr-1">💰</span>
              <span>{formatPriceLevel(activity.priceLevel)}</span>
            </div>
          </div>

          {/* Location info - clickable address */}
          <div className="mb-4 text-xs text-gray-500">
            {activity.address && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent modal from opening
                  const mapsUrl = activity.placeId
                    ? `https://www.google.com/maps/place/?q=place_id:${activity.placeId}`
                    : `https://www.google.com/maps/search/${encodeURIComponent(activity.address)}`;
                  window.open(mapsUrl, '_blank');
                }}
                className="flex items-start text-left hover:text-blue-600 transition-colors w-full"
                title="Open in Google Maps"
              >
                <span className="mr-1 mt-0.5">📍</span>
                <span className="line-clamp-2 leading-relaxed underline-offset-2 hover:underline">
                  {activity.address}
                </span>
              </button>
            )}
          </div>

          {/* Button - at bottom */}
          <div className="mt-auto">
            {tripId && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent modal from opening
                  setShowScheduleForm(true);
                }}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
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
