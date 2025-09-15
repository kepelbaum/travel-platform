import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TripActivity } from '@/types';
import { tripActivitiesApi } from '@/lib/api';
import { useThemeStore } from '@/store/theme';

interface EditTripActivityModalProps {
  tripActivity: TripActivity;
  onSave: () => void;
  onCancel: () => void;
}

export function EditTripActivityModal({
  tripActivity,
  onSave,
  onCancel,
}: EditTripActivityModalProps) {
  const { isDark } = useThemeStore();
  const [formData, setFormData] = useState({
    plannedDate: tripActivity.plannedDate,
    startTime: tripActivity.startTime.substring(0, 5),
    durationMinutes: tripActivity.durationMinutes || 60,
    notes: tripActivity.notes || '',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      tripActivitiesApi.updateScheduledActivity(tripActivity.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-activities'] });
      queryClient.refetchQueries({
        queryKey: ['trip-activities', tripActivity.tripId],
      });
      onSave();
    },
  });

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
      className={`fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center z-50 ${
        isDark ? 'bg-black bg-opacity-75' : 'bg-gray-600 bg-opacity-50'
      }`}
      onClick={onCancel}
    >
      <div
        className={`relative rounded-lg shadow-lg max-w-md w-full mx-4 border ${
          isDark
            ? 'bg-gray-800 border-gray-700 shadow-purple-500/25'
            : 'bg-white border-gray-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h3
            className={`text-lg font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-800'
            }`}
          >
            Edit Activity
          </h3>
          <button
            onClick={onCancel}
            className={`text-xl leading-none transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ×
          </button>
        </div>

        {/* Activity info */}
        <div
          className={`px-6 py-4 border-b ${
            isDark
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            >
              🏛️
            </div>
            <div>
              <h4
                className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {tripActivity.activity.name}
              </h4>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {tripActivity.activity.category?.replace(/_/g, ' ')} • $
                {tripActivity.activity.estimatedCost || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Date
            </label>
            <input
              type="date"
              value={formData.plannedDate}
              onChange={(e) =>
                setFormData({ ...formData, plannedDate: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-500 text-white focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>

          {/* Time */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-500 text-white focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
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
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isDark ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            />
            <div
              className={`flex justify-between text-xs mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <span>15m</span>
              <span>8h</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-300 focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder="Add personal notes about this activity..."
            />
          </div>

          {/* Error message */}
          {updateMutation.error && (
            <div
              className={`p-4 border rounded-lg ${
                isDark
                  ? 'bg-red-900/30 border-red-500/50 text-red-300'
                  : 'bg-red-100 border-red-400 text-red-700'
              }`}
            >
              Failed to update activity. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 hover:scale-105 ${
                isDark
                  ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg shadow-purple-500/20'
                  : 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
              }`}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className={`w-full py-3 px-4 border rounded-lg shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDark
                  ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-purple-500'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
