import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { studyPacks, type StudyPack, type NewStudyPack } from './schema/studyPacks.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class StudyPackRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findByTeacherId(teacherId: string): Promise<StudyPack[]> {
    return this.db
      .select()
      .from(studyPacks)
      .where(eq(studyPacks.teacher_id, teacherId))
      .orderBy(desc(studyPacks.created_at));
  }

  async findAllPublishedOrFree(): Promise<StudyPack[]> {
    return this.db
      .select()
      .from(studyPacks)
      .orderBy(desc(studyPacks.created_at));
  }

  async findById(id: string): Promise<StudyPack | null> {
    const result = await this.db.select().from(studyPacks).where(eq(studyPacks.id, id)).limit(1);
    return result[0] ?? null;
  }

  async create(data: NewStudyPack): Promise<StudyPack> {
    const result = await this.db.insert(studyPacks).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewStudyPack>): Promise<StudyPack | null> {
    const result = await this.db
      .update(studyPacks)
      .set({ ...data, updated_at: new Date() })
      .where(eq(studyPacks.id, id))
      .returning();
    return result[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(studyPacks).where(eq(studyPacks.id, id));
  }
}
