'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripActivitiesApi } from '@/lib/api';
import { useThemeStore } from '@/store/theme';

interface ActivityScheduleFormProps {
  activity: Activity;
  tripId: number;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ActivityScheduleForm({
  activity,
  tripId,
  onClose,
  onScheduled,
}: ActivityScheduleFormProps) {
  const { isDark } = useThemeStore();
  const [formData, setFormData] = useState({
    plannedDate: '',
    startTime: '',
    durationMinutes: activity.durationMinutes || 60,
    notes: '',
  });

  const queryClient = useQueryClient();

  const scheduleActivity = useMutation({
    mutationFn: (data: typeof formData) =>
      tripActivitiesApi.scheduleActivity({
        tripId,
        activityId: activity.id,
        plannedDate: data.plannedDate,
        startTime: data.startTime,
        durationMinutes: data.durationMinutes,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-activities', tripId] });
      onScheduled();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plannedDate || !formData.startTime) return;
    scheduleActivity.mutate(formData);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toTimeString().slice(0, 5);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${
        isDark ? 'bg-black bg-opacity-75' : 'bg-black bg-opacity-50'
      }`}
    >
      <div
        className={`rounded-lg max-w-md w-full border ${
          isDark
            ? 'bg-gray-800 border-gray-700 shadow-lg shadow-purple-500/25'
            : 'bg-white border-gray-300'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2
            className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Schedule Activity
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Activity info */}
        <div
          className={`p-4 border-b ${
            isDark
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {activity.photoUrl ? (
              <img
                src={activity.photoUrl}
                alt={activity.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded flex items-center justify-center text-xl ${
                  isDark ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              >
                🏛️
              </div>
            )}
            <div>
              <h3
                className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {activity.name}
              </h3>
              <p
                className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {activity.category.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Date
            </label>
            <input
              type="date"
              required
              value={formData.plannedDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  plannedDate: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:outline-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Start Time
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:outline-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Duration: {Math.floor(formData.durationMinutes / 60)}h{' '}
              {formData.durationMinutes % 60}m
            </label>
            <input
              type="range"
              min="15"
              max="480"
              step="15"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  durationMinutes: parseInt(e.target.value),
                }))
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
              <span>15 min</span>
              <span>8 hours</span>
            </div>
          </div>

          {formData.startTime && (
            <div
              className={`p-3 rounded text-sm ${
                isDark
                  ? 'bg-blue-900/30 text-blue-300'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              <strong>Time:</strong> {formData.startTime} -{' '}
              {calculateEndTime(formData.startTime, formData.durationMinutes)}
            </div>
          )}

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDark ? 'text-gray-100' : 'text-gray-700'
              }`}
            >
              Notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any special notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:outline-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded-md font-medium transition-colors ${
                isDark
                  ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !formData.plannedDate ||
                !formData.startTime ||
                scheduleActivity.isPending
              }
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 disabled:opacity-50 ${
                isDark
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 hover:scale-105'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${
                !formData.plannedDate ||
                !formData.startTime ||
                scheduleActivity.isPending
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              {scheduleActivity.isPending ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>

          {scheduleActivity.error && (
            <div
              className={`mt-3 p-2 border rounded text-sm ${
                isDark
                  ? 'bg-red-900/30 border-red-500/50 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              Failed to schedule activity. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
