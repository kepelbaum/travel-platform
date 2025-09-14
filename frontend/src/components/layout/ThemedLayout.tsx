'use client';

import { useThemeStore } from '@/store/theme';
import BackgroundEffects from '@/components/ui/BackgroundEffects';
import VoidTheCat from '@/components/ui/VoidTheCat';

interface ThemedLayoutProps {
  children: React.ReactNode;
  showCat?: boolean;
  showBackground?: boolean;
  className?: string;
}

export default function ThemedLayout({
  children,
  showCat = true,
  showBackground = true,
  className = '',
}: ThemedLayoutProps) {
  const { isDark } = useThemeStore();

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDark
          ? 'bg-gradient-to-br from-gray-900 to-black text-gray-100'
          : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900'
      } ${className}`}
    >
      {showBackground && <BackgroundEffects />}
      <div className="relative z-10">{children}</div>
      {showCat && <VoidTheCat />}
    </div>
  );
}
