import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './auth/Login';
import Register from './auth/Register';
import AdminDashboard from './admin/AdminDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import LandingPage from './public/LandingPage';

export default function Router() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

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

  if (!user || !profile) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }

    if (showLogin) {
      return <Login onToggle={() => setShowLogin(false)} />;
    }

    return <Register onToggle={() => setShowLogin(true)} />;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Invalid Role</h1>
            <p className="text-gray-600">Your account role is not recognized.</p>
          </div>
        </div>
      );
  }
}
