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
