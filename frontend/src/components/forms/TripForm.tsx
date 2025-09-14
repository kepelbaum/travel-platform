'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { tripsApi } from '@/lib/api';
import { useState } from 'react';

const tripSchema = z
  .object({
    name: z.string().min(1, 'Trip name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    budget: z.number().min(0, 'Budget must be positive').optional(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

type TripFormData = z.infer<typeof tripSchema>;

interface TripFormProps {
  initialData?: Partial<TripFormData>;
  tripId?: number;
  onSuccess?: () => void;
}

export default function TripForm({
  initialData,
  tripId,
  onSuccess,
}: TripFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: initialData,
  });

  const createMutation = useMutation({
    mutationFn: (data: TripFormData) =>
      tripsApi.createTrip(data, user?.id || 0),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      router.push('/dashboard?tripDeleted=true');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TripFormData) =>
      tripsApi.updateTrip(tripId!, data, user?.id || 0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      onSuccess?.() || router.push(`/dashboard/trips/${tripId}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      return tripsApi.deleteTrip(tripId!, user?.id || 0);
    },
    onSuccess: () => {
      router.push('/dashboard?tripDeleted=true');
    },
  });

  const onSubmit = (data: TripFormData) => {
    const tripData = {
      ...data,
      budget: data.budget || 0,
      status: 'DRAFT' as const,
    };

    if (tripId) {
      updateMutation.mutate(tripData);
    } else {
      createMutation.mutate(tripData);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className={`max-w-2xl mx-auto p-6 rounded-lg shadow-lg ${
        isDark
          ? 'bg-gray-800 border border-gray-700 shadow-purple-500/25'
          : 'bg-white border border-gray-300 shadow-gray-400/20'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
        >
          {tripId ? 'Edit Trip' : 'Create New Trip'}
        </h2>

        {/* Delete button (only show for existing trips) */}
        {tripId && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border border-transparent rounded-md ${
              isDark
                ? 'text-white bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25'
                : 'text-white bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25'
            }`}
          >
            Delete Trip
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Trip Name
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="European Adventure"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="startDate"
              className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Start Date
            </label>
            <input
              {...register('startDate')}
              type="date"
              id="startDate"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endDate"
              className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              End Date
            </label>
            <input
              {...register('endDate')}
              type="date"
              id="endDate"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.endDate.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="budget"
            className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Budget (USD)
          </label>
          <input
            {...register('budget', { valueAsNumber: true })}
            type="number"
            id="budget"
            min="0"
            step="0.01"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="3000"
          />
          {errors.budget && (
            <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isLoading ? 'Saving...' : tripId ? 'Update Trip' : 'Create Trip'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className={`flex-1 flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors ${
              isDark
                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
              isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
            }`}
          >
            <h3
              className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            >
              Delete Trip
            </h3>
            <p
              className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Are you sure you want to delete this trip? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  isDark
                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
