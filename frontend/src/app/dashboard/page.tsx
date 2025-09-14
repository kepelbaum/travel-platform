'use client';

import TripList from '@/components/trips/TripList';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (searchParams.get('tripDeleted') === 'true') {
      queryClient.refetchQueries({ queryKey: ['trips', user?.id] });
    }
  }, [searchParams, queryClient, user?.id]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-24">
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
        >
          Dashboard
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Manage your trips and plan your next adventure
        </p>
      </div>
      <TripList />
    </main>
  );
}
