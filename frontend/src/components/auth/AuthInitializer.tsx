'use client';

import { useAuthStore } from '@/store/auth';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthLoading } = useAuthStore();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
