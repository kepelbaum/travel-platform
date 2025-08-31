import { useQuery } from '@tanstack/react-query';
import { tripActivitiesApi } from '@/lib/api';
import { Trip } from '@/types';

interface BudgetTrackerProps {
  tripId: number;
  trip: Trip;
}

export function BudgetTracker({ tripId, trip }: BudgetTrackerProps) {
  const { data: allActivities } = useQuery({
    queryKey: ['trip-activities', tripId],
    queryFn: () => tripActivitiesApi.getScheduledActivities(tripId),
  });

  // Safety check - don't render until we have trip data
  if (!allActivities) return null;

  // Filter to only activities within trip date range with activity data
  const validActivities = allActivities.filter(
    (ta) =>
      ta.activity &&
      ta.plannedDate >= trip.startDate &&
      ta.plannedDate <= trip.endDate
  );

  // Calculate costs only for valid activities
  const estimatedSpend = validActivities.reduce(
    (sum, ta) => sum + (ta.activity?.estimatedCost || 0),
    0
  );

  const actualSpend = validActivities.reduce(
    (sum, ta) => sum + (ta.actualCost || 0),
    0
  );

  const remainingBudget = trip.budget - estimatedSpend;
  const isOverBudget = estimatedSpend > trip.budget;
  const budgetUsedPercent = Math.min((estimatedSpend / trip.budget) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget Tracker</h3>
        <span className="text-sm text-gray-600">
          {validActivities.length} activities
        </span>
      </div>

      {/* Budget progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Planned spending</span>
          <span>
            ${estimatedSpend} of ${trip.budget}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${budgetUsedPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Budget summary */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Estimated spend</p>
          <p
            className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}
          >
            ${estimatedSpend}
          </p>
        </div>
        <div>
          <p className="text-gray-600">
            {isOverBudget ? 'Over budget' : 'Remaining'}
          </p>
          <p
            className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}
          >
            {isOverBudget ? '-' : ''}${Math.abs(remainingBudget)}
          </p>
        </div>
      </div>

      {/* Over budget warning */}
      {isOverBudget && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700 font-medium text-sm">
              Current plans exceed budget by ${Math.abs(remainingBudget)}
            </span>
          </div>
        </div>
      )}

      {/* Actual spend tracking (if any activities have actual costs) */}
      {actualSpend > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Actual spent so far</span>
            <span className="font-medium text-gray-900">${actualSpend}</span>
          </div>
        </div>
      )}
    </div>
  );
}
