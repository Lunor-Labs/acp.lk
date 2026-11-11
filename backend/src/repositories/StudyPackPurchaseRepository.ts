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
