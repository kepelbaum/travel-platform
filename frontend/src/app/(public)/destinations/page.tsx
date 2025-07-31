import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import DestinationList from '@/components/destinations/DestinationList';

export const metadata: Metadata = {
  title: 'Destinations | VoidWander',
  description:
    'Explore amazing destinations around the world for your next trip.',
};

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <DestinationList />
      </main>
    </div>
  );
}
