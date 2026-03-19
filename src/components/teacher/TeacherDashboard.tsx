import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, FileText, Package, LogOut, GraduationCap, TrendingUp, DollarSign, UserPlus, User, Menu, X, Image, MessageSquare, Trophy, AlertTriangle } from 'lucide-react';
import MyClasses from './MyClasses';
import Exams from './Exams';
import StudyPacks from './StudyPacks';
import GalleryManager from './GalleryManager';
import ReviewsManager from './ReviewsManager';
import TestResultsManager from './TestResultsManager';
import SuccessManager from './SuccessManager';
import { supabase } from '../../lib/supabase';
import { TeacherRepository } from '../../repositories/TeacherRepository';

const teacherRepository = new TeacherRepository();

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    newStudents: 0,
    totalFeeCollection: 0,
    monthlyFeeCollection: 0,
  });
  const [growthData, setGrowthData] = useState<StudentGrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      // Resolve the teacher record once and store its ID
      setTeacherLoading(true);
      teacherRepository.findByProfileId(profile.id)
        .then((teacher) => {
          if (teacher) setTeacherId(teacher.id);
        })
        .catch((err) => console.error('Error fetching teacher record:', err))
        .finally(() => setTeacherLoading(false));
    }
  }, [profile?.id]);

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
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset - y - 0 left - 0 z - 50
w - 64 bg - slate - 900 text - white flex flex - col
h - screen overflow - hidden
        transform transition - transform duration - 300 ease -in -out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
`}>
        <div className="p-6 flex-1 flex flex-col relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-[#eb1b23] p-2 rounded-lg shadow-lg shadow-red-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ACP</h1>
                <p className="text-xs text-slate-400">Teacher Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-slate-800 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1 overflow-y-auto flex-1 -mx-2 px-2 max-h-[calc(100vh-280px)] lg:max-h-none">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'dashboard'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('classes');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'classes'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium">My Classes</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('exams');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'exams'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Exams</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('study-packs');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'study-packs'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Study Packs</span>
            </button>

            <div className="pt-2 border-t border-slate-700/60 mt-2">
              <p className="text-xs text-slate-500 px-4 py-1 font-medium uppercase tracking-widest">Landing Page</p>
            </div>

            <button
              onClick={() => {
                setActiveTab('gallery');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'gallery'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <Image className="w-5 h-5" />
              <span className="font-medium">Gallery</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('reviews');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'reviews'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Reviews</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('test-results');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'test-results'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Test Results</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('success');
                setIsMobileMenuOpen(false);
              }}
              className={`w - full flex items - center space - x - 3 px - 4 py - 3 rounded - xl transition - all duration - 200 ${activeTab === 'success'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } `}
            >
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Success</span>
            </button>
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-700">
            <div className="px-4 py-4 mb-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                  <p className="text-xs text-slate-400">
                    Teacher
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 mx-auto"
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
        {activeTab === 'classes' ? (
          <MyClasses />
        ) : activeTab === 'exams' ? (
          <Exams />
        ) : activeTab === 'study-packs' ? (
          <StudyPacks />
        ) : activeTab === 'gallery' ? (
          teacherLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : teacherId ? <GalleryManager teacherId={teacherId} /> : <TeacherProfileMissing />
        ) : activeTab === 'reviews' ? (
          teacherLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : teacherId ? <ReviewsManager teacherId={teacherId} /> : <TeacherProfileMissing />
        ) : activeTab === 'test-results' ? (
          teacherLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : teacherId ? <TestResultsManager teacherId={teacherId} /> : <TeacherProfileMissing />
        ) : activeTab === 'success' ? (
          teacherLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#eb1b23]" />
            </div>
          ) : teacherId ? <SuccessManager teacherId={teacherId} /> : <TeacherProfileMissing />
        ) : activeTab === 'dashboard' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Total Students Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Users className="w-7 h-7 text-[#eb1b23]" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span>+12%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.totalStudents}</p>
                        <p className="text-sm text-slate-500 font-medium">Total Students</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Active enrollments across all classes</p>
                      </div>
                    </div>
                  </div>

                  {/* New Students Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <UserPlus className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span>+8%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.newStudents}</p>
                        <p className="text-sm text-slate-500 font-medium">New Students</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Joined in the last 30 days</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Fee Collection Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <DollarSign className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span>+24%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">LKR {(stats.totalFeeCollection / 1000).toFixed(1)}K</p>
                        <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">All time fee collection</p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Fee Collection Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp className="w-7 h-7 text-amber-600" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3 rotate-180" />
                          <span>-5%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">LKR {(stats.monthlyFeeCollection / 1000).toFixed(1)}K</p>
                        <p className="text-sm text-slate-500 font-medium">This Month</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Current month collection</p>
                      </div>
                    </div>
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
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
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

function TeacherProfileMissing() {
  return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Teacher profile not set up</h4>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Your account role is set to Teacher, but no teacher record was found.
          Please ask an administrator to create your teacher profile in the database.
        </p>
      </div>
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
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y} `
  ).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight} `}
        className="w-full"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eb1b23" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eb1b23" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#eb1b23" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill under the line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x},${chartHeight - padding.bottom} L ${points[0].x},${chartHeight - padding.bottom} Z`}
          fill="url(#areaGradient)"
        />

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
              fill="#eb1b23"
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
