import { eq, and, count as drizzleCount } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { teachers, Teacher, NewTeacher } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class TeacherRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findById(id: string): Promise<Teacher | null> {
    const result = await this.db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    return result[0] ?? null;
  }

  async findByProfileId(profileId: string): Promise<Teacher | null> {
    const result = await this.db
      .select()
      .from(teachers)
      .where(eq(teachers.profile_id, profileId))
      .limit(1);
    return result[0] ?? null;
  }

  async findVisible(): Promise<Teacher[]> {
    return this.db.select().from(teachers).where(eq(teachers.visible_on_landing, true));
  }

  async findAll(): Promise<Teacher[]> {
    return this.db.select().from(teachers);
  }

  async create(data: NewTeacher): Promise<Teacher> {
    const result = await this.db.insert(teachers).values(data).returning();
    if (!result[0]) throw new Error('Failed to create teacher');
    return result[0];
  }

  async update(id: string, data: Partial<NewTeacher>): Promise<Teacher> {
    const result = await this.db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
    if (!result[0]) throw new Error('Teacher not found');
    return result[0];
  }

  async toggleVisibility(teacherId: string, visible: boolean): Promise<void> {
    await this.db
      .update(teachers)
      .set({ visible_on_landing: visible })
      .where(eq(teachers.id, teacherId));
  }
}
