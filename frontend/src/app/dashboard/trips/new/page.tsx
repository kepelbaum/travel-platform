import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import TripForm from '@/components/forms/TripForm';

export const metadata: Metadata = {
  title: 'Create Trip | VoidWander',
  description: 'Create a new trip and start planning your adventure.',
};

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12">
        <TripForm />
      </main>
    </div>
  );
}
