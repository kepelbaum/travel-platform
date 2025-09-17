'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TripActivity } from '@/types';
import { tripActivitiesApi } from '@/lib/api';
import { EditTripActivityModal } from '@/components/trip-activities/EditTripActivityModal';
import { Trip } from '@/types';
import { useThemeStore } from '@/store/theme';
import Image from 'next/image';

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
      {formattedTime} {tzDisplay}
    </span>
  );
}

export default function TripTimeline({ tripId, trip }: TripTimelineProps) {
  const [editingActivity, setEditingActivity] = useState<TripActivity | null>(
    null
  );
  const { isDark } = useThemeStore();
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
          <div
            key={i}
            className={`rounded-lg p-6 shadow-sm ${
              isDark
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div
              className={`h-6 rounded mb-4 animate-pulse ${
                isDark ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            ></div>
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <div
                  key={j}
                  className={`h-16 rounded animate-pulse ${
                    isDark ? 'bg-gray-900' : 'bg-gray-100'
                  }`}
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
        <p className={`mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Failed to load timeline
        </p>
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
      <div
        className={`text-center py-12 rounded-lg shadow-sm ${
          isDark
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="text-6xl mb-4">📅</div>
        <h3
          className={`text-lg font-medium mb-2 ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          No activities scheduled
        </h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Browse activities to start planning your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className={`text-xl font-bold ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          Trip Timeline
        </h2>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {sortedValidGroups.length}{' '}
          {sortedValidGroups.length === 1 ? 'section' : 'sections'} •{' '}
          {validActivitiesByDate.length} activities
          {invalidActivities.length > 0 && (
            <span
              className={`ml-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}
            >
              • {invalidActivities.length} outside trip dates
            </span>
          )}
        </p>
      </div>

      {/* Valid Activities */}
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
            className={`rounded-lg shadow-sm overflow-hidden ${
              isDark
                ? 'bg-gray-800 border border-gray-700 shadow-purple-500/25'
                : 'bg-white border border-gray-200 shadow-gray-400/20'
            }`}
          >
            {/* Date header with timezone info */}
            <div
              className={`px-6 py-4 border-b ${
                isDark
                  ? 'bg-gray-900 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    className={`text-lg font-semibold ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  >
                    {formatDate(group.date)}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {getTimezoneDisplayName(group.timezone)}
                  </p>
                </div>
                <div
                  className={`flex flex-wrap items-center space-x-4 text-sm mt-2 sm:mt-0 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  <span>
                    ⏱️ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                  </span>
                  <span>💰 ${totalCost}</span>
                  <span>{dayActivities.length} activities</span>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="p-6">
              {/* Desktop/Tablet view - original layout */}
              <div className="hidden md:block space-y-4">
                {dayActivities.map((tripActivity) => {
                  if (!tripActivity.activity) {
                    return (
                      <div
                        key={tripActivity.id}
                        className={`text-sm ${
                          isDark ? 'text-red-400' : 'text-red-500'
                        }`}
                      >
                        Error: Activity data missing for scheduled item
                      </div>
                    );
                  }

                  const venueCheck = checkVenueHours(tripActivity);
                  const hasVenueIssue = !venueCheck.isOpen;

                  return (
                    <div
                      key={tripActivity.id}
                      className={`relative flex items-start space-x-4 pb-4 border-b last:border-b-0 ${
                        isDark ? 'border-gray-700' : 'border-gray-100'
                      } ${
                        hasVenueIssue
                          ? isDark
                            ? 'bg-red-900/20 border-red-800/50 rounded-lg p-3 -mx-3'
                            : 'bg-red-50 border-red-200 rounded-lg p-3 -mx-3'
                          : ''
                      }`}
                    >
                      {/* Time display */}
                      <div className="flex-shrink-0 w-24 text-right">
                        <div
                          className={`text-sm font-medium ${
                            hasVenueIssue
                              ? isDark
                                ? 'text-red-400'
                                : 'text-red-800'
                              : isDark
                                ? 'text-blue-400'
                                : 'text-blue-800'
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
                        <div
                          className={`text-xs mt-1 ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
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
                            <Image
                              src={tripActivity.activity.photoUrl}
                              alt={tripActivity.activity.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div
                              className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${
                                isDark ? 'bg-gray-900' : 'bg-gray-200'
                              }`}
                            >
                              🏛️
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              isDark ? 'text-gray-100' : 'text-gray-900'
                            }`}
                          >
                            {tripActivity.activity.name}
                            {hasVenueIssue && (
                              <span
                                className={`ml-2 text-xs font-normal ${
                                  isDark ? 'text-red-400' : 'text-red-600'
                                }`}
                              >
                                (Venue Closed!)
                              </span>
                            )}
                          </h4>
                          <p
                            className={`text-sm mt-1 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            {tripActivity.activity.category?.replace(
                              /_/g,
                              ' '
                            ) || 'Activity'}{' '}
                            •
                            {tripActivity.durationMinutes
                              ? ` ${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                              : ' Duration TBD'}
                          </p>
                          {tripActivity.activity.address && (
                            <p
                              className={`text-xs mt-1 ${
                                isDark ? 'text-gray-500' : 'text-gray-500'
                              }`}
                            >
                              📍 {tripActivity.activity.address}
                            </p>
                          )}

                          {/* Venue hours warning */}
                          {hasVenueIssue && venueCheck.message && (
                            <div
                              className={`mt-2 p-2 border rounded ${
                                isDark
                                  ? 'bg-red-900/20 border-red-800/50'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <p
                                className={`text-sm ${
                                  isDark ? 'text-red-400' : 'text-red-700'
                                }`}
                              >
                                <span className="font-medium">Warning:</span>{' '}
                                {venueCheck.message}
                              </p>
                            </div>
                          )}

                          {tripActivity.notes && (
                            <div
                              className={`mt-2 p-2 border rounded ${
                                isDark
                                  ? 'bg-yellow-900/20 border-yellow-700/50'
                                  : 'bg-yellow-50 border-yellow-200'
                              }`}
                            >
                              <p
                                className={`text-sm ${
                                  isDark ? 'text-yellow-300' : 'text-gray-700'
                                }`}
                              >
                                <span className="font-medium">Note:</span>{' '}
                                {tripActivity.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Cost and Actions */}
                        <div className="text-right space-y-2">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                isDark ? 'text-gray-100' : 'text-gray-900'
                              }`}
                            >
                              ${tripActivity.activity.estimatedCost || 0}
                            </p>
                            {tripActivity.activity.rating && (
                              <p
                                className={`text-xs ${
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                ⭐ {tripActivity.activity.rating.toFixed(1)}
                              </p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(tripActivity)}
                              className={`px-3 py-1 text-xs border rounded transition-colors ${
                                isDark
                                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/30 hover:text-blue-300 border-blue-700/50'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 border-blue-200'
                              }`}
                              title="Edit activity"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tripActivity)}
                              disabled={deleteMutation.isPending}
                              className={`px-3 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                isDark
                                  ? 'bg-red-900/30 text-red-400 hover:bg-red-800/30 hover:text-red-300 border-red-700/50'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 border-red-200'
                              }`}
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

              {/* Mobile view - clean card design */}
              <div className="block md:hidden space-y-4">
                {dayActivities.map((tripActivity) => {
                  if (!tripActivity.activity) {
                    return (
                      <div
                        key={tripActivity.id}
                        className={`text-sm ${
                          isDark ? 'text-red-400' : 'text-red-500'
                        }`}
                      >
                        Error: Activity data missing for scheduled item
                      </div>
                    );
                  }

                  const venueCheck = checkVenueHours(tripActivity);
                  const hasVenueIssue = !venueCheck.isOpen;

                  return (
                    <div
                      key={tripActivity.id}
                      className={`rounded-lg overflow-hidden shadow-sm ${
                        isDark
                          ? 'bg-gray-800 border border-gray-600'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {/* Header Image with Text Overlay */}
                      <div
                        className={`relative h-32 ${
                          isDark ? 'bg-gray-900' : 'bg-gray-200'
                        }`}
                        style={{
                          backgroundImage: tripActivity.activity.photoUrl
                            ? `url(${tripActivity.activity.photoUrl})`
                            : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        {/* Fallback emoji when no image */}
                        {!tripActivity.activity.photoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center text-4xl">
                            🏛️
                          </div>
                        )}

                        {/* Warning badge */}
                        {hasVenueIssue && (
                          <div className="absolute top-3 right-3 z-10">
                            <div className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                              ⚠️ Closed
                            </div>
                          </div>
                        )}

                        {/* Text overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                          <h4 className="font-semibold text-lg mb-2 drop-shadow-lg">
                            {tripActivity.activity.name}
                          </h4>
                          <div className="flex items-end justify-between text-sm">
                            <div className="text-gray-200 drop-shadow">
                              <div>
                                {tripActivity.activity.category?.replace(
                                  /_/g,
                                  ' '
                                ) || 'Activity'}
                              </div>
                              <div>
                                {tripActivity.durationMinutes
                                  ? `${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                                  : 'Duration TBD'}
                              </div>
                            </div>

                            <div
                              className={`bg-gray-800/80 px-2 py-1 rounded text-xs font-medium drop-shadow text-right ${
                                hasVenueIssue ? 'text-red-300' : 'text-blue-300'
                              }`}
                            >
                              <div>
                                <TimezoneDisplay
                                  timezone={tripActivity.timezone || 'UTC'}
                                  date={tripActivity.plannedDate}
                                  time={tripActivity.startTime}
                                  className=""
                                />
                              </div>
                              <div>
                                {formatEndTime(
                                  tripActivity.startTime,
                                  tripActivity.durationMinutes || 0
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-3">
                        {/* Address */}
                        {tripActivity.activity.address && (
                          <p
                            className={`text-sm flex items-start ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            <span className="mr-2">📍</span>
                            <span className="flex-1">
                              {tripActivity.activity.address}
                            </span>
                          </p>
                        )}

                        {/* Venue hours warning */}
                        {hasVenueIssue && venueCheck.message && (
                          <div
                            className={`p-3 border rounded-lg ${
                              isDark
                                ? 'bg-red-900/20 border-red-800/50'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <p
                              className={`text-sm ${
                                isDark ? 'text-red-400' : 'text-red-700'
                              }`}
                            >
                              <span className="font-medium">⚠️ Warning:</span>{' '}
                              {venueCheck.message}
                            </p>
                          </div>
                        )}

                        {tripActivity.notes && (
                          <div
                            className={`p-3 border rounded-lg ${
                              isDark
                                ? 'bg-yellow-900/20 border-yellow-700/50'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <p
                              className={`text-sm ${
                                isDark ? 'text-yellow-300' : 'text-gray-700'
                              }`}
                            >
                              <span className="font-medium">💡 Note:</span>{' '}
                              {tripActivity.notes}
                            </p>
                          </div>
                        )}

                        {/* Cost, Rating and Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <span className="text-lg">💰</span>
                              <span
                                className={`text-lg font-semibold ${
                                  isDark ? 'text-gray-100' : 'text-gray-900'
                                }`}
                              >
                                ${tripActivity.activity.estimatedCost || 0}
                              </span>
                            </div>
                            {tripActivity.activity.rating && (
                              <div className="flex items-center space-x-1">
                                <span className="text-lg">⭐</span>
                                <span
                                  className={`text-sm font-medium ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                  }`}
                                >
                                  {tripActivity.activity.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(tripActivity)}
                            className={`flex-1 py-2 px-4 text-sm font-medium border rounded-lg transition-colors ${
                              isDark
                                ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40 border-blue-700/50'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tripActivity)}
                            disabled={deleteMutation.isPending}
                            className={`flex-1 py-2 px-4 text-sm font-medium border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                              isDark
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40 border-red-700/50'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            }`}
                          >
                            {deleteMutation.isPending
                              ? 'Removing...'
                              : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Invalid Activities Section */}
      {invalidActivities.length > 0 && (
        <div
          className={`border-2 rounded-lg overflow-hidden ${
            isDark
              ? 'bg-red-900/10 border-red-800/50'
              : 'bg-red-50 border-red-200'
          }`}
        >
          {/* Warning header */}
          <div
            className={`px-6 py-4 border-b ${
              isDark
                ? 'bg-red-900/20 border-red-800/50'
                : 'bg-red-100 border-red-200'
            }`}
          >
            <div className="flex items-center">
              <span
                className={`text-xl mr-3 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}
              >
                ⚠️
              </span>
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? 'text-red-300' : 'text-red-900'
                  }`}
                >
                  Activities Outside Trip Dates
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? 'text-red-400' : 'text-red-700'
                  }`}
                >
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
                  <h4
                    className={`text-md font-medium mb-3 flex items-center ${
                      isDark ? 'text-red-300' : 'text-red-800'
                    }`}
                  >
                    <span
                      className={`mr-2 ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}
                    >
                      📅
                    </span>
                    {formatDate(date)}
                    <span
                      className={`text-sm font-normal ml-2 ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}
                    >
                      ({dayActivities.length} activities)
                    </span>
                  </h4>

                  {/* Desktop/tablet view for invalid activities */}
                  <div className="hidden md:block space-y-3">
                    {dayActivities.map((tripActivity) => (
                      <div
                        key={tripActivity.id}
                        className={`border rounded-lg p-4 flex items-start space-x-4 ${
                          isDark
                            ? 'bg-gray-800 border-red-800/50'
                            : 'bg-white border-red-200'
                        }`}
                      >
                        {/* Time display */}
                        <div className="flex-shrink-0 w-20 text-right">
                          <div
                            className={`text-sm font-medium ${
                              isDark ? 'text-red-400' : 'text-red-600'
                            }`}
                          >
                            <TimezoneDisplay
                              timezone={tripActivity.timezone || 'UTC'}
                              date={tripActivity.plannedDate}
                              time={tripActivity.startTime}
                            />
                          </div>
                        </div>

                        {/* Activity details */}
                        <div className="flex-1 flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {tripActivity.activity.photoUrl ? (
                              <Image
                                src={tripActivity.activity.photoUrl}
                                alt={tripActivity.activity.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-lg object-cover opacity-75"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg opacity-75 ${
                                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                                }`}
                              >
                                🏛️
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h5
                              className={`font-medium ${
                                isDark ? 'text-red-300' : 'text-red-900'
                              }`}
                            >
                              {tripActivity.activity.name}
                              <span
                                className={`ml-2 text-xs font-normal ${
                                  isDark ? 'text-red-400' : 'text-red-600'
                                }`}
                              >
                                (Outside trip dates)
                              </span>
                            </h5>
                            <p
                              className={`text-sm mt-1 ${
                                isDark ? 'text-red-400' : 'text-red-700'
                              }`}
                            >
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
                              <div
                                className={`mt-2 p-2 border rounded ${
                                  isDark
                                    ? 'bg-yellow-900/20 border-yellow-700/50'
                                    : 'bg-yellow-50 border-yellow-300'
                                }`}
                              >
                                <p
                                  className={`text-sm ${
                                    isDark ? 'text-yellow-300' : 'text-gray-700'
                                  }`}
                                >
                                  <span className="font-medium">Note:</span>{' '}
                                  {tripActivity.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="text-right space-y-1">
                            <button
                              onClick={() => handleEdit(tripActivity)}
                              className={`block w-full px-3 py-1 text-xs border rounded transition-colors ${
                                isDark
                                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/30 border-blue-700/50'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tripActivity)}
                              disabled={deleteMutation.isPending}
                              className={`block w-full px-3 py-1 text-xs border rounded disabled:opacity-50 transition-colors ${
                                isDark
                                  ? 'bg-red-900/30 text-red-400 hover:bg-red-800/30 border-red-700/50'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
                              }`}
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

                  {/* Mobile view for invalid activities - same clean approach */}
                  <div className="block md:hidden space-y-4">
                    {dayActivities.map((tripActivity) => (
                      <div
                        key={tripActivity.id}
                        className={`rounded-lg overflow-hidden shadow-sm ${
                          isDark
                            ? 'bg-gray-800 border border-red-700/70'
                            : 'bg-white border border-red-300'
                        }`}
                      >
                        {/* Header Image with Text Overlay */}
                        <div
                          className={`relative h-32 ${
                            isDark ? 'bg-gray-900' : 'bg-gray-200'
                          }`}
                          style={{
                            backgroundImage: tripActivity.activity.photoUrl
                              ? `url(${tripActivity.activity.photoUrl})`
                              : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        >
                          {/* Fallback emoji when no image */}
                          {!tripActivity.activity.photoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-75">
                              🏛️
                            </div>
                          )}

                          {/* Warning badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <div className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                              ⚠️ Outside Dates
                            </div>
                          </div>

                          {/* Text overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                            {/* Dark gradient overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

                            <div className="relative z-10">
                              <h5 className="font-semibold text-lg mb-2 drop-shadow-lg">
                                {tripActivity.activity.name}
                              </h5>
                              <div className="flex items-end justify-between text-sm">
                                <div className="text-gray-200 drop-shadow">
                                  <div>
                                    {tripActivity.activity.category?.replace(
                                      /_/g,
                                      ' '
                                    ) || 'Activity'}
                                  </div>
                                  <div>
                                    {tripActivity.durationMinutes
                                      ? `${Math.floor(tripActivity.durationMinutes / 60)}h ${tripActivity.durationMinutes % 60}m`
                                      : 'Duration TBD'}
                                  </div>
                                </div>
                                <div className="font-medium text-right text-red-300">
                                  <div className="bg-gray-800/80 px-2 py-1 rounded text-xs">
                                    <div>
                                      <TimezoneDisplay
                                        timezone={
                                          tripActivity.timezone || 'UTC'
                                        }
                                        date={tripActivity.plannedDate}
                                        time={tripActivity.startTime}
                                        className=""
                                      />
                                    </div>
                                    <div>
                                      {formatEndTime(
                                        tripActivity.startTime,
                                        tripActivity.durationMinutes || 0
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-3">
                          {/* Address */}
                          {tripActivity.activity.address && (
                            <p
                              className={`text-sm flex items-start ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              <span className="mr-2">📍</span>
                              <span className="flex-1">
                                {tripActivity.activity.address}
                              </span>
                            </p>
                          )}

                          <div
                            className={`p-3 border rounded-lg ${
                              isDark
                                ? 'bg-red-900/20 border-red-800/50'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <p
                              className={`text-sm ${
                                isDark ? 'text-red-400' : 'text-red-700'
                              }`}
                            >
                              <span className="font-medium">⚠️ Warning:</span>{' '}
                              This activity is scheduled outside your trip dates
                            </p>
                          </div>

                          {tripActivity.notes && (
                            <div
                              className={`p-3 border rounded-lg ${
                                isDark
                                  ? 'bg-yellow-900/20 border-yellow-700/50'
                                  : 'bg-yellow-50 border-yellow-200'
                              }`}
                            >
                              <p
                                className={`text-sm ${
                                  isDark ? 'text-yellow-300' : 'text-gray-700'
                                }`}
                              >
                                <span className="font-medium">💡 Note:</span>{' '}
                                {tripActivity.notes}
                              </p>
                            </div>
                          )}

                          {/* Cost, Rating and Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <span className="text-lg">💰</span>
                                <span
                                  className={`text-lg font-semibold ${
                                    isDark ? 'text-gray-100' : 'text-gray-900'
                                  }`}
                                >
                                  ${tripActivity.activity.estimatedCost || 0}
                                </span>
                              </div>
                              {tripActivity.activity.rating && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-lg">⭐</span>
                                  <span
                                    className={`text-sm font-medium ${
                                      isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}
                                  >
                                    {tripActivity.activity.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex space-x-2 pt-1">
                            <button
                              onClick={() => handleEdit(tripActivity)}
                              className={`flex-1 py-2 px-4 text-sm font-medium border rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40 border-blue-700/50'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(tripActivity)}
                              disabled={deleteMutation.isPending}
                              className={`flex-1 py-2 px-4 text-sm font-medium border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                                isDark
                                  ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40 border-red-700/50'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                              }`}
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
