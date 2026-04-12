import { eq, and, gte } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { enrollments, Enrollment, NewEnrollment } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class EnrollmentRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    return this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.student_id, studentId), eq(enrollments.is_active, true)));
  }

  async findByClassId(classId: string): Promise<Enrollment[]> {
    return this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.class_id, classId), eq(enrollments.is_active, true)));
  }

  async isEnrolled(studentId: string, classId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.student_id, studentId),
          eq(enrollments.class_id, classId),
          eq(enrollments.is_active, true)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  async enroll(studentId: string, classId: string): Promise<Enrollment> {
    const result = await this.db
      .insert(enrollments)
      .values({ student_id: studentId, class_id: classId, is_active: true })
      .returning();
    if (!result[0]) throw new Error('Failed to enroll student');
    return result[0];
  }

  async unenroll(studentId: string, classId: string): Promise<void> {
    await this.db
      .update(enrollments)
      .set({ is_active: false })
      .where(
        and(eq(enrollments.student_id, studentId), eq(enrollments.class_id, classId))
      );
  }

  async getCountByClassId(classId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.class_id, classId), eq(enrollments.is_active, true)));
    return result.length;
  }

  async getNewEnrollmentsAfter(classIds: string[], after: Date): Promise<Enrollment[]> {
    if (classIds.length === 0) return [];
    return this.db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.is_active, true),
          gte(enrollments.enrolled_at, after)
        )
      );
  }
}
