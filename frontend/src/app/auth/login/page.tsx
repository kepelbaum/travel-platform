import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import LoginForm from '@/components/forms/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | VoidWander',
  description:
    'Sign in to your VoidWander account to continue planning your adventures.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12">
        <LoginForm />
      </main>
    </div>
  );
}
