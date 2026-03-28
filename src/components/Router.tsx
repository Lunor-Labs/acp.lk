import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthPanel from './landing/Auth/AuthPanel';
import AdminDashboard from './admin/AdminDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import LandingPage from './public/LandingPage';

/* ── Loading spinner ─────────────────────────────────────────────────── */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/* ── Guard: requires authentication ─────────────────────────────────── */
function RequireAuth({ role }: { role?: 'admin' | 'teacher' | 'student' }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user || !profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && profile.role !== role) {
    // Wrong role → redirect to correct dashboard
    return <Navigate to={`/${profile.role}`} replace />;
  }
  return <Outlet />;
}

/* ── Guard: redirect logged-in users away from /login and /register ─── */
function RedirectIfAuthed() {
  const { user, profile, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user && profile) return <Navigate to={`/${profile.role}`} replace />;
  return <Outlet />;
}

/* ── Main router ─────────────────────────────────────────────────────── */
export default function Router() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages – redirect away if already logged in */}
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login"    element={<AuthPanel defaultMode="login" />} />
        <Route path="/register" element={<AuthPanel defaultMode="register" />} />
      </Route>

      {/* Student portal */}
      <Route element={<RequireAuth role="student" />}>
        <Route path="/student/*" element={<StudentDashboard />} />
      </Route>

      {/* Teacher portal */}
      <Route element={<RequireAuth role="teacher" />}>
        <Route path="/teacher/*" element={<TeacherDashboard />} />
      </Route>

      {/* Admin portal */}
      <Route element={<RequireAuth role="admin" />}>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
