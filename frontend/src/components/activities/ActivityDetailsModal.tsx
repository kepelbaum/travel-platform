'use client';

import { useState } from 'react';
import { Activity } from '@/types';

interface ActivityDetailsModalProps {
  activity: Activity & {
    openingHours?: string;
    reviewsJson?: string;
  };
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

  // Add click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Parse real data from activity
  const getOpeningHours = () => {
    if (!activity.openingHours) return null;
    try {
      const hoursArray = JSON.parse(activity.openingHours);

      if (Array.isArray(hoursArray)) {
        const hoursObj: OpeningHours = {};
        hoursArray.forEach((dayText: string) => {
          const colonIndex = dayText.indexOf(': ');
          if (colonIndex > 0) {
            const day = dayText.substring(0, colonIndex).toLowerCase();
            const hours = dayText.substring(colonIndex + 2);
            hoursObj[day as keyof OpeningHours] = hours || 'Closed';
          }
        });
        return hoursObj;
      }

      return hoursArray;
    } catch (e) {
      return null;
    }
  };

  const getReviews = (): Review[] => {
    if (!activity.reviewsJson) return [];
    try {
      return JSON.parse(activity.reviewsJson);
    } catch {
      return [];
    }
  };

  const openingHours = getOpeningHours();
  const reviews = getReviews();

  const getHoursStatus = () => {
    if (!activity.openingHours) {
      return {
        status: 'unavailable',
        color: 'bg-yellow-500',
        text: 'Hours not available',
      };
    }

    const hours = getOpeningHours();
    if (!hours) {
      return {
        status: 'unavailable',
        color: 'bg-yellow-500',
        text: 'Hours not available',
      };
    }

    return isOpenNow()
      ? { status: 'open', color: 'bg-green-500', text: 'Open now' }
      : { status: 'closed', color: 'bg-red-500', text: 'Closed' };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Landmark: '🏛️',
      Attraction: '🎢',
      Museum: '🎨',
      Restaurant: '🍽️',
      Park: '🌳',
      Nightlife: '🍻',
      Shopping: '🛍️',
      Other: '📋',
    };
    return icons[category] || '📋';
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

  const isOpenNow = () => {
    if (!openingHours) return false;

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

    const todayHours = openingHours[currentDay as keyof OpeningHours];
    if (!todayHours || todayHours === 'Closed') return false;

    // This is simplified - real implementation would parse time ranges
    return todayHours.includes('AM') || todayHours.includes('PM');
  };

  const getCurrentDayHours = () => {
    if (!openingHours) return 'Hours not available';

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
      openingHours[currentDay as keyof OpeningHours] || 'Hours not available'
    );
  };

  const getFilteredReviews = () => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter(
      (review) => review.rating.toString() === reviewFilter
    );
  };

  const getStarDisplay = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const openInGoogleMaps = () => {
    const mapsUrl = activity.placeId
      ? `https://www.google.com/maps/place/?q=place_id:${activity.placeId}`
      : `https://www.google.com/maps/search/${encodeURIComponent(activity.address || activity.name)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
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

          {/* Quick stats - only show cost, hide duration */}
          <div className="mb-6">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">💰</span>
              <span className="text-gray-600">
                {activity.estimatedCost ? `$${activity.estimatedCost}` : 'Free'}
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
                <h3 className="text-lg font-semibold text-gray-900 mr-10">
                  Hours
                </h3>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${getHoursStatus().color}`}
                  ></div>
                  <span className="text-sm text-blue-700 font-bold">
                    {getHoursStatus().text}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                {openingHours && (
                  <span className="mr-2">{getCurrentDayHours()}</span>
                )}
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

            {/* Dropdown shows hours if available, or "Hours not available" message */}
            {showAllHours && (
              <div className="grid grid-cols-1 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                {openingHours ? (
                  Object.entries(openingHours).map(([day, hours]) => {
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
                          {typeof hours === 'string'
                            ? hours
                            : 'Hours not available'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    Hours not available
                  </div>
                )}
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
              {reviews.length > 0 && (
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
              )}
            </div>

            {reviews.length > 0 && (
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

                {getFilteredReviews().length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={openInGoogleMaps}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View all {getFilteredReviews().length} reviews on Google
                      Maps →
                    </button>
                  </div>
                )}

                {getFilteredReviews().length === 0 && reviews.length > 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No reviews found for this rating.</p>
                  </div>
                )}
              </div>
            )}

            {reviews.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                <p>No reviews available</p>
                <p className="text-sm mt-1">
                  Click location above to see reviews on Google Maps
                </p>
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
