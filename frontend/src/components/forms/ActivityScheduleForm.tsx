'use client';

import { useState } from 'react';
import { Activity } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripActivitiesApi } from '@/lib/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Schedule Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Activity info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-3">
            {activity.photoUrl ? (
              <img
                src={activity.photoUrl}
                alt={activity.name}
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xl">
                🏛️
              </div>
            )}
            <div>
              <h3 className="font-medium">{activity.name}</h3>
              <p className="text-sm text-gray-600">
                {activity.category.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>15 min</span>
              <span>8 hours</span>
            </div>
          </div>

          {formData.startTime && (
            <div className="bg-blue-50 p-3 rounded text-sm">
              <strong>Time:</strong> {formData.startTime} -{' '}
              {calculateEndTime(formData.startTime, formData.durationMinutes)}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any special notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {scheduleActivity.isPending ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>

          {scheduleActivity.error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Failed to schedule activity. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
