# Phase 3: Complete Student & Teacher Portal Stubs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every "Porting in progress" stub in the student and teacher portals with working pages backed by real API endpoints.

**Architecture:** Each feature follows the same layered pattern: Drizzle schema → Repository → Service (singleton) → Express route → frontend API module → React component. New DB tables (rank_lists, study_pack_purchases) must be created in the Supabase dashboard before the backend can use them. All frontend components live in `frontend/src/features/dashboard/components/{teacher,student}/` and are wired into the dashboard shell via its `<Routes>` block.

**Tech Stack:** Express + Drizzle ORM (backend), React 19 + Vite + shadcn/ui (frontend), Supabase Storage for file uploads via signed URLs, sonner for toast notifications.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `backend/src/repositories/schema/rank_lists.ts` | Create | Drizzle schema for teacher rank-list images |
| `backend/src/repositories/schema/study_pack_purchases.ts` | Create | Drizzle schema for student study-pack purchases |
| `backend/src/repositories/schema/index.ts` | Modify | Export new schemas |
| `backend/src/repositories/ReviewsRepository.ts` | Create | CRUD for class_reviews table |
| `backend/src/repositories/SuccessRepository.ts` | Create | CRUD for success table |
| `backend/src/repositories/RankListRepository.ts` | Create | CRUD for rank_lists table |
| `backend/src/repositories/StudyPackPurchaseRepository.ts` | Create | CRUD for study_pack_purchases table |
| `backend/src/repositories/index.ts` | Modify | Export new repositories |
| `backend/src/services/galleryService.ts` | Create | Teacher gallery business logic |
| `backend/src/services/reviewsService.ts` | Create | Teacher reviews business logic |
| `backend/src/services/successService.ts` | Create | Success stories business logic |
| `backend/src/services/rankListService.ts` | Create | Rank list business logic |
| `backend/src/services/studentStudyPackService.ts` | Create | Student study-pack browse + purchase |
| `backend/src/services/userService.ts` | Modify | Add `changePassword`, expand `updateProfile` to include `phone` |
| `backend/src/api/express/routes/gallery.routes.ts` | Create | GET/POST/DELETE/PATCH gallery endpoints |
| `backend/src/api/express/routes/reviews.routes.ts` | Create | GET/POST/PATCH/DELETE reviews endpoints |
| `backend/src/api/express/routes/success.routes.ts` | Create | GET/POST/PATCH/DELETE success endpoints |
| `backend/src/api/express/routes/rank-lists.routes.ts` | Create | GET/POST/DELETE rank-list endpoints |
| `backend/src/api/express/routes/users.routes.ts` | Modify | Add POST `/me/change-password`, expand PATCH fields |
| `backend/src/api/express/routes/studypacks.routes.ts` | Modify | Add GET `/student`, POST `/:id/purchase` |
| `backend/src/api/express/server.ts` | Modify | Register four new routers |
| `frontend/src/features/teacher/api.ts` | Create | GalleryApi, ReviewsApi, RankListsApi, SuccessApi, ProfileApi |
| `frontend/src/features/dashboard/api.ts` | Modify | Add StudentStudyPacksApi |
| `frontend/src/features/dashboard/components/teacher/GalleryManager.tsx` | Create | Image grid + upload + toggle |
| `frontend/src/features/dashboard/components/teacher/ReviewsManager.tsx` | Create | Review list + add/edit dialog + delete |
| `frontend/src/features/dashboard/components/teacher/TestResultsManager.tsx` | Create | Rank list table + upload + delete |
| `frontend/src/features/dashboard/components/teacher/SuccessManager.tsx` | Create | Success story list + add/edit dialog |
| `frontend/src/features/dashboard/components/teacher/TeacherProfile.tsx` | Create | Edit name/phone/avatar + change password |
| `frontend/src/features/dashboard/components/student/StudentStudyPacks.tsx` | Create | Browse/purchased packs + material viewer |
| `frontend/src/features/dashboard/components/student/StudentProfile.tsx` | Create | Edit name/avatar + change password |
| `frontend/src/features/dashboard/components/TeacherDashboard.tsx` | Modify | Wire all teacher stubs into Routes |
| `frontend/src/features/dashboard/components/StudentDashboard.tsx` | Modify | Wire student stubs into Routes |

---

## Task 1: Backend – New Schemas (rank_lists + study_pack_purchases)

**Files:**
- Create: `backend/src/repositories/schema/rank_lists.ts`
- Create: `backend/src/repositories/schema/study_pack_purchases.ts`
- Modify: `backend/src/repositories/schema/index.ts`

> ⚠️ **Before running the backend:** create both tables in the Supabase dashboard SQL editor using the CREATE TABLE statements in Step 3.

- [ ] **Step 1: Create `rank_lists.ts`**

```ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const rankLists = pgTable('rank_lists', {
  id: text('id').primaryKey(),
  teacher_id: text('teacher_id').notNull(),
  year: integer('year').notNull(),
  exam_name: text('exam_name').notNull(),
  image_path: text('image_path').notNull(),
  public_url: text('public_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type RankList = typeof rankLists.$inferSelect;
export type NewRankList = typeof rankLists.$inferInsert;
```

- [ ] **Step 2: Create `study_pack_purchases.ts`**

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const studyPackPurchases = pgTable('study_pack_purchases', {
  id: text('id').primaryKey(),
  student_id: text('student_id').notNull(),
  study_pack_id: text('study_pack_id').notNull(),
  purchased_at: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StudyPackPurchase = typeof studyPackPurchases.$inferSelect;
export type NewStudyPackPurchase = typeof studyPackPurchases.$inferInsert;
```

- [ ] **Step 3: Create tables in Supabase dashboard**

Open the Supabase project SQL editor and run:

```sql
CREATE TABLE IF NOT EXISTS rank_lists (
  id text PRIMARY KEY,
  teacher_id text NOT NULL,
  year integer NOT NULL,
  exam_name text NOT NULL,
  image_path text NOT NULL,
  public_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS study_pack_purchases (
  id text PRIMARY KEY,
  student_id text NOT NULL,
  study_pack_id text NOT NULL,
  purchased_at timestamptz DEFAULT now() NOT NULL
);
```

- [ ] **Step 4: Export from `schema/index.ts`**

Append to the end of `backend/src/repositories/schema/index.ts`:

```ts
export * from './rank_lists.js';
export * from './study_pack_purchases.js';
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add backend/src/repositories/schema/rank_lists.ts \
  backend/src/repositories/schema/study_pack_purchases.ts \
  backend/src/repositories/schema/index.ts
git commit -m "feat: add rank_lists and study_pack_purchases Drizzle schemas"
```

---

## Task 2: Backend – Repositories (Reviews, Success, RankList, StudyPackPurchase)

**Files:**
- Create: `backend/src/repositories/ReviewsRepository.ts`
- Create: `backend/src/repositories/SuccessRepository.ts`
- Create: `backend/src/repositories/RankListRepository.ts`
- Create: `backend/src/repositories/StudyPackPurchaseRepository.ts`
- Modify: `backend/src/repositories/index.ts`

- [ ] **Step 1: Create `ReviewsRepository.ts`**

```ts
import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { classReviews, type ClassReview, type NewClassReview } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class ReviewsRepository extends BaseRepository {
  constructor(db: DrizzleDb) { super(db); }

  async getByTeacherId(teacherId: string): Promise<ClassReview[]> {
    return this.db.select().from(classReviews)
      .where(eq(classReviews.teacher_id, teacherId))
      .orderBy(classReviews.display_order);
  }

  async findById(id: string): Promise<ClassReview | null> {
    const r = await this.db.select().from(classReviews)
      .where(eq(classReviews.id, id)).limit(1);
    return r[0] ?? null;
  }

  async create(data: NewClassReview): Promise<ClassReview> {
    const r = await this.db.insert(classReviews).values(data).returning();
    if (!r[0]) throw new Error('Failed to create review');
    return r[0];
  }

  async update(id: string, data: Partial<NewClassReview>): Promise<ClassReview> {
    const r = await this.db.update(classReviews)
      .set({ ...data, updated_at: new Date() })
      .where(eq(classReviews.id, id)).returning();
    if (!r[0]) throw new Error('Review not found');
    return r[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(classReviews).where(eq(classReviews.id, id));
  }
}
```

- [ ] **Step 2: Create `SuccessRepository.ts`**

```ts
import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { successStudents, type SuccessStudent, type NewSuccessStudent } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class SuccessRepository extends BaseRepository {
  constructor(db: DrizzleDb) { super(db); }

  async getAll(): Promise<SuccessStudent[]> {
    return this.db.select().from(successStudents)
      .orderBy(successStudents.created_at);
  }

  async findById(id: string): Promise<SuccessStudent | null> {
    const r = await this.db.select().from(successStudents)
      .where(eq(successStudents.id, id)).limit(1);
    return r[0] ?? null;
  }

  async create(data: NewSuccessStudent): Promise<SuccessStudent> {
    const r = await this.db.insert(successStudents).values(data).returning();
    if (!r[0]) throw new Error('Failed to create success story');
    return r[0];
  }

  async update(id: string, data: Partial<NewSuccessStudent>): Promise<SuccessStudent> {
    const r = await this.db.update(successStudents)
      .set(data)
      .where(eq(successStudents.id, id)).returning();
    if (!r[0]) throw new Error('Story not found');
    return r[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(successStudents).where(eq(successStudents.id, id));
  }
}
```

- [ ] **Step 3: Create `RankListRepository.ts`**

```ts
import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { rankLists, type RankList, type NewRankList } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class RankListRepository extends BaseRepository {
  constructor(db: DrizzleDb) { super(db); }

  async getByTeacherId(teacherId: string): Promise<RankList[]> {
    return this.db.select().from(rankLists)
      .where(eq(rankLists.teacher_id, teacherId))
      .orderBy(rankLists.year);
  }

  async findById(id: string): Promise<RankList | null> {
    const r = await this.db.select().from(rankLists)
      .where(eq(rankLists.id, id)).limit(1);
    return r[0] ?? null;
  }

  async create(data: NewRankList): Promise<RankList> {
    const r = await this.db.insert(rankLists).values(data).returning();
    if (!r[0]) throw new Error('Failed to create rank list');
    return r[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(rankLists).where(eq(rankLists.id, id));
  }
}
```

- [ ] **Step 4: Create `StudyPackPurchaseRepository.ts`**

```ts
import { and, eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { studyPackPurchases, type StudyPackPurchase, type NewStudyPackPurchase } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class StudyPackPurchaseRepository extends BaseRepository {
  constructor(db: DrizzleDb) { super(db); }

  async getByStudentId(studentId: string): Promise<StudyPackPurchase[]> {
    return this.db.select().from(studyPackPurchases)
      .where(eq(studyPackPurchases.student_id, studentId));
  }

  async findExisting(studentId: string, packId: string): Promise<StudyPackPurchase | null> {
    const r = await this.db.select().from(studyPackPurchases)
      .where(and(
        eq(studyPackPurchases.student_id, studentId),
        eq(studyPackPurchases.study_pack_id, packId),
      )).limit(1);
    return r[0] ?? null;
  }

  async create(data: NewStudyPackPurchase): Promise<StudyPackPurchase> {
    const r = await this.db.insert(studyPackPurchases).values(data).returning();
    if (!r[0]) throw new Error('Failed to record purchase');
    return r[0];
  }
}
```

- [ ] **Step 5: Export from `repositories/index.ts`**

Append to the end of `backend/src/repositories/index.ts`:

```ts
export * from './ReviewsRepository.js';
export * from './SuccessRepository.js';
export * from './RankListRepository.js';
export * from './StudyPackPurchaseRepository.js';
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add backend/src/repositories/ReviewsRepository.ts \
  backend/src/repositories/SuccessRepository.ts \
  backend/src/repositories/RankListRepository.ts \
  backend/src/repositories/StudyPackPurchaseRepository.ts \
  backend/src/repositories/index.ts
git commit -m "feat: add Reviews, Success, RankList, StudyPackPurchase repositories"
```

---

## Task 3: Backend – Services & Routes (Gallery, Reviews, Success, RankLists)

**Files:**
- Create: `backend/src/services/galleryService.ts`
- Create: `backend/src/services/reviewsService.ts`
- Create: `backend/src/services/successService.ts`
- Create: `backend/src/services/rankListService.ts`
- Create: `backend/src/api/express/routes/gallery.routes.ts`
- Create: `backend/src/api/express/routes/reviews.routes.ts`
- Create: `backend/src/api/express/routes/success.routes.ts`
- Create: `backend/src/api/express/routes/rank-lists.routes.ts`
- Modify: `backend/src/api/express/server.ts`

- [ ] **Step 1: Create `galleryService.ts`**

```ts
import { GalleryRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class GalleryService {
  private galleryRepo: GalleryRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.galleryRepo = new GalleryRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getImages(userId: string) {
    return this.galleryRepo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async addImage(userId: string, data: { storage_path: string; public_url?: string; caption?: string }) {
    const teacherId = await this.resolveTeacherId(userId);
    const existing = await this.galleryRepo.getByTeacherId(teacherId);
    return this.galleryRepo.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      storage_path: data.storage_path,
      public_url: data.public_url,
      caption: data.caption,
      display_order: existing.length,
    });
  }

  async deleteImage(userId: string, imageId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const img = await this.galleryRepo.findById(imageId);
    if (!img) throw AppError.notFound('Image not found');
    if (img.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete image you do not own');
    await this.galleryRepo.delete(imageId);
  }

  async toggleActive(userId: string, imageId: string, isActive: boolean) {
    const teacherId = await this.resolveTeacherId(userId);
    const img = await this.galleryRepo.findById(imageId);
    if (!img) throw AppError.notFound('Image not found');
    if (img.teacher_id !== teacherId) throw AppError.forbidden('Cannot modify image you do not own');
    await this.galleryRepo.toggleActive(imageId, isActive);
  }
}

let _instance: GalleryService;
export function getGalleryService() {
  if (!_instance) _instance = new GalleryService();
  return _instance;
}
```

- [ ] **Step 2: Create `reviewsService.ts`**

```ts
import { ReviewsRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
import type { NewClassReview } from '../repositories/schema/index.js';

class ReviewsService {
  private repo: ReviewsRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.repo = new ReviewsRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getReviews(userId: string) {
    return this.repo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async createReview(userId: string, data: Pick<NewClassReview, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'gender'>) {
    const teacherId = await this.resolveTeacherId(userId);
    const existing = await this.repo.getByTeacherId(teacherId);
    return this.repo.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      student_name: data.student_name,
      review_text: data.review_text,
      rating: data.rating,
      student_image_url: data.student_image_url,
      gender: data.gender,
      display_order: existing.length,
    });
  }

  async updateReview(userId: string, reviewId: string, data: Partial<Pick<NewClassReview, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'is_visible'>>) {
    const teacherId = await this.resolveTeacherId(userId);
    const review = await this.repo.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found');
    if (review.teacher_id !== teacherId) throw AppError.forbidden('Cannot modify review you do not own');
    return this.repo.update(reviewId, data);
  }

  async deleteReview(userId: string, reviewId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const review = await this.repo.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found');
    if (review.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete review you do not own');
    await this.repo.delete(reviewId);
  }
}

let _instance: ReviewsService;
export function getReviewsService() {
  if (!_instance) _instance = new ReviewsService();
  return _instance;
}
```

- [ ] **Step 3: Create `successService.ts`**

```ts
import { SuccessRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
import type { NewSuccessStudent } from '../repositories/schema/index.js';

class SuccessService {
  private repo: SuccessRepository;
  constructor() { this.repo = new SuccessRepository(getDb()); }

  getAll() { return this.repo.getAll(); }

  async create(data: Omit<NewSuccessStudent, 'id'>) {
    return this.repo.create({ id: crypto.randomUUID(), ...data });
  }

  async update(id: string, data: Partial<NewSuccessStudent>) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Story not found');
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Story not found');
    await this.repo.delete(id);
  }
}

let _instance: SuccessService;
export function getSuccessService() {
  if (!_instance) _instance = new SuccessService();
  return _instance;
}
```

- [ ] **Step 4: Create `rankListService.ts`**

```ts
import { RankListRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class RankListService {
  private repo: RankListRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.repo = new RankListRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getAll(userId: string) {
    return this.repo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async create(userId: string, data: { year: number; exam_name: string; image_path: string; public_url?: string }) {
    const teacherId = await this.resolveTeacherId(userId);
    return this.repo.create({ id: crypto.randomUUID(), teacher_id: teacherId, ...data });
  }

  async delete(userId: string, id: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const entry = await this.repo.findById(id);
    if (!entry) throw AppError.notFound('Rank list not found');
    if (entry.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete entry you do not own');
    await this.repo.delete(id);
  }
}

let _instance: RankListService;
export function getRankListService() {
  if (!_instance) _instance = new RankListService();
  return _instance;
}
```

- [ ] **Step 5: Create `gallery.routes.ts`**

```ts
import { Router } from 'express';
import { getGalleryService } from '../../../services/galleryService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const galleryRouter = Router();
galleryRouter.use(requireAuth);

galleryRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getGalleryService().getImages(userId));
  } catch (err) { next(err); }
});

galleryRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { storage_path, public_url, caption } = req.body;
    if (!storage_path) throw AppError.badRequest('storage_path is required');
    sendSuccess(res, await getGalleryService().addImage(userId, { storage_path, public_url, caption }), 201);
  } catch (err) { next(err); }
});

galleryRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getGalleryService().deleteImage(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});

galleryRouter.patch('/:id/toggle', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { is_active } = req.body;
    await getGalleryService().toggleActive(userId, req.params.id, Boolean(is_active));
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 6: Create `reviews.routes.ts`**

```ts
import { Router } from 'express';
import { getReviewsService } from '../../../services/reviewsService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const reviewsRouter = Router();
reviewsRouter.use(requireAuth);

reviewsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getReviewsService().getReviews(userId));
  } catch (err) { next(err); }
});

reviewsRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { student_name, review_text, rating, student_image_url, gender } = req.body;
    if (!student_name || !review_text || !rating) throw AppError.badRequest('student_name, review_text, and rating are required');
    sendSuccess(res, await getReviewsService().createReview(userId, { student_name, review_text, rating, student_image_url, gender }), 201);
  } catch (err) { next(err); }
});

reviewsRouter.patch('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getReviewsService().updateReview(userId, req.params.id, req.body));
  } catch (err) { next(err); }
});

reviewsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getReviewsService().deleteReview(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 7: Create `success.routes.ts`**

```ts
import { Router } from 'express';
import { getSuccessService } from '../../../services/successService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const successRouter = Router();
successRouter.use(requireAuth);

successRouter.get('/', async (req, res, next) => {
  try { sendSuccess(res, await getSuccessService().getAll()); } catch (err) { next(err); }
});

successRouter.post('/', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    sendSuccess(res, await getSuccessService().create(req.body), 201);
  } catch (err) { next(err); }
});

successRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    sendSuccess(res, await getSuccessService().update(req.params.id, req.body));
  } catch (err) { next(err); }
});

successRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    await getSuccessService().delete(req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 8: Create `rank-lists.routes.ts`**

```ts
import { Router } from 'express';
import { getRankListService } from '../../../services/rankListService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const rankListsRouter = Router();
rankListsRouter.use(requireAuth);

rankListsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getRankListService().getAll(userId));
  } catch (err) { next(err); }
});

rankListsRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { year, exam_name, image_path, public_url } = req.body;
    if (!year || !exam_name || !image_path) throw AppError.badRequest('year, exam_name, and image_path are required');
    sendSuccess(res, await getRankListService().create(userId, { year: Number(year), exam_name, image_path, public_url }), 201);
  } catch (err) { next(err); }
});

rankListsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getRankListService().delete(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
```

- [ ] **Step 9: Register all four routers in `server.ts`**

In `backend/src/api/express/server.ts`, add four import lines after the existing imports:

```ts
import { galleryRouter } from './routes/gallery.routes.js';
import { reviewsRouter } from './routes/reviews.routes.js';
import { successRouter } from './routes/success.routes.js';
import { rankListsRouter } from './routes/rank-lists.routes.js';
```

Add four `app.use` lines after the existing routes block:

```ts
app.use('/api/gallery', galleryRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/success', successRouter);
app.use('/api/rank-lists', rankListsRouter);
```

- [ ] **Step 10: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add backend/src/services/galleryService.ts \
  backend/src/services/reviewsService.ts \
  backend/src/services/successService.ts \
  backend/src/services/rankListService.ts \
  backend/src/api/express/routes/gallery.routes.ts \
  backend/src/api/express/routes/reviews.routes.ts \
  backend/src/api/express/routes/success.routes.ts \
  backend/src/api/express/routes/rank-lists.routes.ts \
  backend/src/api/express/server.ts
git commit -m "feat: add gallery, reviews, success, rank-lists backend services and routes"
```

---

## Task 4: Backend – Student Study Packs & Password Change

**Files:**
- Create: `backend/src/services/studentStudyPackService.ts`
- Modify: `backend/src/api/express/routes/studypacks.routes.ts`
- Modify: `backend/src/services/userService.ts`
- Modify: `backend/src/api/express/routes/users.routes.ts`

- [ ] **Step 1: Create `studentStudyPackService.ts`**

```ts
import { StudyPackPurchaseRepository, StudyPackRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class StudentStudyPackService {
  private purchaseRepo: StudyPackPurchaseRepository;
  private packRepo: StudyPackRepository;

  constructor() {
    const db = getDb();
    this.purchaseRepo = new StudyPackPurchaseRepository(db);
    this.packRepo = new StudyPackRepository(db);
  }

  async getStudentPacks(studentId: string) {
    const purchases = await this.purchaseRepo.getByStudentId(studentId);
    const purchasedIds = new Set(purchases.map(p => p.study_pack_id));
    const allPacks = await this.packRepo.findAllPublishedOrFree();

    return {
      purchased: allPacks.filter(p => purchasedIds.has(p.id) || p.is_free),
      available: allPacks.filter(p => !purchasedIds.has(p.id) && !p.is_free),
    };
  }

  async purchasePack(studentId: string, packId: string) {
    const pack = await this.packRepo.findById(packId);
    if (!pack) throw AppError.notFound('Study pack not found');
    const existing = await this.purchaseRepo.findExisting(studentId, packId);
    if (existing) throw AppError.conflict('Already purchased');
    return this.purchaseRepo.create({
      id: crypto.randomUUID(),
      student_id: studentId,
      study_pack_id: packId,
    });
  }
}

let _instance: StudentStudyPackService;
export function getStudentStudyPackService() {
  if (!_instance) _instance = new StudentStudyPackService();
  return _instance;
}
```

- [ ] **Step 2: Add student endpoints to `studypacks.routes.ts`**

READ `backend/src/api/express/routes/studypacks.routes.ts` first (to see current content), then append these two routes at the end of the file before the final blank line:

```ts
import { getStudentStudyPackService } from '../../../services/studentStudyPackService.js';

// GET /api/studypacks/student  — returns { purchased: StudyPack[], available: StudyPack[] }
studyPacksRouter.get('/student', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const result = await getStudentStudyPackService().getStudentPacks(userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/studypacks/:id/purchase
studyPacksRouter.post('/:id/purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) throw AppError.unauthorized();
    const purchase = await getStudentStudyPackService().purchasePack(userId, id);
    sendSuccess(res, purchase, 201);
  } catch (err) {
    next(err);
  }
});
```

Note: The import for `getStudentStudyPackService` must go at the top of the file with the other imports, not inside the route handler.

- [ ] **Step 3: Add `changePassword` to `userService.ts`**

READ `backend/src/services/userService.ts` first. Add this method inside the `UserService` class, after the `updateProfile` method:

```ts
async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const profile = await this.profileRepo.findById(userId);
  if (!profile) throw AppError.notFound('Profile not found');
  try {
    await this.authProvider.signIn(profile.email, currentPassword);
  } catch {
    throw AppError.badRequest('Current password is incorrect');
  }
  await this.authProvider.updatePassword(userId, newPassword);
}
```

Also extend the `updateProfile` method to accept `phone`:

Find this existing method:
```ts
async updateProfile(userId: string, updates: Partial<NewProfile>) {
  return this.profileRepo.update(userId, updates);
}
```

Replace it with (no change to the body — just confirm that `Partial<NewProfile>` already covers `phone`; if so, no change needed). The method signature already accepts any partial profile field, so no change is required.

- [ ] **Step 4: Add change-password route and expand PATCH in `users.routes.ts`**

READ `backend/src/api/express/routes/users.routes.ts` first. 

In the existing `PATCH /me` handler, find this block:
```ts
const { full_name, avatar_url } = req.body as {
  full_name?: string;
  avatar_url?: string;
};

const profile = await userService.updateProfile(req.user.id, {
  ...(full_name !== undefined && { full_name }),
  ...(avatar_url !== undefined && { avatar_url }),
});
```

Replace with:
```ts
const { full_name, avatar_url, phone } = req.body as {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
};

const profile = await userService.updateProfile(req.user.id, {
  ...(full_name !== undefined && { full_name }),
  ...(avatar_url !== undefined && { avatar_url }),
  ...(phone !== undefined && { phone }),
});
```

Then append a new route at the end of the file:

```ts
/**
 * POST /api/users/me/change-password
 * Body: { currentPassword: string; newPassword: string }
 */
usersRouter.post('/me/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('currentPassword and newPassword are required');
    }
    if (newPassword.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters');
    }
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});
```

You'll need to import `AppError` at the top of the file if it isn't already imported:
```ts
import { AppError } from '../../../utils/errors.js';
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add backend/src/services/studentStudyPackService.ts \
  backend/src/services/userService.ts \
  backend/src/api/express/routes/studypacks.routes.ts \
  backend/src/api/express/routes/users.routes.ts
git commit -m "feat: add student study pack endpoints and change-password route"
```

---

## Task 5: Frontend – API Modules

**Files:**
- Create: `frontend/src/features/teacher/api.ts`
- Modify: `frontend/src/features/dashboard/api.ts`

- [ ] **Step 1: Create `frontend/src/features/teacher/api.ts`**

```ts
import { apiClient } from '@/api/client';
import type { UserProfile } from '@/features/auth/api';

// ── Gallery ────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  teacher_id: string;
  storage_path: string;
  public_url?: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const GalleryApi = {
  getImages: () => apiClient.get<GalleryImage[]>('/gallery'),
  addImage: (data: { storage_path: string; public_url?: string; caption?: string }) =>
    apiClient.post<GalleryImage>('/gallery', data),
  deleteImage: (id: string) => apiClient.delete(`/gallery/${id}`),
  toggleActive: (id: string, is_active: boolean) =>
    apiClient.patch(`/gallery/${id}/toggle`, { is_active }),
};

// ── Reviews ────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  teacher_id: string;
  student_name: string;
  review_text: string;
  rating: string;
  student_image_url?: string;
  gender?: 'male' | 'female';
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const ReviewsApi = {
  getReviews: () => apiClient.get<Review[]>('/reviews'),
  createReview: (data: {
    student_name: string;
    review_text: string;
    rating: string;
    student_image_url?: string;
    gender?: 'male' | 'female';
  }) => apiClient.post<Review>('/reviews', data),
  updateReview: (id: string, data: Partial<Pick<Review, 'student_name' | 'review_text' | 'rating' | 'student_image_url' | 'is_visible'>>) =>
    apiClient.patch<Review>(`/reviews/${id}`, data),
  deleteReview: (id: string) => apiClient.delete(`/reviews/${id}`),
};

// ── Rank Lists ─────────────────────────────────────────────────────────────

export interface RankList {
  id: string;
  teacher_id: string;
  year: number;
  exam_name: string;
  image_path: string;
  public_url?: string;
  created_at: string;
}

export const RankListsApi = {
  getRankLists: () => apiClient.get<RankList[]>('/rank-lists'),
  createRankList: (data: { year: number; exam_name: string; image_path: string; public_url?: string }) =>
    apiClient.post<RankList>('/rank-lists', data),
  deleteRankList: (id: string) => apiClient.delete(`/rank-lists/${id}`),
};

// ── Success Stories ────────────────────────────────────────────────────────

export interface SuccessStory {
  id: string;
  full_name?: string;
  index_no?: string;
  results?: string;
  faculty?: string;
  university?: string;
  image_path?: string;
  created_at: string;
}

export const SuccessApi = {
  getStories: () => apiClient.get<SuccessStory[]>('/success'),
  createStory: (data: Omit<SuccessStory, 'id' | 'created_at'>) =>
    apiClient.post<SuccessStory>('/success', data),
  updateStory: (id: string, data: Partial<Omit<SuccessStory, 'id' | 'created_at'>>) =>
    apiClient.patch<SuccessStory>(`/success/${id}`, data),
  deleteStory: (id: string) => apiClient.delete(`/success/${id}`),
};

// ── Profile ────────────────────────────────────────────────────────────────

export const ProfileApi = {
  getMe: () => apiClient.get<{ profile: UserProfile }>('/auth/me'),
  updateMe: (data: { full_name?: string; avatar_url?: string; phone?: string }) =>
    apiClient.patch<{ profile: UserProfile }>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post<{ success: boolean }>('/users/me/change-password', data),
};
```

- [ ] **Step 2: Add `StudentStudyPacksApi` to `frontend/src/features/dashboard/api.ts`**

READ `frontend/src/features/dashboard/api.ts` first. Append at the end:

```ts
export const StudentStudyPacksApi = {
  getStudentPacks: () =>
    apiClient.get<{ purchased: StudyPack[]; available: StudyPack[] }>('/studypacks/student'),
  purchasePack: (id: string) =>
    apiClient.post<{ success: boolean }>(`/studypacks/${id}/purchase`, {}),
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/teacher/api.ts \
  frontend/src/features/dashboard/api.ts
git commit -m "feat: add teacher and student study pack API modules"
```

---

## Task 6: Frontend – GalleryManager

**Files:**
- Create: `frontend/src/features/dashboard/components/teacher/GalleryManager.tsx`
- Modify: `frontend/src/features/dashboard/components/TeacherDashboard.tsx`

- [ ] **Step 1: Create `GalleryManager.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Upload, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { GalleryApi } from '@/features/teacher/api';
import type { GalleryImage } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchImages(); }, []);

  async function fetchImages() {
    try {
      setLoading(true);
      setImages(await GalleryApi.getImages());
    } catch { toast.error('Failed to load gallery'); }
    finally { setLoading(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const path = `gallery/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, file);
        const publicUrl = await FilesApi.getPublicUrl('acp', storagePath);
        const image = await GalleryApi.addImage({ storage_path: storagePath, public_url: publicUrl });
        setImages(prev => [...prev, image]);
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
    } catch { toast.error('Upload failed. Check storage bucket permissions.'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    try {
      await GalleryApi.deleteImage(id);
      setImages(prev => prev.filter(i => i.id !== id));
      toast.success('Image deleted');
    } catch { toast.error('Failed to delete image'); }
  }

  async function handleToggle(image: GalleryImage) {
    try {
      await GalleryApi.toggleActive(image.id, !image.is_active);
      setImages(prev => prev.map(i => i.id === image.id ? { ...i, is_active: !i.is_active } : i));
    } catch { toast.error('Failed to update visibility'); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Images displayed on the public website gallery section</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} isLoading={uploading} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Images
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No images yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload photos to show on the public gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(image => (
            <div key={image.id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
              <img
                src={image.public_url ?? ''}
                alt={image.caption ?? ''}
                className={`w-full h-full object-cover transition-opacity ${image.is_active ? 'opacity-100' : 'opacity-40'}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleToggle(image)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
                  title={image.is_active ? 'Hide from website' : 'Show on website'}
                >
                  {image.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {!image.is_active && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white">
                  Hidden
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire `GalleryManager` into `TeacherDashboard.tsx`**

READ `frontend/src/features/dashboard/components/TeacherDashboard.tsx` to find the current `GalleryManager` stub and the `<Routes>` block.

Replace the stub line:
```tsx
const GalleryManager = () => <div className="p-8 font-bold text-xl">Gallery Manager (Porting in progress)</div>;
```

With an import at the top of the file:
```tsx
import GalleryManager from './teacher/GalleryManager';
```

The `<Route path="gallery" element={<GalleryManager />} />` in the Routes block should already exist — leave it unchanged.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/teacher/GalleryManager.tsx \
  frontend/src/features/dashboard/components/TeacherDashboard.tsx
git commit -m "feat: implement GalleryManager for teacher portal"
```

---

## Task 7: Frontend – ReviewsManager

**Files:**
- Create: `frontend/src/features/dashboard/components/teacher/ReviewsManager.tsx`
- Modify: `frontend/src/features/dashboard/components/TeacherDashboard.tsx`

- [ ] **Step 1: Create `ReviewsManager.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star, MessageSquare } from 'lucide-react';
import { ReviewsApi } from '@/features/teacher/api';
import type { Review } from '@/features/teacher/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM = {
  student_name: '',
  review_text: '',
  rating: '5',
  student_image_url: '',
  gender: '' as '' | 'male' | 'female',
};

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    try {
      setLoading(true);
      setReviews(await ReviewsApi.getReviews());
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(review: Review) {
    setEditing(review);
    setForm({
      student_name: review.student_name,
      review_text: review.review_text,
      rating: review.rating,
      student_image_url: review.student_image_url ?? '',
      gender: review.gender ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.student_name || !form.review_text || !form.rating) {
      toast.error('Name, review text, and rating are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_name: form.student_name,
        review_text: form.review_text,
        rating: form.rating,
        student_image_url: form.student_image_url || undefined,
        gender: (form.gender || undefined) as 'male' | 'female' | undefined,
      };
      if (editing) {
        const updated = await ReviewsApi.updateReview(editing.id, payload);
        setReviews(prev => prev.map(r => r.id === editing.id ? updated : r));
        toast.success('Review updated');
      } else {
        const created = await ReviewsApi.createReview(payload);
        setReviews(prev => [...prev, created]);
        toast.success('Review added');
      }
      setDialogOpen(false);
    } catch { toast.error('Failed to save review'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await ReviewsApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete review'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">Student testimonials shown on the public website</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Review
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Add student testimonials to display on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                {review.student_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 text-sm">{review.student_name}</span>
                  <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    {review.rating}
                  </span>
                  {!review.is_visible && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-medium">Hidden</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{review.review_text}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(review)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(review.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Review' : 'Add Review'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              label="Student Name"
              value={form.student_name}
              onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
              placeholder="e.g. Kavindu Perera"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700 ml-1">Review Text</label>
              <textarea
                className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring shadow-sm resize-none"
                rows={3}
                value={form.review_text}
                onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                placeholder="What did the student say?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rating (1–5)"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700 ml-1">Gender</label>
                <select
                  className="flex w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring shadow-sm"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as '' | 'male' | 'female' }))}
                >
                  <option value="">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <Input
              label="Student Photo URL (optional)"
              value={form.student_image_url}
              onChange={e => setForm(f => ({ ...f, student_image_url: e.target.value }))}
              placeholder="https://..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>
                {editing ? 'Save Changes' : 'Add Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `TeacherDashboard.tsx`**

Replace the stub:
```tsx
const ReviewsManager = () => <div className="p-8 font-bold text-xl">Reviews Manager (Porting in progress)</div>;
```

With an import:
```tsx
import ReviewsManager from './teacher/ReviewsManager';
```

- [ ] **Step 3: Verify + Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/teacher/ReviewsManager.tsx \
  frontend/src/features/dashboard/components/TeacherDashboard.tsx
git commit -m "feat: implement ReviewsManager for teacher portal"
```

---

## Task 8: Frontend – TestResultsManager

**Files:**
- Create: `frontend/src/features/dashboard/components/teacher/TestResultsManager.tsx`
- Modify: `frontend/src/features/dashboard/components/TeacherDashboard.tsx`

- [ ] **Step 1: Create `TestResultsManager.tsx`**

```tsx
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Trophy } from 'lucide-react';
import { RankListsApi } from '@/features/teacher/api';
import type { RankList } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CURRENT_YEAR = new Date().getFullYear();

export default function TestResultsManager() {
  const [entries, setEntries] = useState<RankList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ year: CURRENT_YEAR, exam_name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    try {
      setLoading(true);
      setEntries(await RankListsApi.getRankLists());
    } catch { toast.error('Failed to load test results'); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.exam_name || !selectedFile) {
      toast.error('Exam name and image are required');
      return;
    }
    setSaving(true);
    try {
      const path = `rank-lists/${form.year}_${form.exam_name.replace(/\s+/g, '_')}_${Date.now()}${selectedFile.name.slice(selectedFile.name.lastIndexOf('.'))}`;
      const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, selectedFile);
      const publicUrl = await FilesApi.getPublicUrl('acp', storagePath);
      const entry = await RankListsApi.createRankList({
        year: form.year,
        exam_name: form.exam_name,
        image_path: storagePath,
        public_url: publicUrl,
      });
      setEntries(prev => [...prev, entry].sort((a, b) => b.year - a.year));
      toast.success('Rank list added');
      setDialogOpen(false);
      setForm({ year: CURRENT_YEAR, exam_name: '' });
      setSelectedFile(null);
    } catch { toast.error('Failed to save rank list'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await RankListsApi.deleteRankList(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete entry'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-sm text-gray-500 mt-1">Rank list images shown on the public website</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Result
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No results yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload rank list images to show on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
              {entry.public_url ? (
                <img src={entry.public_url} alt={entry.exam_name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{entry.exam_name}</p>
                <p className="text-sm text-gray-500">{entry.year}</p>
              </div>
              <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rank List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              />
              <Input
                label="Exam Name"
                value={form.exam_name}
                onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))}
                placeholder="e.g. A/L 2026"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-gray-700 ml-1 block mb-1.5">Rank List Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-700 truncate flex-1">{selectedFile.name}</span>
                  <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-gray-600 text-xs">Remove</button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors text-gray-400"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Click to select image or PDF</span>
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>Add Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `TeacherDashboard.tsx`**

Replace:
```tsx
const TestResultsManager = () => <div className="p-8 font-bold text-xl">Test Results (Porting in progress)</div>;
```
With:
```tsx
import TestResultsManager from './teacher/TestResultsManager';
```

- [ ] **Step 3: Verify + Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/teacher/TestResultsManager.tsx \
  frontend/src/features/dashboard/components/TeacherDashboard.tsx
git commit -m "feat: implement TestResultsManager for teacher portal"
```

---

## Task 9: Frontend – SuccessManager

**Files:**
- Create: `frontend/src/features/dashboard/components/teacher/SuccessManager.tsx`
- Modify: `frontend/src/features/dashboard/components/TeacherDashboard.tsx`

- [ ] **Step 1: Create `SuccessManager.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { SuccessApi } from '@/features/teacher/api';
import type { SuccessStory } from '@/features/teacher/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EMPTY_FORM = {
  full_name: '',
  index_no: '',
  results: '',
  faculty: '',
  university: '',
  image_path: '',
};

export default function SuccessManager() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchStories(); }, []);

  async function fetchStories() {
    try {
      setLoading(true);
      setStories(await SuccessApi.getStories());
    } catch { toast.error('Failed to load success stories'); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(story: SuccessStory) {
    setEditing(story);
    setForm({
      full_name: story.full_name ?? '',
      index_no: story.index_no ?? '',
      results: story.results ?? '',
      faculty: story.faculty ?? '',
      university: story.university ?? '',
      image_path: story.image_path ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.full_name) { toast.error('Student name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name || undefined,
        index_no: form.index_no || undefined,
        results: form.results || undefined,
        faculty: form.faculty || undefined,
        university: form.university || undefined,
        image_path: form.image_path || undefined,
      };
      if (editing) {
        const updated = await SuccessApi.updateStory(editing.id, payload);
        setStories(prev => prev.map(s => s.id === editing.id ? updated : s));
        toast.success('Story updated');
      } else {
        const created = await SuccessApi.createStory(payload);
        setStories(prev => [...prev, created]);
        toast.success('Story added');
      }
      setDialogOpen(false);
    } catch { toast.error('Failed to save story'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      await SuccessApi.deleteStory(id);
      setStories(prev => prev.filter(s => s.id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete story'); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Success Stories</h1>
          <p className="text-sm text-gray-500 mt-1">Student achievements shown on the public website</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Story
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No stories yet</p>
          <p className="text-sm text-gray-400 mt-1">Add student success stories to display on the public site</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(story => (
            <div key={story.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
              {story.image_path ? (
                <img src={story.image_path} alt={story.full_name ?? ''} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                  {(story.full_name ?? 'S').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{story.full_name}</p>
                <p className="text-sm text-gray-500">{[story.results, story.university].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(story)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(story.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Story' : 'Add Success Story'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input label="Student Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Nimasha Perera" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Index No." value={form.index_no} onChange={e => setForm(f => ({ ...f, index_no: e.target.value }))} placeholder="e.g. 12345678" />
              <Input label="Results" value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))} placeholder="e.g. 3A passes" />
            </div>
            <Input label="Faculty" value={form.faculty} onChange={e => setForm(f => ({ ...f, faculty: e.target.value }))} placeholder="e.g. Faculty of Science" />
            <Input label="University" value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} placeholder="e.g. University of Peradeniya" />
            <Input label="Photo URL (optional)" value={form.image_path} onChange={e => setForm(f => ({ ...f, image_path: e.target.value }))} placeholder="https://..." />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>{editing ? 'Save Changes' : 'Add Story'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `TeacherDashboard.tsx`**

Replace:
```tsx
const SuccessManager = () => <div className="p-8 font-bold text-xl">Success Stories (Porting in progress)</div>;
```
With:
```tsx
import SuccessManager from './teacher/SuccessManager';
```

- [ ] **Step 3: Verify + Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/teacher/SuccessManager.tsx \
  frontend/src/features/dashboard/components/TeacherDashboard.tsx
git commit -m "feat: implement SuccessManager for teacher portal"
```

---

## Task 10: Frontend – TeacherProfile

**Files:**
- Create: `frontend/src/features/dashboard/components/teacher/TeacherProfile.tsx`
- Modify: `frontend/src/features/dashboard/components/TeacherDashboard.tsx`

- [ ] **Step 1: Create `TeacherProfile.tsx`**

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileApi } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Camera, Lock } from 'lucide-react';

export default function TeacherProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile() {
    if (!form.full_name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await ProfileApi.updateMe({ full_name: form.full_name, phone: form.phone || undefined, avatar_url: avatarUrl || undefined });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const path = `avatars/${user?.id}_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, file);
      const url = await FilesApi.getPublicUrl('acp', storagePath);
      setAvatarUrl(url);
      await ProfileApi.updateMe({ avatar_url: url });
      toast.success('Profile photo updated');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingAvatar(false); }
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('All password fields are required'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      await ProfileApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(form.full_name || 'T')}
              </AvatarFallback>
            </Avatar>
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow ${uploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}>
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-500">Teacher</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <Input
          label="Full Name"
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
        />
        <Input
          label="Email"
          value={user?.email ?? ''}
          disabled
          helperText="Email cannot be changed"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+94 77 000 0000"
        />
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} isLoading={saving}>Save Changes</Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <Input
          label="Current Password"
          type="password"
          value={passwordForm.currentPassword}
          onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
        />
        <Input
          label="New Password"
          type="password"
          value={passwordForm.newPassword}
          onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
          helperText="At least 8 characters"
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
        />
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} isLoading={changingPassword} variant="outline">
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `TeacherDashboard.tsx`**

Replace:
```tsx
const ProfilePage = () => <div className="p-8 font-bold text-xl">Profile Page (Porting in progress)</div>;
```
With:
```tsx
import TeacherProfile from './teacher/TeacherProfile';
```

Also find the route `<Route path="profile" element={<ProfilePage />} />` and change it to `<Route path="profile" element={<TeacherProfile />} />`.

- [ ] **Step 3: Verify + Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/teacher/TeacherProfile.tsx \
  frontend/src/features/dashboard/components/TeacherDashboard.tsx
git commit -m "feat: implement TeacherProfile page"
```

---

## Task 11: Frontend – StudentStudyPacks

**Files:**
- Create: `frontend/src/features/dashboard/components/student/StudentStudyPacks.tsx`
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx`

- [ ] **Step 1: Create `StudentStudyPacks.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Package, Play, FileText, Lock } from 'lucide-react';
import { StudentStudyPacksApi } from '../../api';
import type { StudyPack, VideoLesson } from '../../api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function StudentStudyPacks() {
  const [purchased, setPurchased] = useState<StudyPack[]>([]);
  const [available, setAvailable] = useState<StudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<StudyPack | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => { fetchPacks(); }, []);

  async function fetchPacks() {
    try {
      setLoading(true);
      const data = await StudentStudyPacksApi.getStudentPacks();
      setPurchased(data.purchased);
      setAvailable(data.available);
    } catch { toast.error('Failed to load study packs'); }
    finally { setLoading(false); }
  }

  async function handlePurchase(pack: StudyPack) {
    setPurchasing(pack.id);
    try {
      await StudentStudyPacksApi.purchasePack(pack.id);
      setAvailable(prev => prev.filter(p => p.id !== pack.id));
      setPurchased(prev => [...prev, pack]);
      toast.success(`Enrolled in "${pack.title}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll');
    } finally { setPurchasing(null); }
  }

  function PackCard({ pack, owned }: { pack: StudyPack; owned: boolean }) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          {pack.is_free ? (
            <Badge variant="secondary" className="text-xs">Free</Badge>
          ) : owned ? (
            <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Enrolled</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Rs. {Number(pack.price).toLocaleString()}</Badge>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{pack.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{pack.subject}</p>
          {pack.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pack.description}</p>}
        </div>
        <p className="text-xs text-gray-400">{pack.materials?.length ?? 0} lesson{pack.materials?.length !== 1 ? 's' : ''}</p>
        {owned ? (
          <Button size="sm" onClick={() => setSelectedPack(pack)} className="w-full">
            View Materials
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            isLoading={purchasing === pack.id}
            onClick={() => handlePurchase(pack)}
          >
            {pack.is_free ? 'Enroll Free' : <><Lock className="w-3 h-3 mr-1" />Purchase</>}
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Study Packs</h1>
        <p className="text-sm text-gray-500 mt-1">Access video lessons and study materials</p>
      </div>

      {purchased.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-700">My Packs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {purchased.map(pack => <PackCard key={pack.id} pack={pack} owned />)}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-700">Available Packs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {available.map(pack => <PackCard key={pack.id} pack={pack} owned={false} />)}
          </div>
        </section>
      )}

      {purchased.length === 0 && available.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No study packs available</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for study materials</p>
        </div>
      )}

      {/* Materials viewer */}
      <Dialog open={selectedPack !== null} onOpenChange={open => { if (!open) setSelectedPack(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPack?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {(selectedPack?.materials ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No materials available yet</p>
            ) : (
              (selectedPack?.materials ?? []).map((lesson: VideoLesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {lesson.youtube_url ? <Play className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400">{lesson.duration} · {lesson.size}</p>
                  </div>
                  {lesson.youtube_url && (
                    <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                      Watch
                    </a>
                  )}
                  {lesson.url && !lesson.youtube_url && (
                    <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                      Download
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `StudentDashboard.tsx`**

READ `frontend/src/features/dashboard/components/StudentDashboard.tsx`. Find the stub:
```tsx
const StudyPacks = () => <div className="p-8 font-bold text-xl">Study Packs (Porting in progress)</div>;
```

Replace with an import:
```tsx
import StudentStudyPacks from './student/StudentStudyPacks';
```

Find the `<Route path="studypacks" element={<StudyPacks />} />` and change to:
```tsx
<Route path="studypacks" element={<StudentStudyPacks />} />
```

- [ ] **Step 3: Verify + Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/student/StudentStudyPacks.tsx \
  frontend/src/features/dashboard/components/StudentDashboard.tsx
git commit -m "feat: implement StudentStudyPacks page"
```

---

## Task 12: Frontend – StudentProfile

**Files:**
- Create: `frontend/src/features/dashboard/components/student/StudentProfile.tsx`
- Modify: `frontend/src/features/dashboard/components/StudentDashboard.tsx`

- [ ] **Step 1: Create `StudentProfile.tsx`**

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { CENTER_LABELS } from '@/contexts/AuthContext';
import { ProfileApi } from '@/features/teacher/api';
import { FilesApi } from '../../api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Camera, Lock } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile() {
    if (!fullName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await ProfileApi.updateMe({ full_name: fullName, avatar_url: avatarUrl || undefined });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const path = `avatars/${user?.id}_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const storagePath = await FilesApi.uploadWithSignedUrl('acp', path, file);
      const url = await FilesApi.getPublicUrl('acp', storagePath);
      setAvatarUrl(url);
      await ProfileApi.updateMe({ avatar_url: url });
      toast.success('Profile photo updated');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploadingAvatar(false); }
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) { toast.error('All password fields are required'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      await ProfileApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and update your account details</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(fullName || 'S')}
              </AvatarFallback>
            </Avatar>
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow ${uploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}>
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-500">Student · {user?.student_id}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <Input label="Email" value={user?.email ?? ''} disabled helperText="Email cannot be changed" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Student ID" value={user?.student_id ?? '—'} disabled />
          <Input label="Center" value={CENTER_LABELS[user?.center ?? ''] ?? user?.center ?? '—'} disabled />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} isLoading={saving}>Save Changes</Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} />
        <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} helperText="At least 8 characters" />
        <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} />
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} isLoading={changingPassword} variant="outline">Change Password</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `StudentDashboard.tsx`**

Replace:
```tsx
const ProfilePage = () => <div className="p-8 font-bold text-xl">Profile Page (Porting in progress)</div>;
```
With:
```tsx
import StudentProfile from './student/StudentProfile';
```

Find `<Route path="profile" element={<ProfilePage />} />` and change to:
```tsx
<Route path="profile" element={<StudentProfile />} />
```

- [ ] **Step 3: Verify full build**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk/frontend && npx tsc --noEmit && npm run build 2>&1 | tail -10
```

Expected: TypeScript passes, build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/dinesh-s/Documents/Dinesh/acp.lk
git add frontend/src/features/dashboard/components/student/StudentProfile.tsx \
  frontend/src/features/dashboard/components/StudentDashboard.tsx
git commit -m "feat: implement StudentProfile page"
```

---

## Success Criteria

- [ ] No "Porting in progress" stubs remain in either portal
- [ ] `npx tsc --noEmit` passes in both `frontend/` and `backend/`
- [ ] `npm run build` in `frontend/` succeeds with no errors
- [ ] Teacher gallery: images upload and appear in the grid; toggle hides/shows on website; delete removes
- [ ] Teacher reviews: add/edit/delete works; rating and gender fields save correctly
- [ ] Teacher test results: upload rank list image, entry appears with year + exam name; delete works
- [ ] Teacher success: add/edit/delete stories; fields persist
- [ ] Teacher profile: name and phone save; avatar upload works; wrong current password returns error toast
- [ ] Student study packs: free packs appear as enrolled; paid packs show Purchase button; clicking View Materials opens the dialog with lesson list
- [ ] Student profile: name saves; avatar upload works; password change flow works end-to-end
