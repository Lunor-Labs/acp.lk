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
| `backend/` — Express + Drizzle ORM | Deployed on Railway ✓ |
| `frontend/` — React/Vite, feature-based | Deployed on Vercel ✓ |
| Auth, dashboards, classes, exams | Working |
| StudyPacks (student), Gallery, Reviews, Test Results, Success, Profile | Stubs |
| Admin portal | Not started |
| CI/CD (`deploy.yml`) | Working — path-filtered Railway + Vercel deploys ✓ |
| `old/` codebase | Frozen for reference |

---

## Architecture & Deployment

### Monorepo Structure (deployed state)

```
acp.lk/
├── railway.json                ← Railway build + start config (backend)
├── nixpacks.toml               ← Pins Node 20 for Railway build
├── vercel.json                 ← Vercel build config (frontend only)
├── frontend/                   ← React/Vite app → deployed on Vercel
├── backend/                    ← Express + Drizzle ORM → deployed on Railway
└── old/                        ← Legacy frozen codebase
```

### Backend → Railway

The existing Express server (`backend/src/api/express/server.ts`) runs as-is on Railway.
No code changes to `backend/` were needed — only config files at the repo root:

- `railway.json`: build command (`cd backend && npm install && npm run build`), start command (`node backend/dist/api/express/server.js`), healthcheck at `/health`
- `nixpacks.toml`: pins `nodejs_20`
- Required env vars in Railway dashboard: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`

### Frontend → Vercel

`vercel.json` builds and serves the React app only:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

`VITE_API_BASE_URL` is set as a Vercel secret (the Railway service URL) and injected into
`frontend/.env.production` at build time. The frontend API client (`frontend/src/api/client.ts`)
reads it:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

Local dev: `/api` proxies to `http://localhost:3001` via Vite. Production: points to Railway URL.

### CI/CD Pipeline (`.github/workflows/deploy.yml`)

Path-filtered — only the changed service deploys:

- `frontend/**` changed → `deploy-frontend` job: `vercel build --prod` + `vercel deploy --prebuilt --prod`
- `backend/**` changed → `deploy-backend` job: `railway up --service acp-lk --environment production --detach`
- Secrets required: `VERCEL_TOKEN`, `RAILWAY_API_TOKEN`, `RAILWAY_PROJECT_ID`, `VITE_API_BASE_URL`

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

1. **Phase 1 — Deployment fix** ✅ COMPLETE
   - Backend deployed on Railway (Express server, nixpacks, `railway.json`)
   - Frontend deployed on Vercel (`vercel.json`, `VITE_API_BASE_URL` secret)
   - CI/CD path-filtered: Railway deploys on `backend/**` changes, Vercel on `frontend/**` changes
   - End-to-end verified: login → dashboard works

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

- [x] Frontend deployed on Vercel, backend deployed on Railway
- [x] No Firebase references remain in codebase or CI/CD
- [ ] All "Porting in progress" stubs replaced with working pages
- [ ] All portals use shadcn/ui components — no custom spinner or SVG charts
- [ ] Admin portal allows adding/deactivating teachers and viewing platform stats
- [ ] CI/CD deploys cleanly on push to `main`
