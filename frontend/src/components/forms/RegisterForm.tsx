'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { authApi } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { isDark } = useThemeStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.user, data.token);
      router.push('/dashboard');
    },
    onError: () => {
      setError('Email already exists or registration failed');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setError('');
    registerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDark
              ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDark
              ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDark
              ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
          }`}
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div
          className={`p-4 border rounded-lg ${
            isDark
              ? 'bg-red-900/30 border-red-500/50 text-red-300'
              : 'bg-red-100 border-red-400 text-red-700'
          }`}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 hover:scale-105 ${
          isDark
            ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg shadow-purple-500/20'
            : 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
        }`}
      >
        {registerMutation.isPending ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Creating account...
          </div>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="text-center">
        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>
          Already have an account?{' '}
          <a
            href="/auth/login"
            className={`font-medium transition-colors ${
              isDark
                ? 'text-purple-400 hover:text-purple-300'
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
}
