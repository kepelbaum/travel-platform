'use client';

import { Trip } from '@/types';
import { useTripPlanningStore } from '@/store/tripPlanning';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useThemeStore } from '@/store/theme';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const { setActiveTrip } = useTripPlanningStore();
  const { isDark } = useThemeStore();
  const router = useRouter();

  const handleStartPlanning = () => {
    setActiveTrip(trip);
    router.push('/destinations');
  };

  const formatDate = (dateString: string) => {
    // Parse date components directly to avoid timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = trip.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);

    const daysUntil = Math.ceil(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 0) {
      return {
        text: `${daysUntil} days`,
        textLong: `${daysUntil} days away`,
        color: isDark
          ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50'
          : 'bg-blue-100 text-blue-800',
      };
    } else if (daysUntil === 0) {
      return {
        text: 'Today!',
        textLong: 'Starts today!',
        color: isDark
          ? 'bg-green-900/30 text-green-300 border border-green-700/50'
          : 'bg-green-100 text-green-800',
      };
    } else {
      const endDate = new Date(trip.endDate);
      const daysFromEnd = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysFromEnd >= 0) {
        return {
          text: 'Active',
          textLong: 'In progress',
          color: isDark
            ? 'bg-green-900/30 text-green-300 border border-green-700/50'
            : 'bg-green-100 text-green-800',
        };
      } else {
        return {
          text: 'Done',
          textLong: 'Completed',
          color: isDark
            ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50'
            : 'bg-purple-100 text-purple-800',
        };
      }
    }
  };
  const tripStatus = getDaysUntilTrip();

  return (
    <div
      className={`rounded-lg border overflow-hidden hover:shadow-lg transition-shadow h-[280px] flex flex-col ${
        isDark
          ? 'bg-gray-800 border-gray-700 shadow-lg shadow-purple-500/25'
          : 'bg-white border-gray-300 shadow-lg shadow-gray-400/20'
      }`}
    >
      {/* Header section - unified with card */}
      <div className="px-6 py-4 flex justify-between items-center">
        <h3
          className={`text-lg font-bold truncate ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}
        >
          {trip.name}
        </h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tripStatus.color}`}
        >
          <span className="hidden sm:inline">{tripStatus.textLong}</span>
          <span className="sm:hidden">{tripStatus.text}</span>
        </span>
      </div>

      {/* Content section */}
      <div className="p-6 pt-0 flex flex-col flex-1">
        <div className="space-y-2 mb-4 flex-1">
          <p
            className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <span
              className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
            >
              Dates:
            </span>{' '}
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
          {trip.budget && (
            <p
              className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <span
                className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
              >
                Budget:
              </span>{' '}
              ${trip.budget.toLocaleString()}
            </p>
          )}
          <p
            className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <span
              className={`font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}
            >
              Destinations:
            </span>{' '}
            {trip.destinations && trip.destinations.length > 0
              ? (() => {
                  const destinationNames = trip.destinations.map((d) => d.name);
                  let displayText = '';
                  let count = 0;

                  for (const name of destinationNames) {
                    const newText =
                      count === 0 ? name : `${displayText}, ${name}`;
                    if (newText.length > 50) {
                      const remaining = destinationNames.length - count;
                      return `${displayText} and ${remaining} more`;
                    }
                    displayText = newText;
                    count++;
                  }

                  return displayText;
                })()
              : 'None'}
          </p>
        </div>

        <div className="flex space-x-2 mt-auto">
          <Link
            href={`/dashboard/trips/${trip.id}`}
            className={`flex-1 text-center px-3 py-2.5 border border-transparent rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
              isDark
                ? 'text-gray-100 bg-gray-700 hover:bg-gray-600'
                : 'text-gray-100 bg-slate-600 hover:bg-slate-700'
            }`}
          >
            View
          </Link>

          <Link
            href={`/dashboard/trips/${trip.id}/edit`}
            className="flex-1 text-center px-3 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Edit
          </Link>
          <button
            onClick={handleStartPlanning}
            className="flex-1 px-3 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-green-700 hover:bg-green-800 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
          >
            Plan
          </button>
        </div>
      </div>
    </div>
  );
}
