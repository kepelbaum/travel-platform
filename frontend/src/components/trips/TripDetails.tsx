'use client';

import { Trip } from '@/types';
import { useThemeStore } from '@/store/theme';

interface TripDetailsInfoProps {
  trip: Trip;
}

export function TripDetails({ trip }: TripDetailsInfoProps) {
  const { isDark } = useThemeStore();

  const calculateDuration = () => {
    return Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    const startDate = new Date(trip.startDate);
    const daysUntil = Math.ceil(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 0) {
      return `${daysUntil} days away`;
    } else if (daysUntil === 0) {
      return 'Starts today!';
    } else {
      const endDate = new Date(trip.endDate);
      const daysFromEnd = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysFromEnd >= 0) {
        return 'Trip in progress';
      } else {
        return 'Trip completed';
      }
    }
  };

  return (
    <div
      className={`rounded-lg shadow-lg mb-8 ${
        isDark
          ? 'bg-gray-800 border border-gray-700 shadow-purple-500/25'
          : 'bg-white border border-gray-300 shadow-gray-400/20'
      }`}
    >
      <div className="p-6">
        <h2
          className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
        >
          Trip Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3
              className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Duration
            </h3>
            <p
              className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
            >
              {calculateDuration()} days
            </p>
          </div>

          {trip.budget && trip.budget > 0 && (
            <div>
              <h3
                className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Budget
              </h3>
              <p
                className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
              >
                ${trip.budget.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <h3
              className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Timeline
            </h3>
            <p
              className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
            >
              {getDaysUntilTrip()}
            </p>
          </div>

          <div>
            <h3
              className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Destinations
            </h3>
            <p
              className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
            >
              {trip.destinations?.length || 0} destination
              {(trip.destinations?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
