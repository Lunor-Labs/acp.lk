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
