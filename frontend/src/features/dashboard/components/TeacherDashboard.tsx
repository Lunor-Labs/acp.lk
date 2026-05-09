import { useState, useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Users, FileText, Package, LogOut,
  GraduationCap, TrendingUp, DollarSign, UserPlus, User,
  Menu, X, Image, MessageSquare, Trophy, AlertTriangle,
  Home, BookOpen, Activity,
} from 'lucide-react';
import type { TeacherDashboardStats as DashboardStats, TeacherOnboardingData as StudentOnboardingDataPoint } from '../api';
import { DashboardApi as api } from '../api';
import acpLogo from '@/assets/acp-logo.webp';

import MyClasses from './teacher/MyClasses';
import TeacherStudyPacks from './teacher/TeacherStudyPacks';
import TeacherExams from './teacher/TeacherExams';

const GalleryManager = () => <div className="p-8 font-bold text-xl">Gallery Manager (Porting in progress)</div>;
const ReviewsManager = () => <div className="p-8 font-bold text-xl">Reviews Manager (Porting in progress)</div>;
const TestResultsManager = () => <div className="p-8 font-bold text-xl">Test Results (Porting in progress)</div>;
const SuccessManager = () => <div className="p-8 font-bold text-xl">Success Stories (Porting in progress)</div>;
const ProfilePage = () => <div className="p-8 font-bold text-xl">Profile Page (Porting in progress)</div>;

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlatformStudents: 0,
    totalEnrolledStudents: 0,
    newStudentsThisMonth: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalClasses: 0,
    activeClasses: 0,
  });
  const [onboardingData, setOnboardingData] = useState<StudentOnboardingDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherId = user?.id;
  const teacherLoading = loading;

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const res = await api.getTeacherDashboard();
      setStats(res.stats);
      setOnboardingData(res.onboardingData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Mock fallback
      setStats({
        totalPlatformStudents: 100,
        totalEnrolledStudents: 25,
        newStudentsThisMonth: 5,
        totalRevenue: 50000,
        monthlyRevenue: 10000,
        totalClasses: 3,
        activeClasses: 2,
      });
      setOnboardingData([
        { month: 'Nov', platformStudents: 80, enrollments: 10 },
        { month: 'Dec', platformStudents: 85, enrollments: 15 },
        { month: 'Jan', platformStudents: 90, enrollments: 20 },
        { month: 'Feb', platformStudents: 95, enrollments: 22 },
        { month: 'Mar', platformStudents: 98, enrollments: 24 },
        { month: 'Apr', platformStudents: 100, enrollments: 25 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { path: '/teacher/classes', label: 'My Classes', icon: GraduationCap, section: 'main' },
    { path: '/teacher/exams', label: 'Exams', icon: FileText, section: 'main' },
    { path: '/teacher/study-packs', label: 'Study Packs', icon: Package, section: 'main' },
    { path: '/teacher/gallery', label: 'Gallery', icon: Image, section: 'website' },
    { path: '/teacher/reviews', label: 'Reviews', icon: MessageSquare, section: 'website' },
    { path: '/teacher/test-results', label: 'Test Results', icon: Trophy, section: 'website' },
    { path: '/teacher/success', label: 'Success Stories', icon: BookOpen, section: 'website' },
  ];

  const mainNav = navItems.filter(n => n.section === 'main');
  const websiteNav = navItems.filter(n => n.section === 'website');

  return (
    <div className="min-h-screen bg-[#f0f2f7] flex">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 flex flex-col h-screen
        bg-[#0f1623] text-white
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col items-center w-full gap-1">
            <img src={acpLogo} alt="ACP Logo" className="h-9 w-auto object-contain" />
            <span className="text-[10px] font-semibold text-slate-500 tracking-[0.2em] uppercase">
              Teacher Portal
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Main section */}
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            Main
          </p>
          {mainNav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-900/40'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            );
          })}

          {/* Website section */}
          <div className="pt-4">
            <p className="px-3 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Public Website
            </p>
            <NavLink
              to="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              Go to Website
            </NavLink>
            {websiteNav.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#eb1b23] text-white shadow-lg shadow-red-900/40'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden ring-2 ring-white/10">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-slate-300" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500">Teacher</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <main className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-800 p-1 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="w-8 h-8 cursor-pointer">
                    <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name ?? ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(user?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => navigate('/teacher/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* ── Route content ── */}
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <DashboardContent
              loading={loading}
              stats={stats}
              onboardingData={onboardingData}
              teacherName={user?.full_name ?? ''}
            />
          } />
          <Route path="classes" element={<MyClasses />} />
          <Route path="exams" element={<TeacherExams />} />
          <Route path="study-packs" element={<TeacherStudyPacks />} />
          <Route path="gallery" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <GalleryManager /> : <TeacherProfileMissing />} />
          <Route path="reviews" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <ReviewsManager /> : <TeacherProfileMissing />} />
          <Route path="test-results" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <TestResultsManager /> : <TeacherProfileMissing />} />
          <Route path="success" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <SuccessManager /> : <TeacherProfileMissing />} />
          <Route path="profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Dashboard Content
───────────────────────────────────────────────────────────────── */

function DashboardContent({
  loading,
  stats,
  onboardingData,
  teacherName,
}: {
  loading: boolean;
  stats: DashboardStats;
  onboardingData: StudentOnboardingDataPoint[];
  teacherName: string;
}) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-3 h-full min-h-0 overflow-y-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 font-medium">{dateStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {greeting}, <span className="text-[#eb1b23]">{teacherName.split(' ')[0]}</span> 👋
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
          <Activity className="w-3.5 h-3.5" />
          Live Dashboard
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-72">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#eb1b23] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Loading your dashboard…</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-shrink-0">
            <StatCard
              label="Platform Students"
              value={stats.totalPlatformStudents}
              subtitle="Total students on ACP"
              icon={Users}
              accentColor="#6366f1"
              accentLight="#eef2ff"
              badge={{ label: 'All time', color: 'indigo' }}
            />
            <StatCard
              label="Enrolled Students"
              value={stats.totalEnrolledStudents}
              subtitle="Active in your classes"
              icon={GraduationCap}
              accentColor="#eb1b23"
              accentLight="#fff1f2"
              badge={{ label: 'Active', color: 'red' }}
            />
            <StatCard
              label="New This Month"
              value={stats.newStudentsThisMonth}
              subtitle="Joined your classes"
              icon={UserPlus}
              accentColor="#10b981"
              accentLight="#ecfdf5"
              badge={{ label: 'This month', color: 'emerald' }}
            />
            <StatCard
              label="Monthly Revenue"
              value={`LKR ${(stats.monthlyRevenue / 1000).toFixed(1)}K`}
              valueRaw={stats.monthlyRevenue}
              subtitle={`Total: LKR ${(stats.totalRevenue / 1000).toFixed(1)}K`}
              icon={DollarSign}
              accentColor="#f59e0b"
              accentLight="#fffbeb"
              badge={{ label: 'This month', color: 'amber' }}
            />
          </div>

          {/* ── Secondary stats row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">
            <MiniStatCard
              label="Total Classes"
              value={stats.totalClasses}
              detail={`${stats.activeClasses} active`}
              icon={BookOpen}
              color="#6366f1"
            />
            <MiniStatCard
              label="Total Revenue"
              value={`LKR ${(stats.totalRevenue / 1000).toFixed(1)}K`}
              detail="All time earnings"
              icon={TrendingUp}
              color="#10b981"
            />
          </div>

          {/* ── Chart ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Student Onboarding Trend</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monthly new platform students vs. enrollments in your classes</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                  Platform Students
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#eb1b23] inline-block"></span>
                  Your Enrollments
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-4 sm:p-5">
              {onboardingData.length > 0 ? (
                <OnboardingChart data={onboardingData} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No enrollment data available yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: string | number;
  valueRaw?: number;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  accentLight: string;
  badge: { label: string; color: 'indigo' | 'red' | 'emerald' | 'amber' };
}

const badgeClasses: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  red: 'bg-red-50 text-red-600 border border-red-100',
  emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border border-amber-100',
};

function StatCard({ label, value, subtitle, icon: Icon, accentColor, accentLight, badge }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Color accent strip */}
      <div className="h-1" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{ background: accentLight }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeClasses[badge.color]}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Mini Stat Card (secondary row)
───────────────────────────────────────────────────────────────── */

function MiniStatCard({
  label, value, detail, icon: Icon, color,
}: { label: string; value: string | number; detail: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Onboarding Dual-Line Chart — recharts LineChart
───────────────────────────────────────────────────────────────── */

const onboardingChartConfig = {
  platformStudents: {
    label: 'Platform Students',
    color: '#6366f1',
  },
  enrollments: {
    label: 'Your Enrollments',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function OnboardingChart({ data }: { data: StudentOnboardingDataPoint[] }) {
  return (
    <ChartContainer config={onboardingChartConfig} className="h-56 w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) =>
            value === 'platformStudents' ? 'Platform Students' : 'Your Enrollments'
          }
        />
        <Line
          type="monotone"
          dataKey="platformStudents"
          stroke="var(--color-platformStudents)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="enrollments"
          stroke="var(--color-enrollments)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#eb1b23] border-t-transparent animate-spin"></div>
      </div>
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
