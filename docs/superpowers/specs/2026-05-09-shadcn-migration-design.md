# Phase 2: shadcn/ui Design System Migration

**Date:** 2026-05-09
**Branch:** fb-main-refactor
**Status:** Approved

---

## Overview

Adopt shadcn/ui as the design system across all portals (student, teacher, auth). This means initialising shadcn, mapping CSS variables to the existing brand palette, reconciling the three existing UI primitives, and adding new components (Avatar, Dialog, Toast, charts, etc.) to replace hand-rolled implementations.

Landing page is out of scope — it has its own custom CSS and a different design language.

---

## Current State

| Area | Current implementation |
|---|---|
| `Button`, `Card`, `Input` | CVA-based, already shadcn-like — need CSS variable update only |
| Profile menu | Red circle stub (`w-8 h-8 rounded-full bg-red-100`) |
| Loading states | Custom CSS spinner div (dual-border rotation) |
| Charts | Hand-rolled SVG with manual Bezier path math |
| Modals | Vanilla React state + `fixed inset-0` overlay |
| Notifications | None — form actions fail/succeed silently |
| Form selects | Native `<select>` elements |
| Status labels | Ad-hoc Tailwind inline classes |
| Mobile sidebar | Custom fixed overlay + translate animation |

---

## Color System

### CSS Variables (added to `index.css`)

shadcn's `--primary` maps to the brand red (`#eb1b23`), which is already the dominant interactive colour across active nav items, focus rings, auth buttons, and chart lines. Gold (`#f3b113`) remains as a custom Tailwind token for decorative use only.

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --muted: 220 14% 94%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 358 84% 51%;         /* #eb1b23 */
    --primary: 358 84% 51%;      /* #eb1b23 */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 94%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --accent: 220 14% 94%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;
    --radius: 0.75rem;
  }
}
```

### Tailwind config change

Add `shadcn` CSS variable extensions to `tailwind.config.js` via `shadcn init`. The existing custom `primary-*` gold scale and `dark-*` scale are preserved alongside the new CSS variable tokens.

---

## Existing Components — Reconcile, Don't Replace

`Button`, `Card`, and `Input` are already well-structured (CVA + `cn()`). Rather than deleting and re-scaffolding them, update colour references to use CSS variables:

- `Button` default variant: change `bg-primary-500 hover:bg-primary-600` → `bg-primary text-primary-foreground hover:bg-primary/90`
- `Button` auth variant: same as default (auth and default converge on red)
- `Input` focus ring: change `focus:ring-[#eb1b23]` → `focus:ring-ring`
- `Card`: already clean — just add `text-card-foreground bg-card` to align with CSS variables

No other structural changes to these files.

---

## New Components (via `npx shadcn add`)

### Profile Menu
**Components:** `avatar`, `dropdown-menu`

Replace the red circle stub (`ProfileMenu`) in the **top bar** of both `StudentDashboard.tsx` and `TeacherDashboard.tsx`. The sidebar footer avatar (user photo + name + sign-out) stays as-is — it already works correctly.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Avatar className="cursor-pointer w-8 h-8">
      <AvatarImage src={user?.avatar_url} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={() => navigate('/student/profile')}>
      Profile
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={signOut} className="text-destructive">
      Sign Out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

The `AvatarFallback` uses the same initials logic already in `BrowseClasses.tsx` — extract it to a shared `getInitials(name)` util in `lib/utils.ts`.

### Toast Notifications
**Component:** `sonner` (via `npx shadcn add sonner`)

Add `<Toaster />` once in `App.tsx`. Wire `toast.success()` and `toast.error()` to all user-triggered mutations:

| Action | Toast |
|---|---|
| Enroll in class | "Enrolled successfully" |
| Unenroll | "Unenrolled" |
| Create exam | "Exam created" |
| Update exam | "Exam updated" |
| Delete exam | "Exam deleted" |
| Upload study pack | "Study pack saved" |
| Save profile | "Profile updated" |
| Change password | "Password changed" |
| Sign in error | error message from API |

### Charts
**Dependency:** `recharts` (npm install)
**Wrapper:** shadcn `chart` primitives (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`)

Replace both SVG charts:

**Student — PerformanceChart:**
- `AreaChart` from recharts
- Single area: monthly score (%)
- Fill: red gradient (matches current)
- Dashed reference line at 75% (target)
- Tooltip: score + month label

**Teacher — OnboardingChart:**
- `LineChart` from recharts
- Two lines: Platform Students (indigo `#6366f1`) + Your Enrollments (red `#eb1b23`)
- Tooltip: both values on hover
- Legend below chart

Both charts: responsive via `ChartContainer` width, same data shape as current API response.

### Loading / Skeleton
**Component:** `skeleton`

Replace the custom spinner in full-page loading states with `Skeleton` card placeholders that match the actual content layout:

- Dashboard loading: 4 × stat card skeletons + chart skeleton
- List loading (classes, exams, packs): 3–4 row skeletons
- Keep `Loader2` spinner (lucide-react) inside buttons for button-level loading — that stays

### Modal
**Component:** `dialog`

Replace `ExamDetailModal` (and any future modals) with shadcn `Dialog`:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>{exam.title}</DialogTitle>
    </DialogHeader>
    {/* existing modal body */}
  </DialogContent>
</Dialog>
```

No behaviour changes — just swap the overlay/container.

### Mobile Sidebar
**Component:** `sheet`

Replace the custom `fixed inset-0` overlay + translate animation in both dashboards with shadcn `Sheet`:

```tsx
<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
  <SheetContent side="left" className="p-0 w-64 bg-[#0f1623]">
    {/* existing sidebar nav content */}
  </SheetContent>
</Sheet>
```

Sidebar background `#0f1623` stays hardcoded — it's not a shadcn token.

### Supporting Components (install now, use in Phase 3)

These are installed and available but not wired to specific pages yet — Phase 3 (stubs) will use them:

| Component | Planned use |
|---|---|
| `badge` | Enrollment status, exam state labels |
| `alert` | Error banners in forms |
| `select` | Subject/teacher/status filter dropdowns |
| `textarea` | Multi-line inputs (review text, exam description) |
| `switch` | Active/inactive toggles |
| `table` | Admin data tables (Phase 4) |
| `tabs` | Tab views in profile, admin pages |
| `separator` | Section dividers |

---

## What Is Not Changed

- Landing page and all its CSS files
- Sidebar navigation layout, dark colour scheme (`#0f1623`), Lucide icons
- Feature-based folder structure (`features/`, `pages/`, etc.)
- Brand colours gold `#f3b113` (decorative) and dark `#0f1623` (sidebar)
- Auth flow logic and API layer
- `lib/utils.ts` `cn()` function (shadcn will use it as-is)

---

## Delivery Order

1. **shadcn init** — CSS variables in `index.css`, extend `tailwind.config.js`
2. **Reconcile Button / Card / Input** — update colour references to CSS variables
3. **Avatar + DropdownMenu** — replace ProfileMenu stub in both portals
4. **Sonner** — add `<Toaster />` to App.tsx, wire toasts to all mutations
5. **Charts** — install recharts, replace SVG PerformanceChart + OnboardingChart
6. **Skeleton** — replace CSS spinner in dashboard/list loading states
7. **Dialog** — replace ExamDetailModal overlay
8. **Sheet** — replace mobile sidebar overlay in both dashboards
9. **Supporting components** — install Badge, Alert, Select, Textarea, Switch, Table, Tabs, Separator (no wiring needed — ready for Phase 3)

---

## Success Criteria

- [ ] `npx shadcn@latest init` completed, CSS variables live in `index.css`
- [ ] No hardcoded `#eb1b23` or `bg-primary-500` in Button/Input/Card — all CSS variable refs
- [ ] ProfileMenu shows Avatar with initials fallback + DropdownMenu in both portals
- [ ] Toast appears on every user-triggered mutation (success and error)
- [ ] SVG charts removed — recharts AreaChart + LineChart render correctly with real data
- [ ] Dashboard loading states show Skeleton placeholders
- [ ] ExamDetailModal uses shadcn Dialog
- [ ] Mobile sidebar uses shadcn Sheet
- [ ] All Phase 3 shadcn components installed and importable
- [ ] Landing page untouched
- [ ] No TypeScript errors, frontend builds cleanly
