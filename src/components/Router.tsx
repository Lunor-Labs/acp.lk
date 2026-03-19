import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthPanel } from './landing/Auth';
import AdminDashboard from './admin/AdminDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import LandingPage from './public/LandingPage';

export default function Router() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'portal'>('landing');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle landing page view regardless of auth status
  if (view === 'landing') {
    return (
      <LandingPage
        onLoginRequest={() => {
          if (user && profile) {
            setView('portal');
          } else {
            setView('login');
          }
        }}
      />
    );
  }

  // Not on landing page, check if logged in
  if (!user || !profile) {
    return (
      <AuthPanel
        defaultMode={view === 'register' ? 'register' : 'login'}
        onBackToHome={() => setView('landing')}
      />
    );
  }

  // Logged in and not on landing page: show appropriate dashboard
  const handleGoToLanding = () => setView('landing');

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard onGoToLanding={handleGoToLanding} />;
    case 'teacher':
      return <TeacherDashboard onGoToLanding={handleGoToLanding} />;
    case 'student':
      return <StudentDashboard onGoToLanding={handleGoToLanding} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Invalid Role</h1>
            <p className="text-gray-600">Your account role is not recognized.</p>
            <button
              onClick={handleGoToLanding}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              Back to Landing Page
            </button>
          </div>
        </div>
      );
  }
}
