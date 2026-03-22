import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, BookOpen, FileText, Package, LogOut, GraduationCap, User, Menu, X, TrendingUp, Clock, Search, Home } from 'lucide-react';
import { db } from '../../lib/database';
import { ExamRepository } from '../../repositories';
import MyClasses from './MyClasses';
import BrowseClasses from './BrowseClasses';
import StudyPacks from './StudyPacks';
import Exams from './Exams';
import ProfileMenu from '../shared/ProfileMenu';
import ProfilePage from '../shared/ProfilePage';

interface DashboardStats {
  enrolledClasses: number;
  purchasedStudyPacks: number;
  upcomingExams: number;
}

interface PerformanceData {
  month: string;
  percentage: number;
}

interface StudentDashboardProps {
  onGoToLanding?: () => void;
}

export default function StudentDashboard({ onGoToLanding }: StudentDashboardProps) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledClasses: 0,
    purchasedStudyPacks: 0,
    upcomingExams: 0,
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  const examRepo = new ExamRepository();

  useEffect(() => {
    if (activeTab === 'dashboard' && profile?.id) {
      fetchDashboardData();
    }
  }, [activeTab, profile?.id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Get counts using db abstraction with proper typing
      const enrolledClassesPromise = db
        .from<any>('enrollments')
        .select('id')
        .eq('student_id', profile?.id)
        .eq('is_active', true)
        .execute();

      const purchasedPacksPromise = db
        .from<any>('purchases')
        .select('id')
        .eq('student_id', profile?.id)
        .execute();

      // Use repository method for upcoming exams
      const upcomingExamsPromise = examRepo.findUpcoming();

      const [enrolledRes, purchasedRes, upcomingExams] = await Promise.all([
        enrolledClassesPromise,
        purchasedPacksPromise,
        upcomingExamsPromise,
      ]);

      setStats({
        enrolledClasses: (enrolledRes.data || []).length,
        purchasedStudyPacks: (purchasedRes.data || []).length,
        upcomingExams: upcomingExams.length,
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get exam attempts using db abstraction
      const { data: examResults } = await db
        .from<any>('exam_attempts')
        .select('percentage, submitted_at')
        .eq('student_id', profile?.id)
        .not('submitted_at', 'is', null)
        .gte('submitted_at', sixMonthsAgo.toISOString())
        .order('submitted_at', { ascending: true })
        .execute();

      const monthPerformance: { [key: string]: { total: number; count: number } } = {};
      examResults?.forEach((result: any) => {
        const month = new Date(result.submitted_at!).toISOString().slice(0, 7);
        if (!monthPerformance[month]) {
          monthPerformance[month] = { total: 0, count: 0 };
        }
        monthPerformance[month].total += Number(result.percentage);
        monthPerformance[month].count += 1;
      });

      const months: PerformanceData[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const monthData = monthPerformance[monthKey];
        months.push({
          month: monthName,
          percentage: monthData ? Math.round(monthData.total / monthData.count) : 0,
        });
      }

      setPerformanceData(months);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

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
        w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
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
                <p className="text-xs text-slate-400">Student Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-white hover:bg-slate-800 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={onGoToLanding}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:text-white`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Go to Website</span>
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('classes');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'classes'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">My Classes</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('studypacks');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'studypacks'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Study Packs</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('browse');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'browse'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Browse Classes</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('exams');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'exams'
                ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Exams & Results</span>
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
                  <p className="text-xs text-slate-400">Student</p>
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
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <ProfileMenu role="student" onProfileClick={() => setActiveTab('profile')} />
        </div>
        {activeTab === 'profile' ? (
          <ProfilePage onBack={() => setActiveTab('dashboard')} />
        ) : activeTab === 'classes' ? (
          <MyClasses />
        ) : activeTab === 'browse' ? (
          <BrowseClasses />
        ) : activeTab === 'studypacks' ? (
          <StudyPacks />
        ) : activeTab === 'exams' ? (
          <Exams />
        ) : activeTab === 'dashboard' ? (
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Welcome, {profile?.full_name}!
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1b23]"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Enrolled Classes Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="w-7 h-7 text-[#eb1b23]" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.enrolledClasses}</p>
                        <p className="text-sm text-slate-500 font-medium">Enrolled Classes</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Active enrollments across subjects</p>
                      </div>
                    </div>
                  </div>

                  {/* Study Packs Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Package className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          <span>+3</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.purchasedStudyPacks}</p>
                        <p className="text-sm text-slate-500 font-medium">Study Packs</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Available learning resources</p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Exams Card */}
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <FileText className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>2 this week</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.upcomingExams}</p>
                        <p className="text-sm text-slate-500 font-medium">Upcoming Exams</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400">Scheduled assessments</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h3>
                  {performanceData.length > 0 && performanceData.some(d => d.percentage > 0) ? (
                    <PerformanceChart data={performanceData} />
                  ) : (
                    <p className="text-gray-500 text-center py-12">No exam results available yet</p>
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

function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const maxPercentage = 100;
  const chartHeight = 250;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (d.percentage / maxPercentage) * innerHeight;
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
          <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eb1b23" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="performanceAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eb1b23" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#eb1b23" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill under the line */}
        <path
          d={`${pathData} L ${points[points.length - 1].x},${chartHeight - padding.bottom} L ${points[0].x},${chartHeight - padding.bottom} Z`}
          fill="url(#performanceAreaGradient)"
        />

        {[0, 1, 2, 3, 4].map((i) => {
          const y = padding.top + (i / 4) * innerHeight;
          const value = Math.round(maxPercentage * (1 - i / 4));
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
                {value}%
              </text>
            </g>
          );
        })}

        <path
          d={pathData}
          fill="none"
          stroke="url(#performanceGradient)"
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
              {point.percentage}%
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
