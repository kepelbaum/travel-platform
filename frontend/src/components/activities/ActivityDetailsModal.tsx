'use client';

const getStarDisplay = (rating: number) => {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
};

import { useState } from 'react';
import { Activity } from '@/types';

interface ActivityDetailsModalProps {
  activity: Activity;
  onClose: () => void;
  tripId?: number;
}

interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface Review {
  id?: string;
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export default function ActivityDetailsModal({
  activity,
  onClose,
  tripId,
}: ActivityDetailsModalProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<
    'all' | '5' | '4' | '3' | '2' | '1'
  >('all');
  const [showAllHours, setShowAllHours] = useState(false);

  // Mock data - replace with actual API data
  const mockOpeningHours: OpeningHours = {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 8:00 PM',
    saturday: '10:00 AM - 8:00 PM',
    sunday: '10:00 AM - 6:00 PM',
  };

  const mockReviews: Review[] = [
    {
      author_name: 'Sarah Chen',
      rating: 5,
      text: 'Absolutely stunning! The architecture is breathtaking and the guided tour was very informative. Definitely worth the visit, though it can get quite crowded during peak hours.',
      time: 1704067200,
      relative_time_description: '2 weeks ago',
    },
    {
      author_name: 'Mike Johnson',
      rating: 4,
      text: "Great experience overall. The exhibits were well-maintained and interesting. Only downside was the long queue, but that's expected for such a popular attraction.",
      time: 1703462400,
      relative_time_description: '3 weeks ago',
    },
    {
      author_name: 'Emma Wilson',
      rating: 3,
      text: 'It was okay. The place is nice but a bit overpriced for what you get. The staff was friendly though and the location is convenient.',
      time: 1702857600,
      relative_time_description: '1 month ago',
    },
    {
      author_name: 'David Rodriguez',
      rating: 5,
      text: 'One of the best attractions in the city! Amazing views and rich history. I spent hours here and could have stayed longer. Highly recommend!',
      time: 1702252800,
      relative_time_description: '1 month ago',
    },
  ];

  const isOpenNow = () => {
    const now = new Date();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = dayNames[now.getDay()];

    // Simple check - would need more complex parsing for real implementation
    const todayHours = mockOpeningHours[currentDay as keyof OpeningHours];
    if (!todayHours || todayHours === 'Closed') return false;

    // This is simplified - real implementation would parse time ranges
    return todayHours.includes('AM') || todayHours.includes('PM');
  };

  const getFilteredReviews = () => {
    if (reviewFilter === 'all') return mockReviews;
    return mockReviews.filter(
      (review) => review.rating.toString() === reviewFilter
    );
  };

  const getCurrentDayHours = () => {
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = dayNames[new Date().getDay()];
    return (
      mockOpeningHours[currentDay as keyof OpeningHours] ||
      'Hours not available'
    );
  };

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
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    } else {
      return count.toString();
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

  const openInGoogleMaps = () => {
    const mapsUrl = activity.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${activity.placeId}`
      : `https://www.google.com/maps/search/${encodeURIComponent(activity.address || activity.name)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with image */}
        <div className="relative">
          {activity.photoUrl ? (
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-t-lg">
              <span className="text-6xl">
                {getCategoryIcon(activity.category)}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Category badge */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white rounded-full px-3 py-1 text-sm font-medium">
            {getCategoryIcon(activity.category)}{' '}
            {getCategoryLabel(activity.category)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and rating */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex-1 mr-4">
              {activity.name}
            </h2>
            {activity.rating && (
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                <span className="text-yellow-600 text-lg">⭐</span>
                <span className="font-semibold text-gray-900 ml-1">
                  {activity.rating.toFixed(1)}
                </span>
                {activity.userRatingsTotal && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({formatRatingCount(activity.userRatingsTotal)} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">⏱️</span>
              <span className="text-gray-600">
                {formatDuration(activity.durationMinutes)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">💰</span>
              <span className="text-gray-600">
                {formatPriceLevel(activity.priceLevel)}
              </span>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                About
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {activity.description}
              </p>
            </div>
          )}

          {/* Opening hours - collapsible */}
          <div className="mb-6">
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded p-2 -m-2"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900 mr-3">
                  Hours
                </h3>
                <div
                  className={`flex items-center text-sm font-medium ${
                    isOpenNow() ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isOpenNow() ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  {isOpenNow() ? 'Open Now' : 'Closed'}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-2">{getCurrentDayHours()}</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${showAllHours ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {showAllHours && (
              <div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                {Object.entries(mockOpeningHours).map(([day, hours]) => {
                  const dayNames = [
                    'sunday',
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                  ];
                  const currentDay = dayNames[new Date().getDay()];
                  const isToday = day === currentDay;
                  return (
                    <div key={day} className="flex justify-between py-1">
                      <span
                        className={`capitalize ${isToday ? 'font-semibold text-blue-600' : ''}`}
                      >
                        {day}
                      </span>
                      <span
                        className={`${isToday ? 'font-semibold text-blue-600' : 'text-gray-600'}`}
                      >
                        {hours}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Address */}
          {activity.address && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Location
              </h3>
              <button
                onClick={openInGoogleMaps}
                className="flex items-start text-left hover:text-blue-600 transition-colors group"
              >
                <span className="text-gray-400 mr-2 mt-0.5">📍</span>
                <span className="text-gray-600 group-hover:underline">
                  {activity.address}
                </span>
              </button>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filter by:</span>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Reviews</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {getFilteredReviews()
                .slice(0, 3)
                .map((review, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {review.author_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {review.relative_time_description}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-400 mr-2">
                            {getStarDisplay(review.rating)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))}
            </div>

            {getFilteredReviews().length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={openInGoogleMaps}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all {getFilteredReviews().length} reviews on Google Maps
                  →
                </button>
              </div>
            )}

            {getFilteredReviews().length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No reviews found for this rating.</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={openInGoogleMaps}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View on Google Maps
            </button>
            {tripId && (
              <button
                onClick={() => setShowScheduleForm(true)}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add to Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
