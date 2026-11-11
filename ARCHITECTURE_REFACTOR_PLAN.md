# Architecture Refactor: Phased Implementation Plan

## Overview

The goal is to evolve `acp.lk` from a **Supabase-coupled, frontend-only** app into a **fully decoupled, cloud-portable** system:

- **Frontend (React/Vite)** → talks only to backend via an API client
- **Backend (Node.js)** → 3 strict layers: API adapters → Services → Repositories
- **Providers** → Supabase/PostgreSQL today, swappable tomorrow (S3, Firebase Auth, etc.)
- **UI stays 100% unchanged**

### Current State

| Layer | Current state | Problem |
|---|---|---|
| Frontend | React/Vite + TailwindCSS | ✅ Keep as-is |
| DB abstraction | `IDatabase` interface + `SupabaseAdapter` | Lives in frontend bundle |
| Repositories | 10+ repos (`ClassRepository`, etc.) | Live in `src/repositories/` — frontend only |
| Auth | `AuthContext` calls `db.auth.*` directly | Direct Supabase SDK in frontend |
| Backend | ❌ None | No backend server at all |

### Good news
The codebase already has a **`IDatabase` abstraction** and a **`BaseRepository` pattern** in the frontend. We can port these patterns to the backend with Drizzle ORM instead.

---

## User Review Required

> **The refactor is additive** — we do NOT delete or break any existing frontend code. We add a new `backend/` folder alongside the existing `src/` and migrate feature by feature.

> **Breaking change for deployment:** After Phase 4, the frontend must point to the backend URL. Environment variables will be added to configure the API base URL. In local dev, the Express server runs alongside Vite (two terminals). A Vite proxy can be configured to simplify this.

> **Phase 5 (frontend migration)** will now happen completely fresh inside a new `frontend/` folder. The entire original application is preserved untouched in the `old/` directory for reference. We will copy over the UI components, but connect them directly to our new backend APIs instead of Supabase SDK.

---

## Phased Implementation Plan

### Phase 0 — Restructuring
1. Move existing codebase into `old/` directory.
2. Scaffold a fresh Vite React project into `frontend/`.
3. Scaffold `backend/` as originally planned.

### Phase 1 — Backend Foundation (New `backend/` folder)

> **Goal:** Set up the Node.js/Express backend project with TypeScript, Drizzle ORM, and provider abstraction shells. No business logic yet.

#### [NEW] `backend/package.json`
- Express, Drizzle ORM, `drizzle-kit`, `postgres` (pg driver), `jsonwebtoken`, `dotenv`, `zod`
- Dev: `tsx`, `typescript`, `@types/express`, `@types/node`
- Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist/)

#### [NEW] `backend/tsconfig.json`
- Strict TypeScript config targeting `ES2022`, module `NodeNext`

#### [NEW] `backend/config/env.ts`
- Typed env loader using `zod` — validates `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `PORT`, `STORAGE_BUCKET`

#### [NEW] `backend/utils/errors.ts`
- `AppError` class (status code + message)
- `handleError(err, res)` helper for Express

#### [NEW] `backend/utils/response.ts`
- `sendSuccess(res, data, status?)` and `sendError(res, err)` helpers

---

### Phase 2 — Provider Abstraction Layer

> **Goal:** Create swappable provider interfaces for Auth, DB, and Storage.

#### [NEW] `backend/providers/db/IDbProvider.ts`
- Interface: `query<T>(sql, params)`, `transaction(fn)`

#### [NEW] `backend/providers/db/drizzle.ts`
- Creates a Drizzle ORM instance from `DATABASE_URL` (Supabase Postgres connection string)
- Exports: `drizzleDb` singleton

#### [NEW] `backend/providers/auth/IAuthProvider.ts`
```ts
interface IAuthProvider {
  verifyToken(token: string): Promise<{ userId: string; email: string }>;
}
```

#### [NEW] `backend/providers/auth/SupabaseAuthProvider.ts`
- Verifies Supabase JWTs using `SUPABASE_JWT_SECRET`
- Implements `IAuthProvider`

#### [NEW] `backend/providers/storage/IStorageProvider.ts`
```ts
interface IStorageProvider {
  upload(bucket: string, path: string, file: Buffer, mimeType: string): Promise<string>;
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
  delete(bucket: string, path: string): Promise<void>;
}
```

#### [NEW] `backend/providers/storage/SupabaseStorageProvider.ts`
- Uses Supabase Storage SDK with service key (server-side only)
- Implements `IStorageProvider`

---

### Phase 3 — Repository Layer (Drizzle-based)

> **Goal:** Port domain repositories to the backend using Drizzle ORM for type-safe SQL.

#### [NEW] `backend/repositories/schema/` (Drizzle schema files)
- `profiles.ts`, `classes.ts`, `enrollments.ts`, `exams.ts`, `teachers.ts`, `gallery.ts`, `reviews.ts`, `pdfPapers.ts`, `testResults.ts`
- Each uses `pgTable()` from Drizzle — portable across any PostgreSQL provider

#### [NEW] `backend/repositories/BaseRepository.ts`
- Abstract class with `findAll`, `findById`, `create`, `update`, `delete` using Drizzle
- Accepts a Drizzle table schema as constructor arg

#### [NEW] `backend/repositories/ProfileRepository.ts`
- Ported from `src/repositories/ProfileRepository.ts`
- Uses Drizzle instead of `IDatabase`
- Methods: `findByEmail`, `findByStudentId`, `generateStudentId`, `findByRole`

#### [NEW] `backend/repositories/ClassRepository.ts`
- Ported from `src/repositories/ClassRepository.ts`
- Methods: `findByTeacherId`, `findActiveClasses`, `findBySubject`, `search`

#### [NEW] `backend/repositories/` (remaining repos)
- `EnrollmentRepository`, `ExamRepository`, `TeacherRepository`, `DashboardRepository`, `GalleryRepository`, `SuccessRepository`, `PdfPaperRepository`, `ClassReviewRepository`, `TestResultRepository`

---

### Phase 4 — Service Layer

> **Goal:** Business logic layer — 100% infrastructure-agnostic, no DB or provider code.

#### [NEW] `backend/services/userService.ts`
- `signIn(identifier, password)` — resolves student ID → email → delegates to auth provider
- `getProfile(userId)` — calls `ProfileRepository`
- `updateProfile(userId, updates)` — validates + calls `ProfileRepository`
- `requestSignUpOtp(email, data)` — generates student ID, calls auth provider
- `verifySignUpOtp(email, token, data)` — verifies OTP, creates profile record
- `requestPasswordResetOtp(identifier)` — resolves email, sends OTP
- `resetPasswordWithOtp(email, token, newPassword)` — verifies + resets

#### [NEW] `backend/services/courseService.ts`
- `listCourses(filters?)` — active classes
- `getCourse(id)` — single class
- `createCourse(teacherId, data)` — creates class
- `updateCourse(id, data)` — updates class
- `deleteCourse(id)` — soft delete (sets `is_active = false`)

#### [NEW] `backend/services/enrollmentService.ts`
- `enrollStudent(studentId, classId)` — creates enrollment, checks duplicates
- `getEnrollmentsByStudent(studentId)` — lists student's classes
- `getEnrollmentsByClass(classId)` — lists class students

#### [NEW] `backend/services/examService.ts`
- `listExams(classId)`, `submitAttempt(...)`, `getResults(studentId)`

#### [NEW] `backend/services/fileService.ts`
- `uploadFile(bucket, path, file, mimeType)` — delegates to `IStorageProvider`
- `getSignedUrl(bucket, path, expiresIn)` — delegates to `IStorageProvider`

---

### Phase 5 — API Layer (Dual Deployment)

> **Goal:** Express server for Render + Cloud Functions adapters — both call the same service layer.

#### [NEW] `backend/api/middleware/auth.ts`
- Express middleware: extracts Bearer token → calls `IAuthProvider.verifyToken` → injects `req.user`

#### [NEW] `backend/api/express/routes/auth.routes.ts`
- `POST /api/auth/signin`
- `POST /api/auth/signup/otp` (request OTP)
- `POST /api/auth/signup/verify` (verify OTP + create account)
- `POST /api/auth/reset/otp`
- `POST /api/auth/reset/verify`

#### [NEW] `backend/api/express/routes/courses.routes.ts`
- `GET /api/courses` — list active courses
- `POST /api/courses` — create (teacher/admin)
- `PATCH /api/courses/:id` — update
- `DELETE /api/courses/:id` — delete

#### [NEW] `backend/api/express/routes/users.routes.ts`
- `GET /api/users/me` — get current profile
- `PATCH /api/users/me` — update profile

#### [NEW] `backend/api/express/routes/enrollments.routes.ts`
- `GET /api/enrollments` — list for current user
- `POST /api/enrollments` — enroll

#### [NEW] `backend/api/express/server.ts`
- Creates Express app, mounts all route groups, starts listening

#### [NEW] `backend/api/functions/` (Cloud Functions adapters)
- `auth.function.ts`, `courses.function.ts`, `users.function.ts`, etc.
- Each wraps the same service call in a Cloud Functions HTTP handler (stateless, no app state)

---

### Phase 6 — Frontend API Client Migration

> **Goal:** Replace all direct `db.*` / repository calls in the frontend with `fetch`-based API calls. UI is unchanged.

> **This is the only phase that modifies existing `src/` files. All changes are backwards-compatible — the old `src/repositories/` and `src/lib/database/` code is kept as fallback and can be removed later.**

#### [NEW] `src/services/apiClient.ts`
- Base `fetch` wrapper with: auth header injection, base URL from `VITE_API_URL`, error normalization
- Methods: `get`, `post`, `patch`, `delete`

#### [NEW] `src/services/authService.ts`
- `signIn(identifier, password)` — POST `/api/auth/signin`
- `requestSignUpOtp(...)` — POST `/api/auth/signup/otp`
- `verifySignUpOtp(...)` — POST `/api/auth/signup/verify`
- `requestPasswordResetOtp(...)`, `resetPasswordWithOtp(...)`

#### [NEW] `src/services/courseService.ts`
- `listCourses()`, `getCourse(id)`, `createCourse(data)`, etc.

#### [NEW] `src/services/enrollmentService.ts`, `src/services/userService.ts`
- As needed per component

#### [MODIFY] `src/contexts/AuthContext.tsx`
- Replace `db.auth.*` calls with `authService.*` calls
- Replace `profileRepo.*` calls with `userService.*` calls
- Keep the same exported context shape — components are unchanged

#### [MODIFY] `src/contexts/RepositoryContext.tsx`
- Will become `ApiContext.tsx` (or kept as-is with API-backed implementations)
- Components that use repos are updated to call API services instead

---

## Folder Structure (End State)

```
acp.lk/
├── old/                        # The entire legacy codebase (frozen for reference)
│   ├── src/                    
│   └── package.json
│
├── frontend/                   # NEW: Fresh React/Vite frontend
│   ├── src/
│   │   ├── services/           # API client layer (replaces DB calls)
│   │   ├── components/         # Cleanly ported components
│   │   └── pages/              # Reassembled, clean pages
│   └── package.json
│
└── backend/                    # NEW: Full backend
    ├── api/
    │   ├── express/            # Render deployment (Express server)
    │   │   ├── routes/
    │   │   └── server.ts
    │   └── functions/          # Cloud Functions deployment
    ├── services/               # Business logic (shared, infra-agnostic)
    ├── repositories/           # Drizzle-based data access
    │   └── schema/             # Drizzle table schemas
    ├── providers/
    │   ├── db/                 # Drizzle + PostgreSQL adapter
    │   ├── auth/               # Supabase JWT verifier (swappable)
    │   └── storage/            # Supabase Storage (swappable → S3)
    ├── config/                 # Env config (zod-validated)
    └── utils/                  # Errors, HTTP response helpers
```
