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
