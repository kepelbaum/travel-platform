import { Trip } from '@/types';

interface TripDetailsInfoProps {
  trip: Trip;
}

export function TripDetails({ trip }: TripDetailsInfoProps) {
  const calculateDuration = () => {
    return Math.ceil(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow mb-8">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Trip Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
            <p className="text-sm text-gray-900">{calculateDuration()} days</p>
          </div>

          {trip.budget && trip.budget > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Budget</h3>
              <p className="text-sm text-gray-900">
                ${trip.budget.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <p className="text-sm text-gray-900 capitalize">
              {trip.status.toLowerCase()}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Destinations
            </h3>
            <p className="text-sm text-gray-900">
              {trip.destinations?.length || 0} destination
              {(trip.destinations?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
