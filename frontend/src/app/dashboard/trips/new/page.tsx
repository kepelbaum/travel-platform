'use client';

import TripForm from '@/components/forms/TripForm';
import { useThemeStore } from '@/store/theme';

export default function NewTripPage() {
  const { isDark } = useThemeStore();

  return (
    <main className="py-12 pb-32 sm:pb-24">
      <TripForm />
    </main>
  );
}
