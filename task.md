# Architecture Refactor Task Checklist

## Phase 0: Planning & Restructuring
- [x] Explore current codebase structure
- [x] Understand existing abstractions (IDatabase, BaseRepository, AuthContext)
- [x] Write implementation plan
- [x] Get user approval on plan
- [x] Move existing codebase into `old/` directory
- [x] Scaffold fresh Vite React project into `frontend/`

## Phase 1: Backend Foundation (New `backend/` folder)
- [x] Initialize `backend/` with package.json, tsconfig
- [x] Create `backend/providers/db/` — Drizzle ORM + Supabase/PG adapter
- [x] Create `backend/providers/auth/` — Supabase auth adapter
- [x] Create `backend/providers/storage/` — Supabase storage adapter
- [x] Create `backend/config/` — env config loader
- [x] Create `backend/utils/` — shared utilities (errors, http response)

## Phase 2: Repository Layer (`backend/repositories/`)
- [x] Port [ClassRepository](file:///home/dinesh-s/Documents/Dinesh/acp.lk/backend/src/repositories/ClassRepository.ts#6-67)
- [x] Port [EnrollmentRepository](file:///home/dinesh-s/Documents/Dinesh/acp.lk/backend/src/repositories/EnrollmentRepository.ts#7-80)
- [x] Port [ExamRepository](file:///home/dinesh-s/Documents/Dinesh/acp.lk/backend/src/repositories/ExamRepository.ts#6-113)
- [x] Port [ProfileRepository](file:///home/dinesh-s/Documents/Dinesh/acp.lk/backend/src/repositories/ProfileRepository.ts#15-115)
- [x] Port `TeacherRepository`
- [x] Port [DashboardRepository](file:///home/dinesh-s/Documents/Dinesh/acp.lk/backend/src/repositories/DashboardRepository.ts#29-193)
- [x] Port remaining repositories

## Phase 3: Service Layer (`backend/services/`)
- [x] `userService` — auth, profile CRUD
- [x] `courseService` — class CRUD
- [x] `enrollmentService` — enrollment logic
- [x] `examService` — exam/test logic
- [ ] `fileService` — file upload/signed URL

## Phase 4: Backend API Endpoints (Express)
- [x] Auth Routes (`POST /api/auth/signin`, `signup/otp`, `signup/verify`)
- [x] Users Routes (`GET /api/users/me`, `PATCH /api/users/me`)
- [x] Auth middleware (JWT verification)
- [x] Courses & Enrollments Routes (`GET /api/courses`, `POST /api/enrollments`)
- [x] Dashboard Routes (`GET /api/dashboard/student`, `GET /api/dashboard/teacher`)
- [x] Exams Routes
- [ ] Files Routes (Signed URLs)

## Phase 5: Frontend Component Integration
- [x] Create [src/api/client.ts](file:///home/dinesh-s/Documents/Dinesh/acp.lk/frontend/src/api/client.ts) — fetch/axios wrapper
- [x] Update [AuthContext](file:///home/dinesh-s/Documents/Dinesh/acp.lk/frontend/src/contexts/AuthContext.tsx#12-22) to use API client
- [x] Port internal components (Landing pages, Auth flows)
- [ ] **Student Portal Tabs:**
  - [x] Dashboard Stats overview
  - [x] My Classes / Enrollment
  - [x] Exams & Grades
  - [ ] Profile Settings
- [ ] **Teacher Portal Tabs:**
  - [x] Dashboard Stats overview
  - [x] Class Management
  - [ ] Uploading Study Packs / Marks

## Phase 6: Verification
- [x] Backend Express Server Boot
- [x] Auth flow end to end
- [ ] Data flows for all dashboard components
