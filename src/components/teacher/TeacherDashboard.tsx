import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, BookOpen, FileText, Package, LogOut, GraduationCap, TrendingUp, DollarSign, UserPlus, User } from 'lucide-react';
import MyClasses from './MyClasses';
import Exams from './Exams';
import StudyPacks from './StudyPacks';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalStudents: number;
  newStudents: number;
  totalFeeCollection: number;
  monthlyFeeCollection: number;
}

interface StudentGrowthData {
  month: string;
  count: number;
}

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('classes');
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    newStudents: 0,
    totalFeeCollection: 0,
    monthlyFeeCollection: 0,
  });
  const [growthData, setGrowthData] = useState<StudentGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'dashboard' && profile?.id) {
      fetchDashboardData();
    }
  }, [activeTab, profile?.id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .maybeSingle();

      if (!teacher) return;

      const totalStudentsQuery = supabase
        .from('enrollments')
        .select('student_id', { count: 'exact' })
        .eq('is_active', true)
        .in('class_id',
          supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacher.id)
        );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newStudentsQuery = supabase
        .from('enrollments')
        .select('student_id', { count: 'exact' })
        .eq('is_active', true)
        .gte('enrolled_at', thirtyDaysAgo.toISOString())
        .in('class_id',
          supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacher.id)
        );

      const totalFeeQuery = supabase
        .from('fee_payments')
        .select('amount')
        .eq('teacher_id', teacher.id);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyFeeQuery = supabase
        .from('fee_payments')
        .select('amount')
        .eq('teacher_id', teacher.id)
        .gte('payment_date', `${currentMonth}-01`);

      const [totalStudentsRes, newStudentsRes, totalFeeRes, monthlyFeeRes] = await Promise.all([
        totalStudentsQuery,
        newStudentsQuery,
        totalFeeQuery,
        monthlyFeeQuery,
      ]);

      const totalFeeCollection = totalFeeRes.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const monthlyFeeCollection = monthlyFeeRes.data?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      setStats({
        totalStudents: totalStudentsRes.count || 0,
        newStudents: newStudentsRes.count || 0,
        totalFeeCollection,
        monthlyFeeCollection,
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('enrolled_at')
        .eq('is_active', true)
        .gte('enrolled_at', sixMonthsAgo.toISOString())
        .in('class_id',
          supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacher.id)
        );

      const monthCounts: { [key: string]: number } = {};
      enrollments?.forEach(enrollment => {
        const month = new Date(enrollment.enrolled_at).toISOString().slice(0, 7);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const months: StudentGrowthData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        months.push({
          month: monthName,
          count: monthCounts[monthKey] || 0,
        });
      }

      setGrowthData(months);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
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
              onClick={() => setActiveTab('classes')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'classes'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium">My Classes</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'exams'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Exams</span>
            </button>

            <button
              onClick={() => setActiveTab('study-packs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'study-packs'
                  ? 'bg-white text-teal-700 shadow-lg'
                  : 'text-white hover:bg-teal-500'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Study Packs</span>
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
                  <p className="text-xs text-teal-100">
                    {profile?.teacher_number ? `Teacher #${profile.teacher_number}` : 'Teacher'}
                  </p>
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

      <main className="flex-1 overflow-auto">
        {activeTab === 'classes' ? (
          <MyClasses />
        ) : activeTab === 'exams' ? (
          <Exams />
        ) : activeTab === 'study-packs' ? (
          <StudyPacks />
        ) : activeTab === 'dashboard' ? (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
                      <Users className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500 mt-2">Active enrollments</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">New Students</h3>
                      <UserPlus className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.newStudents}</p>
                    <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Fee Collection</h3>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      ${stats.totalFeeCollection.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">All time</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-600">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Monthly Fee Collection</h3>
                      <TrendingUp className="w-8 h-8 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      ${stats.monthlyFeeCollection.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Current month</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Student Growth</h3>
                  {growthData.length > 0 ? (
                    <StudentGrowthChart data={growthData} />
                  ) : (
                    <p className="text-gray-500 text-center py-12">No enrollment data available</p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-gray-600">Content for {activeTab} will appear here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StudentGrowthChart({ data }: { data: StudentGrowthData[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 250;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (d.count / maxCount) * innerHeight;
    return { x, y, ...d };
  });

  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding.top + (i / 4) * innerHeight;
          const value = Math.round(maxCount * (1 - i / 4));
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 5}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path
          d={pathData}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#14b8a6"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={chartHeight - padding.bottom + 25}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-medium"
            >
              {point.month}
            </text>
            <text
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              className="text-xs fill-gray-900 font-semibold"
            >
              {point.count}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#9ca3af"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
