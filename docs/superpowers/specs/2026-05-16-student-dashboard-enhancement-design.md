# Student Dashboard Enhancement — Design Spec
Date: 2026-05-16

## Goal
Enhance `StudentDashboard.tsx` so students can stay on top of upcoming exams, quickly navigate to their classes/materials, and clearly see their performance trend — all from a single screen.

## Approach
Frontend-only (Approach A). No backend changes. One additional API call (`/exams/upcoming`) loaded in parallel with the existing dashboard call.

## Layout

```
[ Header: greeting, date, Live Dashboard badge ]
[ 4 Stat Cards: Enrolled Classes | Study Packs | Upcoming Exams | Avg Score ]
[ Middle Row: Upcoming Exams widget | Quick Actions widget ]
[ Performance Chart (full width) ]
```

The 4 stat cards and chart position are unchanged. Only the middle row changes.

## Section 1 — Upcoming Exams Widget

**Data source:** `ExamsApi.getUpcoming()` → `/exams/upcoming` (already implemented, already used by StudentExams page)

**Fetch timing:** Called in parallel with `DashboardApi.getStudentDashboard()` inside `fetchDashboardData()`.

**Display:**
- Shows the next 2 exams sorted by `start_time` ascending
- Each row: subject icon, title (truncated), date + time, status pill
  - Active (green, animated pulse)
  - Scheduled (blue)
  - Ended (slate)
- "View all exams →" link at the bottom navigates to `/student/exams`
- Empty state: calendar icon + "No upcoming exams" message

**Error handling:** On fetch failure, `upcomingExams` stays `[]` — empty state shows, no crash.

## Section 2 — Quick Actions Widget

**Data source:** None. Static nav buttons.

**Display:** Three stacked buttons, each with icon + label:
- Browse Classes → `/student/browse`
- My Classes → `/student/classes`
- Study Packs → `/student/studypacks`

Uses `useNavigate` from react-router-dom (already imported).

## Section 3 — Performance Chart

**Replace:** Recharts `AreaChart` / `ChartContainer` removed from `StudentDashboardContent`.

**With:** Custom SVG component `PerformanceChart` ported from `old/src/components/student/StudentDashboard.tsx`:
- `smoothPath()`: cubic bezier curve through data points
- `areaPath()`: gradient fill beneath curve
- Dashed amber target line at y=75%
- Hover zones (transparent `<rect>`) per data point trigger a tooltip
- Tooltip: month label, score %, above/below target indicator
- Grid lines and y-axis labels

**Imports removed:** `Area`, `AreaChart`, `CartesianGrid`, `ReferenceLine`, `XAxis`, `YAxis`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartConfig` — all from recharts/shadcn chart. Also remove `Target` from lucide (no longer needed for the legend).

**Imports added:** `useRef` (already imported).

## State changes in `StudentDashboard`

```ts
// Add:
const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);

// fetchDashboardData: fetch in parallel
const [dashRes, examsRes] = await Promise.allSettled([
  DashboardApi.getStudentDashboard(),
  ExamsApi.getUpcoming(),
]);
```

Import `Exam` type and `ExamsApi` from `@/features/exams/api`.

## Props passed to `StudentDashboardContent`

Add `upcomingExams: Exam[]` to the props interface.

## Files changed

- `frontend/src/features/dashboard/components/StudentDashboard.tsx` — only file modified

## Out of scope
- Backend changes
- Changes to other student pages
- Skeleton loading for the new widgets (they share the existing loading gate)
