'use client';

import LoginForm from '@/components/forms/LoginForm';
import ThemedLayout from '@/components/layout/ThemedLayout';
import { useThemeStore } from '@/store/theme';

export default function LoginPage() {
  const { isDark } = useThemeStore();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 pb-24 overflow-hidden">
      <div className="max-w-md w-full space-y-6 max-w-[90vw] sm:max-w-md">
        <div className="text-center">
          <h1
            className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}
          >
            Welcome Back!
          </h1>
          <p
            className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Sign in to continue your void wandering journey...
          </p>
        </div>

        <div
          className={`rounded-xl shadow-2xl p-8 border ${
            isDark
              ? 'bg-gray-800/60 backdrop-blur-sm border-gray-700 shadow-purple-500/10'
              : 'bg-white border-gray-200'
          }`}
        >
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
