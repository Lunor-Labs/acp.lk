import { eq, count, and, gte, inArray } from 'drizzle-orm';
import { profiles, enrollments, classes } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export interface DashboardStats {
  totalPlatformStudents: number;
  totalEnrolledStudents: number;
  newStudentsThisMonth: number;
  totalClasses: number;
  activeClasses: number;
}

export class DashboardRepository {
  constructor(private readonly db: DrizzleDb) {}

  private async getClassIds(teacherId: string): Promise<string[]> {
    const data = await this.db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.teacher_id, teacherId));
    return data.map(c => c.id);
  }

  async getStats(teacherId: string): Promise<DashboardStats> {
    const classIds = await this.getClassIds(teacherId);

    // Total platform students
    const totalPlatformStudentsRes = await this.db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.role, 'student'));
    const totalPlatformStudents = totalPlatformStudentsRes[0]?.count ?? 0;

    // Enrolled students (in teacher's classes)
    let totalEnrolledStudents = 0;
    if (classIds.length > 0) {
      const enrolls = await this.db
        .select({ count: count() })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.is_active, true),
            inArray(enrollments.class_id, classIds)
          )
        );
      totalEnrolledStudents = enrolls[0]?.count ?? 0;
    }

    // New enrollments this month
    let newStudentsThisMonth = 0;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (classIds.length > 0) {
      const newEnrolls = await this.db
        .select({ count: count() })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.is_active, true),
            gte(enrollments.enrolled_at, monthStart),
            inArray(enrollments.class_id, classIds)
          )
        );
      newStudentsThisMonth = newEnrolls[0]?.count ?? 0;
    }

    // Classes count
    const totalClassesRes = await this.db
      .select({ count: count() })
      .from(classes)
      .where(eq(classes.teacher_id, teacherId));
    const totalClasses = totalClassesRes[0]?.count ?? 0;

    const activeClassesRes = await this.db
      .select({ count: count() })
      .from(classes)
      .where(and(eq(classes.teacher_id, teacherId), eq(classes.is_active, true)));
    const activeClasses = activeClassesRes[0]?.count ?? 0;

    // Note: Revenue is omitted as fee_payments table wasn't implemented locally
    // but the logic here handles counts cleanly with Drizzle.

    return {
      totalPlatformStudents,
      totalEnrolledStudents,
      newStudentsThisMonth,
      totalClasses,
      activeClasses,
    };
  }
}
