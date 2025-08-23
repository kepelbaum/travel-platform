'use client';

import { useQuery } from '@tanstack/react-query';
import { TripActivity } from '@/types';
import { tripActivitiesApi } from '@/lib/api';

interface TripTimelineProps {
  tripId: number;
}

export default function TripTimeline({ tripId }: TripTimelineProps) {
  const {
    data: tripActivities,
    isLoading,
    error,
  } = useQuery<TripActivity[]>({
    queryKey: ['trip-activities', tripId],
    queryFn: () => tripActivitiesApi.getScheduledActivities(tripId),
  });

  // Group by date and sort
  const activitiesByDate =
    tripActivities?.reduce(
      (acc, activity) => {
        const date = activity.plannedDate;
        if (!acc[date]) acc[date] = [];
        acc[date].push(activity);
        return acc;
      },
      {} as Record<string, TripActivity[]>
    ) || {};

  // Sort activities within each date by time
  Object.keys(activitiesByDate).forEach((date) => {
    activitiesByDate[date].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  });

  const dates = Object.keys(activitiesByDate).sort();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <div
                  key={j}
                  className="h-16 bg-gray-100 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load timeline</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No activities scheduled
        </h3>
        <p className="text-gray-500">
          Browse activities to start planning your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Trip Timeline</h2>
        <p className="text-sm text-gray-600">
          {dates.length} {dates.length === 1 ? 'day' : 'days'} •{' '}
          {tripActivities?.length || 0} activities
        </p>
      </div>

      {dates.map((date) => {
        const dayActivities = activitiesByDate[date];
        const totalDuration = dayActivities.reduce(
          (sum, a) => sum + (a.durationMinutes || 0),
          0
        );
        const totalCost = dayActivities.reduce(
          (sum, a) => sum + (a.activity.estimatedCost || 0),
          0
        );

        return (
          <div
            key={date}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* Date header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(date)}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>
                    ⏱️ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </span>
                  <span>💰 ${totalCost}</span>
                  <span>{dayActivities.length} activities</span>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="p-6 space-y-4">
              {dayActivities.map((tripActivity, index) => (
                <div
                  key={tripActivity.id}
                  className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0"
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {formatTime(tripActivity.startTime)}
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="flex-1 flex items-start space-x-4">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      {tripActivity.activity.photoUrl ? (
                        <img
                          src={tripActivity.activity.photoUrl}
                          alt={tripActivity.activity.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                          🏛️
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {tripActivity.activity.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {tripActivity.activity.category.replace(/_/g, ' ')} •
                        {tripActivity.durationMinutes
                          ? ` ${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                          : ' Duration TBD'}
                      </p>
                      {tripActivity.activity.address && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {tripActivity.activity.address}
                        </p>
                      )}
                      {tripActivity.notes && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{tripActivity.notes}"
                        </p>
                      )}
                    </div>

                    {/* Cost */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${tripActivity.activity.estimatedCost || 0}
                      </p>
                      {tripActivity.activity.rating && (
                        <p className="text-xs text-gray-600">
                          ⭐ {tripActivity.activity.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* AI placeholder */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-medium text-gray-900">
            AI Trip Optimization (Coming Soon)
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div>⚠️ Conflict detection</div>
          <div>🚗 Travel time optimization</div>
          <div>⏰ Smart duration suggestions</div>
        </div>
      </div>
    </div>
  );
}
