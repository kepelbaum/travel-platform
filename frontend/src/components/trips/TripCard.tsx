'use client';

import { Trip } from '@/types';
import { useTripPlanningStore } from '@/store/tripPlanning';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const { setActiveTrip } = useTripPlanningStore();
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
    today.setHours(0, 0, 0, 0); // Reset to start of day

    // Parse trip start date directly
    const [year, month, day] = trip.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);

    const daysUntil = Math.ceil(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil > 0) {
      return {
        text: `${daysUntil} days away`,
        color: 'bg-blue-100 text-blue-800',
      };
    } else if (daysUntil === 0) {
      return {
        text: 'Starts today!',
        color: 'bg-green-100 text-green-800',
      };
    } else {
      const endDate = new Date(trip.endDate);
      const daysFromEnd = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysFromEnd >= 0) {
        return {
          text: 'In progress',
          color: 'bg-green-100 text-green-800',
        };
      } else {
        return {
          text: 'Completed',
          color: 'bg-purple-100 text-purple-800',
        };
      }
    }
  };

  const tripStatus = getDaysUntilTrip();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow h-[280px] flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {trip.name}
        </h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tripStatus.color}`}
        >
          {tripStatus.text}
        </span>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Dates:</span>{' '}
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
        </p>
        {trip.budget && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Budget:</span> $
            {trip.budget.toLocaleString()}
          </p>
        )}
        <p className="text-sm text-gray-600">
          <span className="font-medium">Destinations:</span>{' '}
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
            : '0'}
        </p>
      </div>

      <div className="flex space-x-2 mt-auto">
        <Link
          href={`/dashboard/trips/${trip.id}`}
          className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View
        </Link>

        <Link
          href={`/dashboard/trips/${trip.id}/edit`}
          className="flex-1 text-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Edit
        </Link>
        <button
          onClick={handleStartPlanning}
          className="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
        >
          Plan
        </button>
      </div>
    </div>
  );
}
