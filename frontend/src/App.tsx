import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import AuthPanel from './features/landing/components/Auth/AuthPanel';

// Stub components until we port the actual UI
const DashboardPage = () => <div className="p-10 font-bold text-2xl">Dashboard (Ported Soon)</div>;

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-10">Loading session...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPanel defaultMode="login" />} />
      <Route path="/register" element={<AuthPanel defaultMode="register" />} />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
