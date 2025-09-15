'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import { useThemeStore } from '@/store/theme';

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
  const { isDark } = useThemeStore();
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
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
        isDark ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border ${
          isDark
            ? 'bg-gray-800 border-gray-700 shadow-lg shadow-purple-500/25'
            : 'bg-white border-gray-300'
        }`}
      >
        {/* Header with image */}
        <div className="relative">
          {activity.photoUrl ? (
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
          ) : (
            <div
              className={`w-full h-64 flex items-center justify-center rounded-t-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            >
              <span className="text-6xl">
                {getCategoryIcon(activity.category)}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 rounded-full p-2 shadow-lg transition-colors ${
              isDark
                ? 'bg-gray-800 bg-opacity-90 hover:bg-opacity-100 text-gray-300 hover:text-white'
                : 'bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-gray-900'
            }`}
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
            <h2
              className={`text-2xl font-bold flex-1 mr-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {activity.name}
            </h2>
            {activity.rating && (
              <div
                className={`flex items-center px-3 py-1 rounded-full ${
                  isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'
                }`}
              >
                <span className="text-yellow-600 text-lg">⭐</span>
                <span
                  className={`font-semibold ml-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {activity.rating.toFixed(1)}
                </span>
                {activity.userRatingsTotal && (
                  <span
                    className={`text-sm ml-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    ({formatRatingCount(activity.userRatingsTotal)} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick stats - only show cost, hide duration */}
          <div className="mb-6">
            <div className="flex items-center">
              <span
                className={`mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              >
                💰
              </span>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {activity.estimatedCost ? `$${activity.estimatedCost}` : 'Free'}
              </span>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                About
              </h3>
              <p
                className={`leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {activity.description}
              </p>
            </div>
          )}

          {/* Opening hours - collapsible */}
          <div className="mb-6">
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className={`w-full flex items-center justify-between mb-3 rounded p-2 -m-2 transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <h3
                  className={`text-lg font-semibold mr-10 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Hours
                </h3>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${getHoursStatus().color}`}
                  ></div>
                  <span
                    className={`text-sm font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-700'
                    }`}
                  >
                    {getHoursStatus().text}
                  </span>
                </div>
              </div>
              <div
                className={`flex items-center text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
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
              <div
                className={`grid grid-cols-1 gap-2 text-sm rounded-lg p-3 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
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
                          className={`capitalize ${
                            isToday
                              ? isDark
                                ? 'font-semibold text-blue-400'
                                : 'font-semibold text-blue-600'
                              : isDark
                                ? 'text-gray-300'
                                : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <span
                          className={`${
                            isToday
                              ? isDark
                                ? 'font-semibold text-blue-400'
                                : 'font-semibold text-blue-600'
                              : isDark
                                ? 'text-gray-400'
                                : 'text-gray-600'
                          }`}
                        >
                          {typeof hours === 'string'
                            ? hours
                            : 'Hours not available'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className={`text-center py-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Hours not available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Address */}
          {activity.address && (
            <div className="mb-6">
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Location
              </h3>
              <button
                onClick={openInGoogleMaps}
                className={`flex items-start text-left transition-colors group ${
                  isDark ? 'hover:text-blue-400' : 'hover:text-blue-600'
                }`}
              >
                <span
                  className={`mr-2 mt-0.5 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  📍
                </span>
                <span
                  className={`group-hover:underline ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {activity.address}
                </span>
              </button>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                Reviews
              </h3>
              {reviews.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    Filter by:
                  </span>
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value as any)}
                    className={`text-sm border rounded px-2 py-1 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
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
                      className={`border-b pb-4 last:border-b-0 ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-medium ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {review.author_name}
                            </span>
                            <span
                              className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {review.relative_time_description}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400 mr-2">
                              {getStarDisplay(review.rating)}
                            </span>
                            <span
                              className={`text-sm ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}
                            >
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {review.text}
                      </p>
                    </div>
                  ))}

                {getFilteredReviews().length > 3 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={openInGoogleMaps}
                      className={`text-sm font-medium transition-colors ${
                        isDark
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      View all {getFilteredReviews().length} reviews on Google
                      Maps →
                    </button>
                  </div>
                )}

                {getFilteredReviews().length === 0 && reviews.length > 0 && (
                  <div
                    className={`text-center py-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <p>No reviews found for this rating.</p>
                  </div>
                )}
              </div>
            )}

            {reviews.length === 0 && (
              <div
                className={`rounded-lg p-4 text-center ${
                  isDark
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
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
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              View on Google Maps
            </button>
            {tripId && (
              <button
                onClick={() => setShowScheduleForm(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
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
