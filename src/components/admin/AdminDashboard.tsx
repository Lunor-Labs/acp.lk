import { useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, GraduationCap, BookOpen, LogOut, BarChart3, User, Menu, X, Home } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-teal-600 to-teal-700 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex-1 flex flex-col relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <GraduationCap className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EduPortal</h1>
                <p className="text-xs text-teal-100">Academy</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-teal-500 p-2 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <NavLink
              to="/"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-white hover:bg-teal-500"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Go to Website</span>
            </NavLink>
          </div>

          <nav className="space-y-1">
            {[
              { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { path: '/admin/teachers',  label: 'Teachers',  icon: GraduationCap },
              { path: '/admin/students',  label: 'Students',  icon: Users },
              { path: '/admin/classes',   label: 'Classes',   icon: BookOpen },
              { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
            ].map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    isActive ? 'bg-white text-teal-700 shadow-lg' : 'text-white hover:bg-teal-500'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-teal-500">
            <div className="px-4 py-4 mb-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                  <p className="text-xs text-teal-100">Administrator</p>
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-white hover:bg-teal-500 transition mx-auto"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                      </div>
                      <div className="bg-teal-100 p-3 rounded-lg"><Users className="w-6 h-6 text-teal-600" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Teachers</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg"><GraduationCap className="w-6 h-6 text-green-600" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Classes</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                      </div>
                      <div className="bg-teal-100 p-3 rounded-lg"><BookOpen className="w-6 h-6 text-teal-600" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">LKR 0</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg"><span className="text-2xl">💰</span></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-600">Content for dashboard will appear here</p>
                </div>
              </>
            } />
            <Route path=":tab" element={
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600">Content will appear here</p>
              </div>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}
