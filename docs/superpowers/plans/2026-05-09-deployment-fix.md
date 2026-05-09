# Deployment Fix — Vercel Serverless Functions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing backend (services + repositories) as Vercel Serverless Functions so both frontend and API live on the same Vercel domain — no separate backend hosting, no CORS config.

**Architecture:** Create an `api/` folder at the repo root containing thin Vercel Function wrappers that import from `backend/src/services/`. The services and repositories layers are never modified. The frontend API client calls `/api/...` (relative path) so it always hits the same domain.

**Tech Stack:** `@vercel/node@3` (esbuild bundler), TypeScript, existing backend services (Drizzle ORM + Supabase). Frontend: Vite + React already on Vercel.

---

## File Map

### New files

| File | Responsibility |
|---|---|
| `package.json` (root) | Root deps for Vercel Functions (`@vercel/node`, shared backend deps) |
| `tsconfig.json` (root) | TypeScript config for `api/` folder |
| `vercel.json` | Monorepo build config — builds frontend + exposes `api/` functions |
| `api/_lib/auth.ts` | `getAuthUser(req)` — extracts + verifies Bearer token, returns user |
| `api/_lib/response.ts` | `sendSuccess()` + `handleError()` typed for `VercelResponse` |
| `api/auth/signin.ts` | `POST /api/auth/signin` |
| `api/auth/me.ts` | `GET /api/auth/me` |
| `api/auth/signup/otp.ts` | `POST /api/auth/signup/otp` |
| `api/auth/signup/verify.ts` | `POST /api/auth/signup/verify` |
| `api/auth/reset/otp.ts` | `POST /api/auth/reset/otp` |
| `api/auth/reset/verify.ts` | `POST /api/auth/reset/verify` |
| `api/courses/index.ts` | `GET/POST /api/courses` |
| `api/courses/teacher/me.ts` | `GET /api/courses/teacher/me` |
| `api/courses/[id].ts` | `GET/PUT /api/courses/:id` |
| `api/dashboard/student.ts` | `GET /api/dashboard/student` |
| `api/dashboard/teacher.ts` | `GET /api/dashboard/teacher` |
| `api/enrollments/me.ts` | `GET /api/enrollments/me` |
| `api/enrollments/index.ts` | `POST /api/enrollments` |
| `api/enrollments/[classId].ts` | `DELETE /api/enrollments/:classId` |
| `api/exams/upcoming.ts` | `GET /api/exams/upcoming` |
| `api/exams/results.ts` | `GET /api/exams/results` |
| `api/exams/teacher/index.ts` | `GET/POST /api/exams/teacher` |
| `api/exams/teacher/[id]/index.ts` | `PATCH/DELETE /api/exams/teacher/:id` |
| `api/exams/teacher/[id]/detail.ts` | `GET /api/exams/teacher/:id/detail` |
| `api/exams/teacher/[id]/answers.ts` | `PATCH /api/exams/teacher/:id/answers` |
| `api/exams/teacher/[id]/questions/[questionId].ts` | `PATCH /api/exams/teacher/:id/questions/:questionId` |
| `api/exams/[id]/review.ts` | `GET /api/exams/:id/review` |
| `api/exams/[id]/start.ts` | `POST /api/exams/:id/start` |
| `api/exams/[id]/submit.ts` | `POST /api/exams/:id/submit` |
| `api/studypacks/index.ts` | `POST /api/studypacks` |
| `api/studypacks/teacher.ts` | `GET /api/studypacks/teacher` |
| `api/studypacks/[id].ts` | `PATCH/DELETE /api/studypacks/:id` |
| `api/users/me.ts` | `GET/PATCH /api/users/me` |
| `api/files/signed-upload-url.ts` | `POST /api/files/signed-upload-url` |
| `api/files/public-url.ts` | `GET /api/files/public-url` |

### Modified files

| File | Change |
|---|---|
| `frontend/src/api/client.ts` | Change fallback URL to `/api` (relative) |
| `.github/workflows/deploy.yml` | Fix build commands + swap Firebase env vars for backend vars |

---

## Task 1: Root Configuration

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.json` (root)
- Create: `vercel.json`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "acp-lk",
  "private": true,
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "drizzle-orm": "^0.30.10",
    "postgres": "^3.4.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "@types/node": "^20.14.0",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: Create root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": "."
  },
  "include": ["api/**/*"]
}
```

- [ ] **Step 3: Create `vercel.json`**

```json
{
  "buildCommand": "npm install && cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Note: The `rewrites` rule catches all non-API routes and sends them to the SPA's `index.html`. Vercel automatically serves `api/` folder as serverless functions — no explicit `functions` config needed for `@vercel/node`.

- [ ] **Step 4: Install root deps**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
npm install
```

Expected: `node_modules/` created at repo root with `@vercel/node`, `drizzle-orm`, etc.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vercel.json package-lock.json
git commit -m "chore: add root package.json and vercel.json for monorepo build"
```

---

## Task 2: Shared API Helpers

**Files:**
- Create: `api/_lib/auth.ts`
- Create: `api/_lib/response.ts`

- [ ] **Step 1: Create `api/_lib/auth.ts`**

```ts
import type { VercelRequest } from '@vercel/node';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { ProfileRepository } from '../../backend/src/repositories/ProfileRepository.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { AppError } from '../../backend/src/utils/errors.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ApiUser {
  id: string;
  email: string;
  role: string;
  student_id: string;
}

export async function getAuthUser(req: VercelRequest): Promise<ApiUser> {
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;

  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid authorization header');
  }

  const token = header.split(' ')[1];
  const authUser = await authProvider.verifyToken(token);

  const profile = await new ProfileRepository(getDb()).findById(authUser.id);
  if (!profile) throw AppError.unauthorized('User profile not found');
  if (!profile.is_active) throw AppError.forbidden('User account is deactivated');

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    student_id: profile.student_id || '',
  };
}
```

- [ ] **Step 2: Create `api/_lib/response.ts`**

```ts
import type { VercelResponse } from '@vercel/node';
import { AppError } from '../../backend/src/utils/errors.js';

export function sendSuccess<T>(res: VercelResponse, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function handleError(error: unknown, res: VercelResponse): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
    return;
  }
  console.error('[API Error]', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add api/
git commit -m "feat: add Vercel Function shared helpers (auth, response)"
```

---

## Task 3: Auth Functions

**Files:**
- Create: `api/auth/signin.ts`
- Create: `api/auth/me.ts`
- Create: `api/auth/signup/otp.ts`
- Create: `api/auth/signup/verify.ts`
- Create: `api/auth/reset/otp.ts`
- Create: `api/auth/reset/verify.ts`

- [ ] **Step 1: Create `api/auth/signin.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'identifier and password are required' });
    }
    const result = await userService.signIn(identifier, password);
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Create `api/auth/me.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const profile = await userService.getProfile(user.id);
    sendSuccess(res, { profile });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 3: Create `api/auth/signup/otp.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { email, data } = req.body;
    if (!email || !data?.fullName || !data?.center || !data?.alYear) {
      return res.status(400).json({ message: 'email, fullName, center, and alYear are required' });
    }
    const { studentId } = await userService.requestSignUpOtp(email, data);
    sendSuccess(res, { studentId });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 4: Create `api/auth/signup/verify.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { email, token, data } = req.body;
    if (!email || !token || !data?.fullName) {
      return res.status(400).json({ message: 'email, token, and data.fullName are required' });
    }
    const result = await userService.verifySignUpOtp(email, token, data);
    sendSuccess(res, { user: { id: result.user.id }, studentId: result.profile.student_id });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 5: Create `api/auth/reset/otp.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: 'identifier is required' });
    const { email } = await userService.requestPasswordResetOtp(identifier);
    sendSuccess(res, { email });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 6: Create `api/auth/reset/verify.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'email, token, and newPassword are required' });
    }
    await userService.resetPasswordWithOtp(email, token, newPassword);
    sendSuccess(res, { success: true });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add api/auth/
git commit -m "feat: add auth Vercel Functions (signin, me, signup, reset)"
```

---

## Task 4: Courses + Dashboard Functions

**Files:**
- Create: `api/courses/index.ts`
- Create: `api/courses/teacher/me.ts`
- Create: `api/courses/[id].ts`
- Create: `api/dashboard/student.ts`
- Create: `api/dashboard/teacher.ts`

- [ ] **Step 1: Create `api/courses/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../backend/src/services/courseService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const courses = await courseService.listActiveCourses();
      return sendSuccess(res, courses);
    }

    if (req.method === 'POST') {
      const user = await getAuthUser(req);
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw AppError.forbidden('Only teachers can create classes');
      }
      const data = { ...req.body, teacher_id: user.id };
      const newCourse = await courseService.createCourse(data);
      return sendSuccess(res, newCourse, 201);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Create `api/courses/teacher/me.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../../backend/src/services/courseService.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';
import { AppError } from '../../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw AppError.forbidden('Only teachers can list their classes');
    }
    const courses = await courseService.listCoursesByTeacher(user.id, false);
    sendSuccess(res, courses);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 3: Create `api/courses/[id].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../backend/src/services/courseService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    if (req.method === 'GET') {
      const course = await courseService.getCourse(id);
      return sendSuccess(res, course);
    }

    if (req.method === 'PUT') {
      const user = await getAuthUser(req);
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw AppError.forbidden('Only teachers can update classes');
      }
      const updated = await courseService.updateCourse(id, req.body);
      return sendSuccess(res, updated);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 4: Create `api/dashboard/student.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DashboardService } from '../../backend/src/services/dashboardService.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const data = await new DashboardService(getDb()).getStudentDashboard(user.id);
    sendSuccess(res, data);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 5: Create `api/dashboard/teacher.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DashboardService } from '../../backend/src/services/dashboardService.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw AppError.forbidden('Only teachers can access the teacher dashboard');
    }
    const data = await new DashboardService(getDb()).getTeacherDashboard(user.id);
    sendSuccess(res, data);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add api/courses/ api/dashboard/
git commit -m "feat: add courses and dashboard Vercel Functions"
```

---

## Task 5: Enrollments Functions

**Files:**
- Create: `api/enrollments/me.ts`
- Create: `api/enrollments/index.ts`
- Create: `api/enrollments/[classId].ts`

- [ ] **Step 1: Create `api/enrollments/me.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can view their enrollments');
    const enrollments = await enrollmentService.getStudentEnrollments(user.id);
    sendSuccess(res, enrollments);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Create `api/enrollments/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can enroll in classes');
    const { classId } = req.body;
    if (!classId) throw AppError.badRequest('classId is required');
    const enrollment = await enrollmentService.enrollStudent(user.id, classId);
    sendSuccess(res, enrollment);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 3: Create `api/enrollments/[classId].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can unenroll');
    const classId = req.query.classId as string;
    await enrollmentService.unenrollStudent(user.id, classId);
    sendSuccess(res, { message: 'Unenrolled successfully' });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add api/enrollments/
git commit -m "feat: add enrollments Vercel Functions"
```

---

## Task 6: Exams Functions

**Files:**
- Create: `api/exams/upcoming.ts`
- Create: `api/exams/results.ts`
- Create: `api/exams/teacher/index.ts`
- Create: `api/exams/teacher/[id]/index.ts`
- Create: `api/exams/teacher/[id]/detail.ts`
- Create: `api/exams/teacher/[id]/answers.ts`
- Create: `api/exams/teacher/[id]/questions/[questionId].ts`
- Create: `api/exams/[id]/review.ts`
- Create: `api/exams/[id]/start.ts`
- Create: `api/exams/[id]/submit.ts`

- [ ] **Step 1: Create `api/exams/upcoming.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../backend/src/services/examService.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const upcoming = await new ExamService(getDb()).listUpcomingExams(user.id);
    sendSuccess(res, upcoming);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Create `api/exams/results.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../backend/src/services/examService.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const results = await new ExamService(getDb()).getStudentResults(user.id);
    sendSuccess(res, results);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 3: Create `api/exams/teacher/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';
import { AppError } from '../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();

    if (req.method === 'GET') {
      const exams = await new ExamService(getDb()).listTeacherExams(user.id);
      return sendSuccess(res, exams);
    }

    if (req.method === 'POST') {
      const { type, questions, pdfPath, pdfAnswers, ...examData } = req.body;
      const svc = new ExamService(getDb());
      let result;
      if (type === 'pdf') {
        result = await svc.createExamWithPdf(user.id, examData, pdfPath, pdfAnswers);
      } else if (type === 'manual') {
        result = await svc.createExamWithQuestions(user.id, examData, questions || []);
      } else {
        result = await svc.createExam(user.id, examData);
      }
      return sendSuccess(res, result, 201);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 4: Create `api/exams/teacher/[id]/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../backend/src/services/examService.js';
import { getDb } from '../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../_lib/response.js';
import { AppError } from '../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();

    if (req.method === 'PATCH') {
      const result = await new ExamService(getDb()).updateExam(id, req.body);
      return sendSuccess(res, result);
    }

    if (req.method === 'DELETE') {
      await new ExamService(getDb()).deleteExam(id);
      return sendSuccess(res, { success: true });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 5: Create `api/exams/teacher/[id]/detail.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../backend/src/services/examService.js';
import { getDb } from '../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../_lib/response.js';
import { AppError } from '../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();
    const detail = await new ExamService(getDb()).getExamReviewData(id);
    sendSuccess(res, detail);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 6: Create `api/exams/teacher/[id]/answers.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../backend/src/services/examService.js';
import { getDb } from '../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../_lib/response.js';
import { AppError } from '../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();
    const { changes, isPdfExam } = req.body as {
      changes: Record<string, string | number>;
      isPdfExam: boolean;
    };
    await new ExamService(getDb()).updateExamAnswers(id, changes, isPdfExam);
    sendSuccess(res, { success: true });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 7: Create `api/exams/teacher/[id]/questions/[questionId].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../../backend/src/services/examService.js';
import { getDb } from '../../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../../_lib/response.js';
import { AppError } from '../../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const questionId = req.query.questionId as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();
    const result = await new ExamService(getDb()).updateExamQuestion(questionId, req.body);
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 8: Create `api/exams/[id]/review.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id as string;
  try {
    await getAuthUser(req);
    const data = await new ExamService(getDb()).getExamReviewData(id);
    sendSuccess(res, data);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 9: Create `api/exams/[id]/start.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    const result = await new ExamService(getDb()).startAttempt(user.id, id);
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 10: Create `api/exams/[id]/submit.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    const { answers } = req.body;
    const result = await new ExamService(getDb()).submitAttempt(user.id, id, answers || {});
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 11: Commit**

```bash
git add api/exams/
git commit -m "feat: add exams Vercel Functions (student + teacher routes)"
```

---

## Task 7: StudyPacks, Users, and Files Functions

**Files:**
- Create: `api/studypacks/teacher.ts`
- Create: `api/studypacks/index.ts`
- Create: `api/studypacks/[id].ts`
- Create: `api/users/me.ts`
- Create: `api/files/signed-upload-url.ts`
- Create: `api/files/public-url.ts`

- [ ] **Step 1: Create `api/studypacks/teacher.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStudyPackService } from '../../backend/src/services/studyPackService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const packs = await getStudyPackService().getTeacherStudyPacks(user.id);
    sendSuccess(res, packs);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 2: Create `api/studypacks/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStudyPackService } from '../../backend/src/services/studyPackService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const newPack = await getStudyPackService().createStudyPack(user.id, req.body);
    sendSuccess(res, newPack, 201);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 3: Create `api/studypacks/[id].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStudyPackService } from '../../backend/src/services/studyPackService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);

    if (req.method === 'PATCH') {
      const updated = await getStudyPackService().updateStudyPack(user.id, id, req.body);
      return sendSuccess(res, updated);
    }

    if (req.method === 'DELETE') {
      await getStudyPackService().deleteStudyPack(user.id, id);
      return sendSuccess(res, { success: true });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 4: Create `api/users/me.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getAuthUser(req);

    if (req.method === 'GET') {
      const profile = await userService.getProfile(user.id);
      return sendSuccess(res, { profile });
    }

    if (req.method === 'PATCH') {
      const { full_name, avatar_url } = req.body as {
        full_name?: string;
        avatar_url?: string;
      };
      const profile = await userService.updateProfile(user.id, {
        ...(full_name !== undefined && { full_name }),
        ...(avatar_url !== undefined && { avatar_url }),
      });
      return sendSuccess(res, { profile });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 5: Create `api/files/signed-upload-url.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFileService } from '../../backend/src/services/fileService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await getAuthUser(req);
    const { bucket, path } = req.body;
    if (!bucket || !path) throw AppError.badRequest('bucket and path are required');
    const result = await getFileService().getSignedUploadUrl({ bucket, path });
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 6: Create `api/files/public-url.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFileService } from '../../backend/src/services/fileService.js';
import { handleError, sendSuccess } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { bucket, path } = req.query as { bucket: string; path: string };
    if (!bucket || !path) throw AppError.badRequest('bucket and path are required');
    const url = getFileService().getPublicUrl(bucket, path);
    sendSuccess(res, { url });
  } catch (err) {
    handleError(err, res);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add api/studypacks/ api/users/ api/files/
git commit -m "feat: add studypacks, users, and files Vercel Functions"
```

---

## Task 8: Update Frontend API Client

**Files:**
- Modify: `frontend/src/api/client.ts`

- [ ] **Step 1: Change the fallback URL from absolute to relative**

In `frontend/src/api/client.ts`, change line 1 from:

```ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

to:

```ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

This means:
- In local dev with Vite proxy → `/api` proxies to `http://localhost:3001/api`
- In Vercel production → `/api` hits the Vercel Functions on the same domain (zero CORS)

- [ ] **Step 2: Add Vite proxy for local dev**

In `frontend/vite.config.ts`, add a `server.proxy` entry so local dev still works against the Express backend:

Read the current content first, then add the proxy config. The file likely looks like:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Update it to:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/client.ts frontend/vite.config.ts
git commit -m "feat: update frontend API client to use relative /api path"
```

---

## Task 9: Update CI/CD Pipeline

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Replace the entire deploy.yml content**

The current file has broken build commands and stale Firebase env vars. Replace it entirely:

```yaml
name: Deploy acp.lk

on:
  push:
    branches:
      - dev
      - main

jobs:
  # ====================================
  # DEV DEPLOYMENT → Vercel Preview
  # ====================================
  deploy-dev:
    if: github.ref == 'refs/heads/dev'
    runs-on: ubuntu-latest
    environment: dev

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Info
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel (Preview)
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  # ====================================
  # PROD DEPLOYMENT → Vercel Production
  # ====================================
  deploy-prod:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: prod

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Info
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Note: Vercel CLI reads env vars directly from the Vercel project settings (pulled via `vercel pull`), so no manual `.env` injection is needed in the workflow.

- [ ] **Step 2: Set required env vars in Vercel project settings**

Go to your Vercel project → Settings → Environment Variables. Add these for **both** Preview and Production environments:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (from Supabase → Settings → Database → Connection string → URI) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (secret — never expose to frontend) |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret (from Supabase → Settings → API → JWT Secret) |
| `VITE_API_URL` | `/api` (relative path — same domain) |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` (frontend uses for auth) |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` |

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "chore: fix CI/CD pipeline for Vercel monorepo build"
```

---

## Task 10: Smoke Test + Final Commit

- [ ] **Step 1: Verify local backend still runs**

```bash
cd backend
npm run dev
```

Expected: Express server starts on port 3001. This confirms the backend code is still intact.

- [ ] **Step 2: Test a public API endpoint via curl**

With backend running locally:

```bash
curl http://localhost:3001/api/courses
```

Expected: `{"success":true,"data":[...]}` (list of active courses, may be empty array)

- [ ] **Step 3: Deploy to Vercel preview manually**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
vercel
```

When prompted: link to existing project (acp.lk). Vercel will run the `buildCommand` from `vercel.json`.

- [ ] **Step 4: Test the deployed preview URL**

Replace `<preview-url>` with the URL Vercel gives you:

```bash
curl https://<preview-url>/api/courses
```

Expected: `{"success":true,"data":[...]}` — same response as local.

```bash
curl -X POST https://<preview-url>/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"invalid","password":"wrong"}'
```

Expected: `{"success":false,"message":"...","code":"UNAUTHORIZED"}` — a 401 response, not a 500 or connection error.

- [ ] **Step 5: Open the preview URL in a browser and verify login works**

Navigate to `https://<preview-url>`. Try logging in with a real student account. Verify the dashboard loads.

- [ ] **Step 6: Push to dev branch to trigger CI**

```bash
git push origin fb-main-refactor:dev
```

Watch the GitHub Actions run. Both build and deploy steps should pass.

- [ ] **Step 7: Final commit**

All individual commits were made in each task. Create a final summary tag:

```bash
git log --oneline -10
```

Verify all the task commits appear. The deployment plan is complete.

---

## What's Next

After this plan is deployed and smoke-tested, continue with **Plan 2: UI Redesign + Portal Stubs + Admin Portal** (`docs/superpowers/plans/2026-05-09-ui-and-features.md`), which covers:
- Phase 2: shadcn/ui design system setup + migration of existing portals
- Phase 3: Completing student and teacher portal stubs
- Phase 4: Admin portal (dashboard, teachers, students, classes, payments)
