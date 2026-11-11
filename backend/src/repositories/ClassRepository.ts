import { eq, and, desc, count, sql } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { classes, Class, NewClass, enrollments } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export type ClassWithStudentCount = Class & { student_count: number };

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

  async findByTeacherIdWithCounts(teacherId: string, onlyActive = false): Promise<ClassWithStudentCount[]> {
    const condition = onlyActive
      ? and(eq(classes.teacher_id, teacherId), eq(classes.is_active, true))
      : eq(classes.teacher_id, teacherId);

    const rows = await this.db
      .select({
        ...Object.fromEntries(Object.keys(classes).map(k => [k, (classes as any)[k]])),
        student_count: sql<number>`COALESCE(COUNT(${enrollments.id}) FILTER (WHERE ${enrollments.is_active}), 0)::int`,
      })
      .from(classes)
      .leftJoin(enrollments, eq(enrollments.class_id, classes.id))
      .where(condition)
      .groupBy(classes.id)
      .orderBy(desc(classes.created_at));

    return rows as ClassWithStudentCount[];
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
