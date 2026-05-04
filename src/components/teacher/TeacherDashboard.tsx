import { useState, useEffect, useRef } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, FileText, Package, LogOut,
  GraduationCap, TrendingUp, DollarSign, UserPlus, User,
  Menu, X, Image, MessageSquare, Trophy, AlertTriangle,
  Home, BookOpen, Activity,
} from 'lucide-react';
import MyClasses from './MyClasses';
import Exams from './Exams';
import StudyPacks from './StudyPacks';
import GalleryManager from './GalleryManager';
import ReviewsManager from './ReviewsManager';
import TestResultsManager from './TestResultsManager';
import SuccessManager from './SuccessManager';
import StudentRankings from './StudentRankings';
import { TeacherRepository } from '../../repositories/TeacherRepository';
import { dashboardRepository, DashboardStats, StudentOnboardingDataPoint } from '../../repositories/DashboardRepository';
import ProfileMenu from '../shared/ProfileMenu';
import ProfilePage from '../shared/ProfilePage';
import acpLogo from '../../assets/acp-logo.webp';

const teacherRepository = new TeacherRepository();

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
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

  useEffect(() => {
    if (profile?.id) {
      setTeacherLoading(true);
      teacherRepository.findByProfileId(profile.id)
        .then(teacher => { if (teacher) setTeacherId(teacher.id); })
        .catch(err => console.error('Error fetching teacher record:', err))
        .finally(() => setTeacherLoading(false));
    }
  }, [profile?.id]);

  useEffect(() => {
    if (teacherId) {
      fetchDashboardData(teacherId);
    }
  }, [teacherId]);

  async function fetchDashboardData(tid: string) {
    try {
      setLoading(true);
      const [statsData, trendData] = await Promise.all([
        dashboardRepository.getStats(tid),
        dashboardRepository.getOnboardingTrend(tid, 8),
      ]);
      setStats(statsData);
      setOnboardingData(trendData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { path: '/teacher/classes', label: 'My Classes', icon: GraduationCap, section: 'main' },
    { path: '/teacher/exams', label: 'Exams', icon: FileText, section: 'main' },
    { path: '/teacher/study-packs', label: 'Study Packs', icon: Package, section: 'main' },
    { path: '/teacher/rankings', label: 'Student Rankings', icon: Trophy, section: 'main' },
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
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-slate-300" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
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
          <ProfileMenu role="teacher" onProfileClick={() => navigate('/teacher/profile')} />
        </div>

        {/* ── Route content ── */}
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <DashboardContent
              loading={loading}
              stats={stats}
              onboardingData={onboardingData}
              teacherName={profile?.full_name ?? ''}
            />
          } />
          <Route path="classes" element={<MyClasses />} />
          <Route path="exams" element={<Exams />} />
          <Route path="study-packs" element={<StudyPacks />} />
          <Route path="rankings" element={<StudentRankings />} />
          <Route path="gallery" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <GalleryManager teacherId={teacherId} /> : <TeacherProfileMissing />} />
          <Route path="reviews" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <ReviewsManager teacherId={teacherId} /> : <TeacherProfileMissing />} />
          <Route path="test-results" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <TestResultsManager teacherId={teacherId} /> : <TeacherProfileMissing />} />
          <Route path="success" element={teacherLoading ? <LoadingSpinner /> : teacherId ? <SuccessManager teacherId={teacherId} /> : <TeacherProfileMissing />} />
          <Route path="profile" element={<ProfilePage onBack={() => navigate('/teacher/dashboard')} />} />
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
   Onboarding Dual-Line Chart (pure SVG with smooth Bezier curves)
───────────────────────────────────────────────────────────────── */

function OnboardingChart({ data }: { data: StudentOnboardingDataPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 700;
  const H = 260;
  const pad = { top: 24, right: 24, bottom: 44, left: 44 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.platformStudents, d.enrollments)), 1);
  const gridLines = 5;

  function xOf(i: number) { return pad.left + (i / (data.length - 1)) * iW; }
  function yOf(v: number) { return pad.top + iH - (v / maxVal) * iH; }

  /** Build smooth Bezier path through points */
  function smoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }

  function areaPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return '';
    const linePath = smoothPath(pts);
    const baseline = pad.top + iH;
    return `${linePath} L ${pts[pts.length - 1].x},${baseline} L ${pts[0].x},${baseline} Z`;
  }

  const platformPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.platformStudents) }));
  const enrollPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.enrollments) }));

  const platformLinePath = smoothPath(platformPts);
  const enrollLinePath = smoothPath(enrollPts);
  const platformAreaPath = areaPath(platformPts);
  const enrollAreaPath = areaPath(enrollPts);

  return (
    <div className="relative w-full h-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ minWidth: 320, minHeight: 140 }}
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="grad-platform" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-enroll" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eb1b23" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#eb1b23" stopOpacity="0" />
          </linearGradient>

          {/* Drop shadow filter for dots */}
          <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0005" />
          </filter>
        </defs>

        {/* Grid lines & Y labels */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = pad.top + (i / gridLines) * iH;
          const val = Math.round(maxVal * (1 - i / gridLines));
          return (
            <g key={i}>
              <line
                x1={pad.left} y1={y}
                x2={W - pad.right} y2={y}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <text
                x={pad.left - 8} y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="Inter, sans-serif"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={platformAreaPath} fill="url(#grad-platform)" />
        <path d={enrollAreaPath} fill="url(#grad-enroll)" />

        {/* Lines */}
        <path d={platformLinePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        <path d={enrollLinePath} fill="none" stroke="#eb1b23" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points + hover zones */}
        {data.map((d, i) => {
          const px = platformPts[i].x;
          const py = platformPts[i].y;
          const ex = enrollPts[i].x;
          const ey = enrollPts[i].y;
          return (
            <g key={i}>
              {/* Invisible wide hover target */}
              <rect
                x={px - 18} y={pad.top - 10}
                width={36} height={iH + 20}
                fill="transparent"
                onMouseEnter={() => setTooltip({ x: px, y: Math.min(py, ey), idx: i })}
              />

              {/* Platform dot */}
              <circle cx={px} cy={py} r="4.5" fill="#6366f1" stroke="white" strokeWidth="2" filter="url(#dot-shadow)" />
              {/* Enrollment dot */}
              <circle cx={ex} cy={ey} r="4.5" fill="#eb1b23" stroke="white" strokeWidth="2" filter="url(#dot-shadow)" />

              {/* X-axis label */}
              <text
                x={px} y={H - pad.bottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip !== null && (() => {
          const d = data[tooltip.idx];
          const tx = Math.min(tooltip.x + 12, W - 130);
          const ty = Math.max(tooltip.y - 10, pad.top);
          return (
            <g>
              {/* Vertical guide */}
              <line
                x1={tooltip.x} y1={pad.top}
                x2={tooltip.x} y2={pad.top + iH}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3"
              />
              {/* Tooltip box */}
              <rect x={tx} y={ty} width={120} height={62} rx="8" ry="8" fill="white" stroke="#e2e8f0" strokeWidth="1" filter="url(#dot-shadow)" />
              <text x={tx + 10} y={ty + 16} fontSize="10" fontWeight="600" fill="#0f172a" fontFamily="Inter, sans-serif">{d.month}</text>
              <circle cx={tx + 10} cy={ty + 30} r="4" fill="#6366f1" />
              <text x={tx + 20} y={ty + 34} fontSize="10" fill="#475569" fontFamily="Inter, sans-serif">Platform: {d.platformStudents}</text>
              <circle cx={tx + 10} cy={ty + 46} r="4" fill="#eb1b23" />
              <text x={tx + 20} y={ty + 50} fontSize="10" fill="#475569" fontFamily="Inter, sans-serif">Enrolled: {d.enrollments}</text>
            </g>
          );
        })()}
      </svg>
    </div>
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
