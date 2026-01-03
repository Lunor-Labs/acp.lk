import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, GraduationCap, BookOpen, LogOut, BarChart3, User } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gradient-to-b from-teal-600 to-teal-700 text-white flex flex-col">
        <div className="p-6 flex-1 flex flex-col relative">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-white p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EduPortal</h1>
              <p className="text-xs text-teal-100">Academy</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'teachers'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium">Teachers</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'students'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Students</span>
            </button>

            <button
              onClick={() => setActiveTab('classes')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'classes'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Classes</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'analytics'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </button>
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

      <main className="flex-1 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">LKR 0</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">Content for {activeTab} will appear here</p>
        </div>
      </main>
    </div>
  );
}
