'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TripActivity } from '@/types';
import { tripActivitiesApi } from '@/lib/api';
import { EditTripActivityModal } from '@/components/trip-activities/EditTripActivityModal';
import { Trip } from '@/types';

interface TripTimelineProps {
  tripId: number;
  trip: Trip;
}

function TimezoneDisplay({
  timezone,
  date,
  time,
  className = '',
}: {
  timezone: string;
  date: string;
  time: string;
  className?: string;
}) {
  const [hours, minutes] = time.split(':').map(Number);
  const displayTime = new Date();
  displayTime.setHours(hours, minutes, 0, 0);

  const formattedTime = displayTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let tzDisplay = 'UTC';
  if (timezone && timezone !== 'UTC') {
    try {
      const tzParts = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short',
      }).formatToParts(new Date());
      tzDisplay =
        tzParts.find((part) => part.type === 'timeZoneName')?.value ||
        timezone.split('/')[1] ||
        timezone;
    } catch (e) {
      tzDisplay = timezone.split('/')[1] || timezone;
    }
  }

  return (
    <span className={className} title={`${timezone}`}>
      {formattedTime}
      <br />
      <span className="text-xs opacity-75">{tzDisplay}</span>
    </span>
  );
}

export default function TripTimeline({ tripId, trip }: TripTimelineProps) {
  const [editingActivity, setEditingActivity] = useState<TripActivity | null>(
    null
  );
  const queryClient = useQueryClient();

  const {
    data: tripActivities,
    isLoading,
    error,
  } = useQuery<TripActivity[]>({
    queryKey: ['trip-activities', tripId],
    queryFn: () => tripActivitiesApi.getScheduledActivities(tripId),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (tripActivityId: number) =>
      tripActivitiesApi.removeActivityFromTrip(tripActivityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-activities', tripId] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      alert('Failed to remove activity. Please try again.');
    },
  });

  // Helper function to check if venue is open during activity time
  const checkVenueHours = (
    tripActivity: TripActivity
  ): { isOpen: boolean; message?: string } => {
    const activity = tripActivity.activity;
    if (!activity?.openingHours) {
      return { isOpen: true }; // Assume open if no hours data
    }

    try {
      const hoursArray = JSON.parse(activity.openingHours);
      if (!Array.isArray(hoursArray)) return { isOpen: true };

      // Get day of week for the activity
      const [year, month, day] = tripActivity.plannedDate
        .split('-')
        .map(Number);
      const activityDate = new Date(year, month - 1, day);
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[activityDate.getDay()];

      // Find hours for this day
      let todayHours = null;
      for (const dayText of hoursArray) {
        if (dayText.toLowerCase().startsWith(dayName + ':')) {
          todayHours = dayText.substring(dayText.indexOf(':') + 1).trim();
          break;
        }
      }

      if (!todayHours || todayHours.toLowerCase().includes('closed')) {
        return {
          isOpen: false,
          message: `Venue is closed on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}s`,
        };
      }

      // Parse hours (simplified - handles "9:00 AM – 6:00 PM" format)
      if (todayHours.includes('–') || todayHours.includes('-')) {
        const timeParts = todayHours.split(/[–-]/);
        if (timeParts.length === 2) {
          const openTime = parseTimeString(timeParts[0].trim());
          const closeTime = parseTimeString(timeParts[1].trim());

          if (openTime && closeTime) {
            const activityStart = tripActivity.startTime;
            const [startHours, startMins] = activityStart
              .split(':')
              .map(Number);
            const activityStartTime = startHours * 60 + startMins;
            const duration = tripActivity.durationMinutes || 60;
            const activityEndTime = activityStartTime + duration;

            const openMinutes = openTime.hour * 60 + openTime.minute;
            const closeMinutes = closeTime.hour * 60 + closeTime.minute;

            if (
              activityStartTime < openMinutes ||
              activityEndTime > closeMinutes
            ) {
              return {
                isOpen: false,
                message: `Activity scheduled outside venue hours (${timeParts[0].trim()} - ${timeParts[1].trim()})`,
              };
            }
          }
        }
      }

      return { isOpen: true };
    } catch (e) {
      return { isOpen: true }; // Assume open if parsing fails
    }
  };

  // Helper to parse time strings like "9:00 AM"
  const parseTimeString = (
    timeStr: string
  ): { hour: number; minute: number } | null => {
    try {
      const isPM = timeStr.toLowerCase().includes('pm');
      const isAM = timeStr.toLowerCase().includes('am');

      const cleanTime = timeStr.replace(/[APM\s]/gi, '');
      const [hourStr, minuteStr] = cleanTime.split(':');

      let hours = parseInt(hourStr);
      const minutes = minuteStr ? parseInt(minuteStr) : 0;

      if (isPM && hours !== 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      return { hour: hours, minute: minutes };
    } catch (e) {
      return null;
    }
  };

  const handleEdit = (tripActivity: TripActivity) => {
    setEditingActivity(tripActivity);
  };

  const handleDelete = (tripActivity: TripActivity) => {
    if (
      window.confirm(`Remove ${tripActivity.activity.name} from your trip?`)
    ) {
      deleteMutation.mutate(tripActivity.id);
    }
  };

  const isActivityValid = (
    tripActivity: TripActivity,
    tripStartDate: string,
    tripEndDate: string
  ) => {
    const activityDate = tripActivity.plannedDate;
    return activityDate >= tripStartDate && activityDate <= tripEndDate;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;

    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    const nextDay = endHours >= 24;
    const displayHours = endHours % 24;

    const date = new Date();
    date.setHours(displayHours, endMins);
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return nextDay ? `${timeString} +1` : timeString;
  };

  const getTimezoneDisplayName = (timezone: string) => {
    if (!timezone || timezone === 'UTC') return 'UTC';

    try {
      const tzParts = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'long',
      }).formatToParts(new Date());
      const tzName = tzParts.find(
        (part) => part.type === 'timeZoneName'
      )?.value;

      const city = timezone.split('/')[1]?.replace(/_/g, ' ') || timezone;
      return `${city}, ${tzName}`;
    } catch (e) {
      return timezone.split('/')[1]?.replace(/_/g, ' ') || timezone;
    }
  };

  // Split activities into valid and invalid
  const activitiesWithData = tripActivities?.filter((ta) => ta.activity) || [];

  const validActivitiesByDate = activitiesWithData.filter((ta) =>
    isActivityValid(ta, trip.startDate, trip.endDate)
  );

  const invalidActivities = activitiesWithData.filter(
    (ta) => !isActivityValid(ta, trip.startDate, trip.endDate)
  );

  // Group valid activities by date AND timezone
  const validActivitiesByDateAndTimezone = validActivitiesByDate.reduce(
    (acc, activity) => {
      const date = activity.plannedDate;
      const timezone = activity.timezone || 'UTC';
      const key = `${date}-${timezone}`;

      if (!acc[key]) {
        acc[key] = {
          date,
          timezone,
          activities: [],
        };
      }
      acc[key].activities.push(activity);
      return acc;
    },
    {} as Record<
      string,
      { date: string; timezone: string; activities: TripActivity[] }
    >
  );

  // Sort activities within each group by time
  Object.values(validActivitiesByDateAndTimezone).forEach((group) => {
    group.activities.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Sort groups by date first, then by timezone
  const sortedValidGroups = Object.values(
    validActivitiesByDateAndTimezone
  ).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.timezone.localeCompare(b.timezone);
  });

  // Group invalid activities by date for display
  const invalidActivitiesByDate = invalidActivities.reduce(
    (acc, activity) => {
      const date = activity.plannedDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(activity);
      return acc;
    },
    {} as Record<string, TripActivity[]>
  );

  const sortedInvalidDates = Object.keys(invalidActivitiesByDate).sort();

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
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sortedValidGroups.length === 0 && invalidActivities.length === 0) {
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
          {sortedValidGroups.length}{' '}
          {sortedValidGroups.length === 1 ? 'section' : 'sections'} •{' '}
          {validActivitiesByDate.length} activities
          {invalidActivities.length > 0 && (
            <span className="text-red-600 ml-2">
              • {invalidActivities.length} outside trip dates
            </span>
          )}
        </p>
      </div>

      {/* Valid Activities - no special header, just display normally */}
      {sortedValidGroups.map((group) => {
        const dayActivities = group.activities;
        const totalDuration = dayActivities.reduce(
          (sum, a) => sum + (a.durationMinutes || 0),
          0
        );
        const totalCost = dayActivities.reduce(
          (sum, a) => sum + (a.activity?.estimatedCost || 0),
          0
        );

        return (
          <div
            key={`valid-${group.date}-${group.timezone}`}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* Date header with timezone info */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatDate(group.date)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getTimezoneDisplayName(group.timezone)}
                  </p>
                </div>
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
              {dayActivities.map((tripActivity) => {
                if (!tripActivity.activity) {
                  return (
                    <div key={tripActivity.id} className="text-red-500 text-sm">
                      Error: Activity data missing for scheduled item
                    </div>
                  );
                }

                const venueCheck = checkVenueHours(tripActivity);
                const hasVenueIssue = !venueCheck.isOpen;

                return (
                  <div
                    key={tripActivity.id}
                    className={`relative flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0 ${
                      hasVenueIssue
                        ? 'bg-red-50 border-red-200 rounded-lg p-3 -mx-3'
                        : ''
                    }`}
                  >
                    {/* Time display */}
                    <div className="flex-shrink-0 w-24 text-right">
                      <div
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          hasVenueIssue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <TimezoneDisplay
                          timezone={tripActivity.timezone || 'UTC'}
                          date={tripActivity.plannedDate}
                          time={tripActivity.startTime}
                          className=""
                        />
                        {hasVenueIssue && <div className="text-xs">⚠️</div>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        to{' '}
                        {formatEndTime(
                          tripActivity.startTime,
                          tripActivity.durationMinutes || 0
                        )}
                      </div>
                    </div>

                    {/* Activity details */}
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
                          {hasVenueIssue && (
                            <span className="ml-2 text-xs text-red-600 font-normal">
                              (Venue Closed!)
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {tripActivity.activity.category?.replace(/_/g, ' ') ||
                            'Activity'}{' '}
                          •
                          {tripActivity.durationMinutes
                            ? ` ${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                            : ' Duration TBD'}
                        </p>
                        {tripActivity.activity.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {tripActivity.activity.address}
                          </p>
                        )}

                        {/* Venue hours warning */}
                        {hasVenueIssue && venueCheck.message && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-700">
                              <span className="font-medium">Warning:</span>{' '}
                              {venueCheck.message}
                            </p>
                          </div>
                        )}

                        {tripActivity.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Note:</span>{' '}
                              {tripActivity.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cost and Actions */}
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${tripActivity.activity.estimatedCost || 0}
                          </p>
                          {tripActivity.activity.rating && (
                            <p className="text-xs text-gray-600">
                              ⭐ {tripActivity.activity.rating.toFixed(1)}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(tripActivity)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded border border-blue-200 transition-colors"
                            title="Edit activity"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tripActivity)}
                            disabled={deleteMutation.isPending}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 rounded border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Remove activity"
                          >
                            {deleteMutation.isPending
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Invalid Activities Section - only show if there are any */}
      {invalidActivities.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg overflow-hidden">
          {/* Warning header */}
          <div className="bg-red-100 px-6 py-4 border-b border-red-200">
            <div className="flex items-center">
              <span className="text-red-600 text-xl mr-3">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Activities Outside Trip Dates
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  These activities are scheduled outside your trip dates (
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}) and
                  are not included in budget calculations.
                </p>
              </div>
            </div>
          </div>

          {/* Invalid activities grouped by date */}
          <div className="p-6 space-y-6">
            {sortedInvalidDates.map((date) => {
              const dayActivities = invalidActivitiesByDate[date];

              return (
                <div key={`invalid-${date}`}>
                  <h4 className="text-md font-medium text-red-800 mb-3 flex items-center">
                    <span className="text-red-600 mr-2">📅</span>
                    {formatDate(date)}
                    <span className="text-sm font-normal text-red-600 ml-2">
                      ({dayActivities.length} activities)
                    </span>
                  </h4>

                  <div className="space-y-3">
                    {dayActivities.map((tripActivity) => (
                      <div
                        key={tripActivity.id}
                        className="bg-white border border-red-200 rounded-lg p-4 flex items-start space-x-4"
                      >
                        {/* Time display with warning indicator */}
                        <div className="flex-shrink-0 w-20 text-right">
                          <div className="px-2 py-1 rounded text-sm font-medium bg-red-100 text-red-800">
                            <TimezoneDisplay
                              timezone={tripActivity.timezone || 'UTC'}
                              date={tripActivity.plannedDate}
                              time={tripActivity.startTime}
                            />
                            <div className="text-xs">⚠️</div>
                          </div>
                        </div>

                        {/* Activity details */}
                        <div className="flex-1 flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {tripActivity.activity.photoUrl ? (
                              <img
                                src={tripActivity.activity.photoUrl}
                                alt={tripActivity.activity.name}
                                className="w-12 h-12 rounded-lg object-cover opacity-75"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-lg opacity-75">
                                🏛️
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h5 className="font-medium text-red-900">
                              {tripActivity.activity.name}
                              <span className="ml-2 text-xs text-red-600 font-normal">
                                (Outside trip dates)
                              </span>
                            </h5>
                            <p className="text-sm text-red-700 mt-1">
                              {tripActivity.activity.category?.replace(
                                /_/g,
                                ' '
                              )}{' '}
                              •
                              {tripActivity.durationMinutes
                                ? ` ${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                                : ' Duration TBD'}
                            </p>
                            {tripActivity.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Note:</span>{' '}
                                  {tripActivity.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions - only delete, no edit */}
                          <div className="text-right space-y-1">
                            <button
                              onClick={() => handleEdit(tripActivity)}
                              className="block w-full px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded border border-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tripActivity)}
                              disabled={deleteMutation.isPending}
                              className="block w-full px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded border border-red-200 disabled:opacity-50 transition-colors"
                            >
                              {deleteMutation.isPending
                                ? 'Removing...'
                                : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingActivity && (
        <EditTripActivityModal
          tripActivity={editingActivity}
          onSave={() => setEditingActivity(null)}
          onCancel={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}
