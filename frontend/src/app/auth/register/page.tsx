import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import RegisterForm from '@/components/forms/RegisterForm';

export const metadata: Metadata = {
  title: 'Sign Up | VoidWander',
  description:
    'Create your VoidWander account and start planning your next adventure.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12">
        <RegisterForm />
      </main>
    </div>
  );
}
