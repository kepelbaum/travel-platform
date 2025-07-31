import LoginForm from '@/components/forms/LoginForm';
import RegisterForm from '@/components/forms/RegisterForm';
import TripList from '@/components/trips/TripList';
import TripForm from '@/components/forms/TripForm';
import Header from '@/components/layout/Header';

export default function TestLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* <Header /> */}
      {/* <LoginForm /> */}
      {/* <RegisterForm /> */}
      {/* <TripList /> */}
      <TripForm />
    </div>
  );
}
