# ACP.lk Platform Refactor & Enhancement — Design Spec

**Date:** 2026-05-09
**Branch:** fb-main-refactor
**Status:** Approved

---

## Overview

Complete the partially-done refactor of `acp.lk` from a Supabase-coupled frontend-only app into a
fully decoupled, production-grade platform. The refactor was started in a previous session — the
backend (`backend/`) and new frontend structure (`frontend/`) exist but deployment is not wired up
and several frontend features are stubs.

**Goals:**
1. Fix deployment — wire up the new backend as Vercel Serverless Functions
2. Adopt shadcn/ui as the design system across all portals
3. Complete all stub features in student and teacher portals
4. Build the admin portal from scratch
5. Update CI/CD pipeline to match the new monorepo structure

---

## Current State

| Area | Status |
|---|---|
| `backend/` — Express + Drizzle ORM | Built, not deployed |
| `frontend/` — React/Vite, feature-based | Partially migrated |
| Auth, dashboards, classes, exams | Working |
| StudyPacks (student), Gallery, Reviews, Test Results, Success, Profile | Stubs |
| Admin portal | Not started |
| CI/CD (`deploy.yml`) | Broken — points to root with no `package.json`, Firebase vars |
| `old/` codebase | Frozen for reference |

---

## Architecture & Deployment

### Monorepo Structure (end state)

```
acp.lk/
├── api/                        ← Vercel Serverless Functions (NEW)
│   ├── auth/
│   │   ├── signin.ts
│   │   ├── signup/otp.ts
│   │   ├── signup/verify.ts
│   │   ├── reset/otp.ts
│   │   └── reset/verify.ts
│   ├── courses/index.ts
│   ├── dashboard/
│   │   ├── student.ts
│   │   └── teacher.ts
│   ├── exams/index.ts
│   ├── enrollments/index.ts
│   ├── studypacks/index.ts
│   ├── users/me.ts
│   └── files/index.ts
│
├── vercel.json                 ← Monorepo build config (NEW)
├── package.json                ← Root package.json for api/ deps (NEW)
├── frontend/                   ← React/Vite app (structure unchanged)
├── backend/                    ← Services + repositories (UNTOUCHED)
└── old/                        ← Legacy frozen codebase
```

### Vercel Function Pattern

Each function file is a thin wrapper around the existing service layer:

```ts
// api/auth/signin.ts (public route — no auth required)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { userService } from '../../backend/src/services/userService.js';
import { handleError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const result = await userService.signIn(req.body.identifier, req.body.password);
    res.json(result);
  } catch (err) {
    handleError(err, res);
  }
}
```

Protected routes call `verifyToken()` from `SupabaseAuthProvider` to extract `userId` from the
Bearer token before calling the service. A shared `withAuth` helper wraps this so each protected
function stays a thin one-liner rather than repeating token extraction logic.

The `backend/src/services/` and `backend/src/repositories/` layers are **never modified**.
Only the `api/` handler wrappers are new.

### vercel.json

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/**/*.ts": { "runtime": "@vercel/node@3" }
  }
}
```

### Frontend API calls

`VITE_API_URL=/api` — frontend calls relative paths (`/api/auth/signin`).
Same Vercel domain → zero CORS configuration needed.

### CI/CD Pipeline (deploy.yml) changes

- Remove all Firebase env vars
- Add: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL`
- Build step: `cd frontend && npm install && npm run build`
- Root `npm install` for Vercel Function dependencies

### Migration path to Render (if needed later)

The `backend/src/api/express/server.ts` already exists with all routes. To move to Render:
point the Express routes at the same services layer — no service or repository code changes.

---

## Design System: shadcn/ui

### Setup

Run `npx shadcn@latest init` inside `frontend/`. Adopts existing Tailwind config and brand colors.
Brand: primary red `#eb1b23`, dark sidebar `#0f1623`.

### Components to install

| Category | Components |
|---|---|
| Layout | `Card`, `Separator`, `Sheet` (mobile sidebar drawer) |
| Forms | `Button`, `Input`, `Label`, `Select`, `Textarea`, `Switch` |
| Feedback | `Toast`, `Skeleton`, `Badge`, `Alert` |
| Overlay | `Dialog`, `Dropdown Menu`, `Avatar` |
| Data | `Table`, `Tabs` |
| Charts | Recharts via shadcn charts (`AreaChart`, `LineChart`, `BarChart`) |

### Migrations in existing portals

| Current | Replaced with |
|---|---|
| Hand-drawn SVG charts | Recharts via shadcn charts |
| Spinning circle loaders | `Skeleton` card placeholders |
| Custom stat cards | shadcn `Card` with consistent padding |
| Plain `<button>` elements | shadcn `Button` with variants |
| Red circle `ProfileMenu` stub | `Avatar` + `DropdownMenu` |
| Silent form submits | `Toast` notifications for all actions |
| Empty lists with no message | Proper empty states with CTA |

### What stays unchanged

- Sidebar navigation layout and dark color scheme
- Brand colors and Lucide icons
- Feature-based folder structure (`features/`, `pages/`, etc.)

---

## Portal Completion: Student

Existing and working: dashboard overview, browse classes, my classes, exams & results.

### Stubs to complete

**Study Packs page** (`/student/studypacks`)
- List of purchased study packs with cover image, title, subject
- Open/download PDF viewer (signed URL from storage)
- Empty state if no packs purchased, with link to browse

**Profile page** (`/student/profile`)
- View and edit: full name, email, center, profile photo
- Student ID displayed (read-only)
- Change password flow

**Profile Menu** (top-right all pages)
- `Avatar` with initials fallback
- `DropdownMenu`: Profile, Sign Out

---

## Portal Completion: Teacher

Existing and working: dashboard overview, my classes, exams, study packs.

### Stubs to complete

**Gallery Manager** (`/teacher/gallery`)
- Upload images (drag-and-drop + file picker)
- Grid view of uploaded images with delete
- Images feed the public landing page gallery section

**Reviews Manager** (`/teacher/reviews`)
- Add student testimonial: name, photo, text, rating
- Edit and delete existing reviews
- Reviews feed the public landing page reviews section

**Test Results Manager** (`/teacher/test-results`)
- Add test result entry: year, exam name, rank list image/PDF
- Delete entries
- Feeds the public landing page test results section

**Success Manager** (`/teacher/success`)
- Add success story: student name, photo, achievement, year
- Edit and delete
- Feeds the public landing page success stories section

**Profile page** (`/teacher/profile`)
- View and edit: name, email, bio, profile photo
- Change password flow

**Profile Menu** (top-right all pages)
- Same `Avatar` + `DropdownMenu` pattern as student portal

---

## Admin Portal

**Access:** users with `role = admin` only. Route: `/admin/*`.

### Pages

**Dashboard** (`/admin/dashboard`)
- Stat cards: total students, total teachers, total active classes, total revenue
- Trend charts: student onboarding over time, revenue over time
- Recent activity feed

**Teachers** (`/admin/teachers`)
- Table: name, email, active classes, enrolled students, joined date, status
- Actions: add teacher (creates user + teacher record), deactivate, view classes
- Add teacher dialog: name, email, center assignment

**Students** (`/admin/students`)
- Searchable table: student ID, name, email, center, enrollment count, joined date
- View student profile modal
- Disable/enable account

**Classes** (`/admin/classes`)
- Table of all classes across all teachers
- Filter by teacher, subject, status (active/inactive)
- View enrollments per class

**Payments** (`/admin/payments`)
- Payment records table: student, class, amount, date, status
- Filter by date range, teacher, status

### Data model addition

Add `center_id` nullable column to `teachers` and `classes` tables via Drizzle migration.
Null for all existing records — enables multi-tenancy later without schema changes.

---

## Phased Delivery Order (Approach B)

1. **Phase 1 — Deployment fix** (unblocks everything)
   - Create root `vercel.json` + root `package.json`
   - Create `api/` Vercel Function wrappers for all existing backend routes
   - Update `deploy.yml` with correct env vars and build commands
   - Verify end-to-end: login → dashboard works on preview URL

2. **Phase 2 — shadcn/ui design system**
   - Init shadcn/ui in `frontend/`
   - Install all required components
   - Migrate existing portals: replace loaders, charts, buttons, profile menu

3. **Phase 3 — Complete student + teacher stubs**
   - Study packs, profile pages, profile menu (student + teacher)
   - Gallery, reviews, test results, success stories managers (teacher)

4. **Phase 4 — Admin portal**
   - Auth guard for admin role
   - Dashboard, teachers, students, classes, payments pages
   - Add `center_id` to schema via migration

---

## Success Criteria

- [ ] Frontend deployed on Vercel, backend API served as Vercel Functions on same domain
- [ ] No Firebase references remain in codebase or CI/CD
- [ ] All "Porting in progress" stubs replaced with working pages
- [ ] All portals use shadcn/ui components — no custom spinner or SVG charts
- [ ] Admin portal allows adding/deactivating teachers and viewing platform stats
- [ ] CI/CD deploys cleanly on push to `main`
