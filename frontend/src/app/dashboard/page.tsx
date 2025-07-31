'use client';

import Header from '@/components/layout/Header';
import TripList from '@/components/trips/TripList';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';

// export const metadata: Metadata = {
//   title: 'Dashboard | VoidWander',
//   description: 'Manage your trips and plan your next adventure.',
// };
// TODO: unused metadata, tbd

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (searchParams.get('tripDeleted') === 'true') {
      // Force refetch trips when we arrive from deletion
      queryClient.refetchQueries({ queryKey: ['trips', user?.id] });
    }
  }, [searchParams, queryClient, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* {deletedTripName && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          ✓ Trip "{deletedTripName}" deleted
        </div>
      )} */}
      {/* TODO: Toast notification*/}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your trips and plan your next adventure
          </p>
        </div>
        <TripList />
      </main>
    </div>
  );
}
