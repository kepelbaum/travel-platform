import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactQueryProvider } from '@/lib/react-query';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { NavigationHandler } from '@/components/layout/NavigationHandler';
import ThemedLayout from '@/components/layout/ThemedLayout';
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin', 'cyrillic', 'latin-ext'] });

export const metadata: Metadata = {
  title: 'VoidWander',
  description:
    'Explore the unknown with VoidWander- intelligent travel planning for your next adventure',
  keywords:
    'travel planning, trip planner, destinations, travel recommendations',
  authors: [{ name: 'Kirill Epelbaum' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthInitializer>
            <ThemedLayout showCat={true} showBackground={true}>
              <Header />
              <NavigationHandler />
              {children}
            </ThemedLayout>
          </AuthInitializer>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
