'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const { user, isAuthenticated, logout, isAuthLoading } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                VoidWander
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="/destinations"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Destinations
              </Link>

              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Trips
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Hello, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
