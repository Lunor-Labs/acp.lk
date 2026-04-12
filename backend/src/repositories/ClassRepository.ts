import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { classes, Class, NewClass } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class ClassRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findAll(): Promise<Class[]> {
    return this.db.select().from(classes).orderBy(desc(classes.created_at));
  }

  async findById(id: string): Promise<Class | null> {
    const result = await this.db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return result[0] ?? null;
  }

  async findByTeacherId(teacherId: string): Promise<Class[]> {
    return this.db
      .select()
      .from(classes)
      .where(eq(classes.teacher_id, teacherId))
      .orderBy(desc(classes.created_at));
  }

  async findActiveClasses(): Promise<Class[]> {
    return this.db.select().from(classes).where(eq(classes.is_active, true));
  }

  async findActiveByTeacherId(teacherId: string): Promise<Class[]> {
    return this.db
      .select()
      .from(classes)
      .where(and(eq(classes.teacher_id, teacherId), eq(classes.is_active, true)))
      .orderBy(desc(classes.created_at));
  }

  async create(data: NewClass): Promise<Class> {
    const result = await this.db.insert(classes).values(data).returning();
    if (!result[0]) throw new Error('Failed to create class');
    return result[0];
  }

  async update(id: string, data: Partial<NewClass>): Promise<Class> {
    const result = await this.db
      .update(classes)
      .set(data)
      .where(eq(classes.id, id))
      .returning();
    if (!result[0]) throw new Error('Class not found');
    return result[0];
  }

  async toggleActive(classId: string, isActive: boolean): Promise<void> {
    await this.db
      .update(classes)
      .set({ is_active: isActive })
      .where(eq(classes.id, classId));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(classes).where(eq(classes.id, id));
  }
}
