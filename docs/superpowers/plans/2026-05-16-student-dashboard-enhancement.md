# Student Dashboard Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two redundant mini-stat cards with an Upcoming Exams widget and a Quick Actions widget, and replace the Recharts area chart with a custom SVG bezier curve chart with hover tooltip.

**Architecture:** Single-file change to `StudentDashboard.tsx`. Adds a parallel fetch for `/exams/upcoming` alongside the existing dashboard call, passes the result down to `StudentDashboardContent`, then replaces the middle row and chart in-place. No backend changes.

**Tech Stack:** React, TypeScript, Tailwind CSS, react-router-dom, lucide-react

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/features/dashboard/components/StudentDashboard.tsx` | All changes — imports, state, fetch, widgets, chart |

---

### Task 1: Update imports and add upcomingExams state

**Files:**
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx:1-45`

- [ ] **Step 1: Replace the import block at the top of the file**

Replace lines 1–45 with:

```tsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  LayoutDashboard, BookOpen, FileText, Package, LogOut,
  User, Menu, X, Clock, Search, Home,
  Activity, Star, Calendar, PlayCircle, ChevronRight,
  GraduationCap, Zap,
} from 'lucide-react';
import type { StudentDashboardStats, StudentPerformanceData as PerformanceData } from '../api';
import { DashboardApi } from '../api';
import { ExamsApi, type Exam } from '@/features/exams/api';
import acpLogo from '@/assets/acp-logo.webp';

import MyClasses from './student/StudentMyClasses';
import BrowseClasses from './student/BrowseClasses';
import StudentExams from './student/StudentExams';
import StudentStudyPacks from './student/StudentStudyPacks';
import StudentProfile from './student/StudentProfile';

type DashboardStats = StudentDashboardStats;
```

- [ ] **Step 2: Add upcomingExams state to StudentDashboard component**

Find the state declarations inside `export default function StudentDashboard()` (around line 144) and add `upcomingExams`:

```tsx
const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
```

So the block reads:

```tsx
const [stats, setStats] = useState<DashboardStats>({
  enrolledClasses: 0,
  purchasedStudyPacks: 0,
  upcomingExams: 0,
});
const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
const [loading, setLoading] = useState(true);
```

- [ ] **Step 3: Update fetchDashboardData to fetch exams in parallel**

Replace the existing `fetchDashboardData` function body with:

```tsx
async function fetchDashboardData() {
  try {
    setLoading(true);
    const [dashRes, examsRes] = await Promise.allSettled([
      DashboardApi.getStudentDashboard(),
      ExamsApi.getUpcoming(),
    ]);

    if (dashRes.status === 'fulfilled') {
      setStats(dashRes.value.stats);
      setPerformanceData(dashRes.value.performanceData || []);
    } else {
      setStats({ enrolledClasses: 3, purchasedStudyPacks: 1, upcomingExams: 2 });
      setPerformanceData([
        { month: 'Nov', percentage: 65 },
        { month: 'Dec', percentage: 70 },
        { month: 'Jan', percentage: 72 },
        { month: 'Feb', percentage: 0 },
        { month: 'Mar', percentage: 78 },
        { month: 'Apr', percentage: 80 },
      ]);
    }

    if (examsRes.status === 'fulfilled') {
      const sorted = [...examsRes.value].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      setUpcomingExams(sorted);
    }
  } finally {
    setLoading(false);
  }
}
```

- [ ] **Step 4: Pass upcomingExams into StudentDashboardContent**

Find the `<StudentDashboardContent ... />` JSX element (the one inside `<Route path="dashboard" ...>`) and add the prop:

```tsx
<StudentDashboardContent
  loading={loading}
  stats={stats}
  performanceData={performanceData}
  upcomingExams={upcomingExams}
  studentName={user?.full_name ?? ''}
  studentId={user?.student_id ?? ''}
/>
```

- [ ] **Step 5: Verify TypeScript — run type check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep StudentDashboard
```

Expected: no errors on this file yet (props interface not updated yet — will fix in Task 2).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/dashboard/components/StudentDashboard.tsx
git commit -m "feat: add upcomingExams state and parallel fetch to student dashboard"
```

---

### Task 2: Update StudentDashboardContent props and replace middle row widgets

**Files:**
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx` — `StudentDashboardContent` function

- [ ] **Step 1: Update the props interface**

Find the `StudentDashboardContent` props destructuring and interface:

```tsx
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
})
```

Replace with:

```tsx
function StudentDashboardContent({
  loading,
  stats,
  performanceData,
  upcomingExams,
  studentName,
  studentId,
}: {
  loading: boolean;
  stats: DashboardStats;
  performanceData: PerformanceData[];
  upcomingExams: Exam[];
  studentName: string;
  studentId: string;
})
```

- [ ] **Step 2: Remove the secondary row (MiniStatCard pair) and replace with new widgets**

Find this block inside `StudentDashboardContent` (inside the `<>` fragment after the stat cards):

```tsx
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
```

Replace with:

```tsx
{/* ── Middle row: Upcoming Exams + Quick Actions ── */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <UpcomingExamsWidget exams={upcomingExams} />
  <QuickActionsWidget />
</div>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep StudentDashboard
```

Expected: errors about `UpcomingExamsWidget` and `QuickActionsWidget` not defined — that's fine, they'll be added in Step 4.

- [ ] **Step 4: Add UpcomingExamsWidget component**

Add this new component after the `MiniStatCard` component (around the end of the file, before `PerformanceChart`):

```tsx
/* ─────────────────────────────────────────────────────────────────
   Upcoming Exams Widget
───────────────────────────────────────────────────────────────── */

function UpcomingExamsWidget({ exams }: { exams: Exam[] }) {
  const navigate = useNavigate();
  const displayed = exams.slice(0, 2);

  function getStatus(exam: Exam): 'active' | 'upcoming' | 'past' {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    if (now >= start && now <= end) return 'active';
    if (now < start) return 'upcoming';
    return 'past';
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Upcoming Exams</h3>
        </div>
        <button
          onClick={() => navigate('/student/exams')}
          className="flex items-center gap-1 text-xs text-[#eb1b23] font-semibold hover:underline"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-2">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Calendar className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-xs font-medium">No upcoming exams</p>
          </div>
        ) : displayed.map(exam => {
          const status = getStatus(exam);
          const start = new Date(exam.start_time);
          return (
            <div key={exam.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm
                ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {status === 'active'
                  ? <PlayCircle className="w-4 h-4" />
                  : <FileText className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{exam.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' · '}{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full
                ${status === 'active'
                  ? 'bg-green-100 text-green-700 animate-pulse'
                  : 'bg-blue-100 text-blue-700'}`}>
                {status === 'active' ? 'Live' : 'Soon'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add QuickActionsWidget component**

Add this right after `UpcomingExamsWidget`:

```tsx
/* ─────────────────────────────────────────────────────────────────
   Quick Actions Widget
───────────────────────────────────────────────────────────────── */

function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions = [
    { label: 'Browse Classes', icon: Search, path: '/student/browse', color: '#eb1b23', bg: '#fff1f2' },
    { label: 'My Classes', icon: GraduationCap, path: '/student/classes', color: '#6366f1', bg: '#eef2ff' },
    { label: 'Study Packs', icon: Package, path: '/student/studypacks', color: '#10b981', bg: '#ecfdf5' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
      </div>
      <div className="flex-1 p-3 flex flex-col gap-2">
        {actions.map(({ label, icon: Icon, path, color, bg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Delete the now-unused MiniStatCard component**

Find and remove the entire `MiniStatCard` function (the one that renders a mini icon + value + detail row). It is no longer referenced.

- [ ] **Step 7: Verify TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep StudentDashboard
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/features/dashboard/components/StudentDashboard.tsx
git commit -m "feat: replace mini stat cards with upcoming exams and quick actions widgets"
```

---

### Task 3: Replace Recharts chart with custom SVG bezier chart

**Files:**
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx` — `PerformanceChart` component

- [ ] **Step 1: Delete the existing PerformanceChart component and its config**

Find and remove:
1. The `perfChartConfig` constant (the `satisfies ChartConfig` block)
2. The entire `function PerformanceChart` that uses `ChartContainer` and `AreaChart`

- [ ] **Step 2: Add the new SVG-based PerformanceChart**

Add this in place of the deleted component, at the bottom of the file:

```tsx
/* ─────────────────────────────────────────────────────────────────
   Performance Chart — custom SVG with smooth bezier curve
───────────────────────────────────────────────────────────────── */

function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null);

  const W = 700, H = 240;
  const pad = { top: 24, right: 32, bottom: 44, left: 44 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const TARGET = 75;
  const gridLines = 5;

  function xOf(i: number) { return pad.left + (i / Math.max(data.length - 1, 1)) * iW; }
  function yOf(v: number) { return pad.top + iH - (v / 100) * iH; }

  function smoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return `M ${pts[0]?.x ?? 0},${pts[0]?.y ?? 0}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return d;
  }

  function areaPath(pts: { x: number; y: number }[]) {
    const baseline = pad.top + iH;
    return `${smoothPath(pts)} L ${pts[pts.length - 1].x},${baseline} L ${pts[0].x},${baseline} Z`;
  }

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.percentage) }));
  const targetY = yOf(TARGET);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 300 }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="dash-perf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eb1b23" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#eb1b23" stopOpacity="0" />
          </linearGradient>
          <filter id="dash-dot-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0003" />
          </filter>
        </defs>

        {/* Grid lines + y-axis labels */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = pad.top + (i / gridLines) * iH;
          const val = Math.round(100 * (1 - i / gridLines));
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="Inter, sans-serif">{val}%</text>
            </g>
          );
        })}

        {/* Target line */}
        <line x1={pad.left} y1={targetY} x2={W - pad.right} y2={targetY}
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={W - pad.right + 4} y={targetY + 4} fontSize="9" fill="#f59e0b"
          fontFamily="Inter, sans-serif" fontWeight="600">75%</text>

        {/* Area fill */}
        {pts.length >= 2 && <path d={areaPath(pts)} fill="url(#dash-perf-grad)" />}

        {/* Curve */}
        {pts.length >= 2 && (
          <path d={smoothPath(pts)} fill="none" stroke="#eb1b23" strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Dots + hover zones */}
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={pts[i].x - 20} y={pad.top - 10}
              width={40} height={iH + 20}
              fill="transparent"
              onMouseEnter={() => setTooltip({ x: pts[i].x, y: pts[i].y, idx: i })}
            />
            <circle cx={pts[i].x} cy={pts[i].y} r="4.5"
              fill="#eb1b23" stroke="white" strokeWidth="2.5"
              filter="url(#dash-dot-shadow)" />
            <text x={pts[i].x} y={H - pad.bottom + 18}
              textAnchor="middle" fontSize="10" fill="#64748b"
              fontFamily="Inter, sans-serif" fontWeight="500">
              {d.month}
            </text>
          </g>
        ))}

        {/* Tooltip */}
        {tooltip !== null && (() => {
          const d = data[tooltip.idx];
          const tx = Math.min(tooltip.x + 12, W - 118);
          const ty = Math.max(tooltip.y - 10, pad.top);
          const above = d.percentage >= TARGET;
          return (
            <g>
              <line x1={tooltip.x} y1={pad.top} x2={tooltip.x} y2={pad.top + iH}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <rect x={tx} y={ty} width={112} height={54} rx="8" fill="white"
                stroke="#e2e8f0" strokeWidth="1" filter="url(#dash-dot-shadow)" />
              <text x={tx + 10} y={ty + 16} fontSize="10" fontWeight="600" fill="#0f172a"
                fontFamily="Inter, sans-serif">{d.month}</text>
              <circle cx={tx + 10} cy={ty + 31} r="3.5" fill="#eb1b23" />
              <text x={tx + 20} y={ty + 35} fontSize="10" fill="#475569" fontFamily="Inter, sans-serif">
                {d.percentage > 0 ? `Score: ${d.percentage}%` : 'No data'}
              </text>
              {d.percentage > 0 && (
                <text x={tx + 10} y={ty + 48} fontSize="9"
                  fill={above ? '#10b981' : '#f59e0b'} fontFamily="Inter, sans-serif">
                  {above ? '✓ Above target' : '↑ Below target'}
                </text>
              )}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript — full file**

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/dashboard/components/StudentDashboard.tsx
git commit -m "feat: replace recharts chart with custom SVG bezier performance chart"
```

---

### Task 4: Clean up unused imports

**Files:**
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx:1-36`

- [ ] **Step 1: Verify imports are already clean**

The Task 1 import block already removed all recharts and chart imports (`Area`, `AreaChart`, `CartesianGrid`, `ReferenceLine`, `XAxis`, `YAxis`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig`), and `Target` and `TrendingUp` from lucide (no longer used).

Run:

```bash
cd frontend && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 2: Final type-check and push**

```bash
cd frontend && npx tsc --noEmit 2>&1 && echo "CLEAN"
```

Expected output: `CLEAN`

- [ ] **Step 3: Push**

```bash
git push
```

---

## Self-Review

**Spec coverage:**
- ✅ Fetch `/exams/upcoming` in parallel → Task 1 Step 3
- ✅ `upcomingExams` state → Task 1 Step 2
- ✅ Prop passed to `StudentDashboardContent` → Task 1 Step 4
- ✅ Replace mini stat cards → Task 2 Step 2
- ✅ `UpcomingExamsWidget` — shows next 2, subject icon, date/time, status pill, empty state, view-all link → Task 2 Step 4
- ✅ `QuickActionsWidget` — Browse Classes, My Classes, Study Packs → Task 2 Step 5
- ✅ `MiniStatCard` deleted → Task 2 Step 6
- ✅ Custom SVG bezier chart with bezier curve, gradient fill, target line, hover tooltip → Task 3 Step 2
- ✅ Recharts/chart imports removed → Task 1 Step 1 + Task 4

**Placeholder scan:** No TBDs, no "similar to" shortcuts, all code is complete.

**Type consistency:** `Exam` type imported from `@/features/exams/api` in Task 1 and used in `UpcomingExamsWidget` props in Task 2. `PerformanceData` used in `PerformanceChart` matches the existing type alias. `useState` used in `PerformanceChart` — already in imports after Task 1.
