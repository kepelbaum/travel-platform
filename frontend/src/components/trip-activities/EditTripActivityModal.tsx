import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripActivity } from '@/types';
import { tripActivitiesApi } from '@/lib/api';

interface EditTripActivityModalProps {
  tripActivity: TripActivity;
  onSave: () => void; // Changed to simple callback since we handle mutation internally
  onCancel: () => void;
}

export function EditTripActivityModal({
  tripActivity,
  onSave,
  onCancel,
}: EditTripActivityModalProps) {
  const [formData, setFormData] = useState({
    plannedDate: tripActivity.plannedDate,
    startTime: tripActivity.startTime.substring(0, 5), // Remove seconds
    durationMinutes: tripActivity.durationMinutes || 60,
    notes: tripActivity.notes || '',
  });

  const queryClient = useQueryClient();

  // Handle mutation internally
  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      tripActivitiesApi.updateScheduledActivity(tripActivity.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-activities'] }); // Broader invalidation
      queryClient.refetchQueries({
        queryKey: ['trip-activities', tripActivity.tripId],
      });
      onSave(); // Close modal
    },
    // Remove onError - let the component handle error display
  });

  // Close modal on outside click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Activity</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Activity info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              🏛️
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {tripActivity.activity.name}
              </h4>
              <p className="text-sm text-gray-600">
                {tripActivity.activity.category?.replace(/_/g, ' ')} • $
                {tripActivity.activity.estimatedCost || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.plannedDate}
              onChange={(e) =>
                setFormData({ ...formData, plannedDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration ({formatDuration(formData.durationMinutes)})
            </label>
            <input
              type="range"
              min="15"
              max="480"
              step="15"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationMinutes: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15m</span>
              <span>8h</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add personal notes about this activity..."
            />
          </div>

          {/* Error message - like ActivityScheduleForm */}
          {updateMutation.error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Failed to update activity. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
