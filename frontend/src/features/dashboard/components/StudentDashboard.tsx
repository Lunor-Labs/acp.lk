import { useState, useEffect, useRef } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText, Package, LogOut,
  User, Menu, X, TrendingUp, Clock, Search, Home,
  Activity, Star, Target,
} from 'lucide-react';
import type { StudentDashboardStats, StudentPerformanceData as PerformanceData } from '../api';
import { DashboardApi } from '../api';
import acpLogo from '@/assets/acp-logo.webp';

// Stub components until we port the actual UI
import MyClasses from './student/StudentMyClasses';
import BrowseClasses from './student/BrowseClasses';
const StudyPacks = () => <div className="p-8 font-bold text-xl">Study Packs (Porting in progress)</div>;
const Exams = () => <div className="p-8 font-bold text-xl">Exams (Porting in progress)</div>;
const ProfileMenu = ({ onProfileClick }: any) => <button onClick={onProfileClick} className="w-8 h-8 rounded-full bg-red-100"></button>;
const ProfilePage = () => <div className="p-8 font-bold text-xl">Profile Page (Porting in progress)</div>;

type DashboardStats = StudentDashboardStats;

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    enrolledClasses: 0,
    purchasedStudyPacks: 0,
    upcomingExams: 0,
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Call the API endpoint (stubbed on backend for now, will return 404 until we build it,
      // but the frontend architecture is now fully decoupled).
      const res = await DashboardApi.getStudentDashboard();
      
      setStats(res.stats);
      setPerformanceData(res.performanceData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Fallback dummy data so UI doesn't look empty during dev
      setStats({
        enrolledClasses: 3,
        purchasedStudyPacks: 1,
        upcomingExams: 2,
      });
      setPerformanceData([
        { month: 'Nov', percentage: 65 },
        { month: 'Dec', percentage: 70 },
        { month: 'Jan', percentage: 72 },
        { month: 'Feb', percentage: 0 },
        { month: 'Mar', percentage: 78 },
        { month: 'Apr', percentage: 80 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/student/browse', label: 'Browse Classes', icon: Search },
    { path: '/student/classes', label: 'My Classes', icon: BookOpen },
    { path: '/student/studypacks', label: 'Study Packs', icon: Package },
    { path: '/student/exams', label: 'Exams & Results', icon: FileText },
  ];

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
              Student Portal
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
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            Navigation
          </p>

          {/* Go to Website quick link */}
          <NavLink
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Website
          </NavLink>

          {navItems.map(item => {
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
              <p className="text-[11px] text-slate-500">Student</p>
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
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-800 p-1 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <ProfileMenu onProfileClick={() => navigate('/student/profile')} />
        </div>

        {/* ── Route content ── */}
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={
            <StudentDashboardContent
              loading={loading}
              stats={stats}
              performanceData={performanceData}
              studentName={user?.full_name ?? ''}
              studentId={user?.student_id ?? ''}
            />
          } />
          <Route path="browse" element={<BrowseClasses />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="studypacks" element={<StudyPacks />} />
          <Route path="exams" element={<Exams />} />
          <Route path="profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Student Dashboard Content
───────────────────────────────────────────────────────────────── */

function StudentDashboardContent({
  loading,
  stats,
  performanceData,
  studentName,
  studentId,
}: {
  loading: boolean;
  stats: DashboardStats;
  performanceData: PerformanceData[];
  studentName: string;
  studentId: string;
}) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const avgPerf = performanceData.length > 0
    ? Math.round(performanceData.filter(d => d.percentage > 0).reduce((s, d) => s + d.percentage, 0) /
      (performanceData.filter(d => d.percentage > 0).length || 1))
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 font-medium">{dateStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {greeting}, <span className="text-[#eb1b23]">{studentName.split(' ')[0]}</span> 👋
          </h1>
          {studentId && (
            <p className="text-xs text-slate-400 mt-1 font-mono">ID: {studentId}</p>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Enrolled Classes"
              value={stats.enrolledClasses}
              subtitle="Active class enrollments"
              icon={BookOpen}
              accentColor="#eb1b23"
              accentLight="#fff1f2"
              badge={{ label: 'Active', color: 'red' }}
            />
            <StatCard
              label="Study Packs"
              value={stats.purchasedStudyPacks}
              subtitle="Purchased learning resources"
              icon={Package}
              accentColor="#10b981"
              accentLight="#ecfdf5"
              badge={{ label: 'Owned', color: 'emerald' }}
            />
            <StatCard
              label="Upcoming Exams"
              value={stats.upcomingExams}
              subtitle="Scheduled assessments"
              icon={FileText}
              accentColor="#3b82f6"
              accentLight="#eff6ff"
              badge={{ label: 'Scheduled', color: 'blue' }}
            />
            <StatCard
              label="Avg. Score"
              value={avgPerf > 0 ? `${avgPerf}%` : '–'}
              subtitle="Based on past 6 months"
              icon={Star}
              accentColor="#f59e0b"
              accentLight="#fffbeb"
              badge={{ label: '6 months', color: 'amber' }}
            />
          </div>

          {/* ── Secondary row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MiniStatCard
              label="Learning Progress"
              value={`${stats.enrolledClasses} class${stats.enrolledClasses !== 1 ? 'es' : ''}`}
              detail="Keep up the great work!"
              icon={TrendingUp}
              color="#6366f1"
            />
            <MiniStatCard
              label="Next Exam"
              value={stats.upcomingExams > 0 ? `${stats.upcomingExams} upcoming` : 'None scheduled'}
              detail="Stay prepared & practice regularly"
              icon={Clock}
              color="#f59e0b"
            />
          </div>

          {/* ── Performance Chart ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Performance Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Average exam score per month over the last 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#eb1b23] inline-block"></span>
                  Avg. Score (%)
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-slate-400" />
                  Target: 75%
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {performanceData.some(d => d.percentage > 0) ? (
                <PerformanceChart data={performanceData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <FileText className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No exam results yet</p>
                  <p className="text-xs mt-1">Complete some exams to see your performance trend</p>
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
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  accentLight: string;
  badge: { label: string; color: 'red' | 'emerald' | 'blue' | 'amber' };
}

const badgeClasses: Record<string, string> = {
  red: 'bg-red-50 text-red-600 border border-red-100',
  emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border border-blue-100',
  amber: 'bg-amber-50 text-amber-700 border border-amber-100',
};

function StatCard({ label, value, subtitle, icon: Icon, accentColor, accentLight, badge }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
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
   Mini Stat Card
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
   Performance Chart — smooth Bezier curve + target line
───────────────────────────────────────────────────────────────── */

function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 700;
  const H = 260;
  const pad = { top: 24, right: 24, bottom: 44, left: 44 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const TARGET = 75;
  const maxVal = 100;
  const gridLines = 5;

  function xOf(i: number) { return pad.left + (i / (data.length - 1)) * iW; }
  function yOf(v: number) { return pad.top + iH - (v / maxVal) * iH; }

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
    const linePart = smoothPath(pts);
    const baseline = pad.top + iH;
    return `${linePart} L ${pts[pts.length - 1].x},${baseline} L ${pts[0].x},${baseline} Z`;
  }

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.percentage) }));
  const linePath = smoothPath(pts);
  const fillPath = areaPath(pts);
  const targetY = yOf(TARGET);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 320, maxWidth: '100%' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="perf-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eb1b23" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#eb1b23" stopOpacity="0" />
          </linearGradient>
          <filter id="perf-dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0004" />
          </filter>
        </defs>

        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = pad.top + (i / gridLines) * iH;
          const val = Math.round(maxVal * (1 - i / gridLines));
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="Inter, sans-serif">
                {val}%
              </text>
            </g>
          );
        })}

        {/* Target line */}
        <line
          x1={pad.left} y1={targetY}
          x2={W - pad.right} y2={targetY}
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={W - pad.right + 4} y={targetY + 4} fontSize="9" fill="#f59e0b" fontFamily="Inter, sans-serif" fontWeight="600">
          75%
        </text>

        {/* Area fill */}
        <path d={fillPath} fill="url(#perf-area-grad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#eb1b23" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points + hover zones */}
        {data.map((d, i) => {
          const px = pts[i].x;
          const py = pts[i].y;
          return (
            <g key={i}>
              <rect
                x={px - 18} y={pad.top - 10}
                width={36} height={iH + 20}
                fill="transparent"
                onMouseEnter={() => setTooltip({ x: px, y: py, idx: i })}
              />
              <circle cx={px} cy={py} r="4.5" fill="#eb1b23" stroke="white" strokeWidth="2.5" filter="url(#perf-dot-shadow)" />
              <text
                x={px} y={H - pad.bottom + 18}
                textAnchor="middle" fontSize="10" fill="#64748b"
                fontFamily="Inter, sans-serif" fontWeight="500"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip !== null && (() => {
          const d = data[tooltip.idx];
          const tx = Math.min(tooltip.x + 12, W - 110);
          const ty = Math.max(tooltip.y - 10, pad.top);
          const aboveTarget = d.percentage >= TARGET;
          return (
            <g>
              <line
                x1={tooltip.x} y1={pad.top}
                x2={tooltip.x} y2={pad.top + iH}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3"
              />
              <rect x={tx} y={ty} width={108} height={52} rx="8" ry="8" fill="white" stroke="#e2e8f0" strokeWidth="1" filter="url(#perf-dot-shadow)" />
              <text x={tx + 10} y={ty + 16} fontSize="10" fontWeight="600" fill="#0f172a" fontFamily="Inter, sans-serif">{d.month}</text>
              <circle cx={tx + 10} cy={ty + 30} r="4" fill="#eb1b23" />
              <text x={tx + 20} y={ty + 34} fontSize="10" fill="#475569" fontFamily="Inter, sans-serif">
                Score: {d.percentage > 0 ? `${d.percentage}%` : 'No data'}
              </text>
              {d.percentage > 0 && (
                <text x={tx + 10} y={ty + 46} fontSize="9" fill={aboveTarget ? '#10b981' : '#f59e0b'} fontFamily="Inter, sans-serif">
                  {aboveTarget ? '✓ Above target' : '↑ Below target'}
                </text>
              )}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
