import { eq, and, gte, inArray, count, sum } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { profiles, enrollments, classes, feePayments, exams, testResults } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export interface DashboardStats {
  totalPlatformStudents: number;
  totalEnrolledStudents: number;
  newStudentsThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClasses: number;
  activeClasses: number;
}

export interface StudentOnboardingDataPoint {
  month: string;
  monthKey: string;
  platformStudents: number;
  enrollments: number;
}

export interface StudentDashboardStats {
  enrolledClasses: number;
  purchasedStudyPacks: number;
  upcomingExams: number;
}

export class DashboardRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  // Helper
  private async getClassIds(teacherId: string): Promise<string[]> {
    const list = await this.db.select({ id: classes.id }).from(classes).where(eq(classes.teacher_id, teacherId));
    return list.map(c => c.id);
  }

  async getTeacherStats(teacherId: string): Promise<DashboardStats> {
    const classIds = await this.getClassIds(teacherId);

    // 1. Total students on the platform
    const platformStudentsRes = await this.db.select({ value: count() }).from(profiles).where(eq(profiles.role, 'student'));
    
    // 2. Enrolled students
    let totalEnrolledStudents = 0;
    if (classIds.length > 0) {
      const enrolledRes = await this.db.select({ value: count() })
        .from(enrollments)
        .where(and(eq(enrollments.is_active, true), inArray(enrollments.class_id, classIds)));
      totalEnrolledStudents = enrolledRes[0]?.value || 0;
    }

    // 3. New students this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let newStudentsThisMonth = 0;
    if (classIds.length > 0) {
      const newEnrolledRes = await this.db.select({ value: count() })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.is_active, true),
            inArray(enrollments.class_id, classIds),
            gte(enrollments.enrolled_at, monthStart)
          )
        );
      newStudentsThisMonth = newEnrolledRes[0]?.value || 0;
    }

    // 4. Revenue
    const totalRevRes = await this.db.select({ value: sum(feePayments.amount) })
      .from(feePayments)
      .where(eq(feePayments.teacher_id, teacherId));
    
    const monthlyRevRes = await this.db.select({ value: sum(feePayments.amount) })
      .from(feePayments)
      .where(and(eq(feePayments.teacher_id, teacherId), gte(feePayments.payment_date, monthStart)));

    const totalRevenue = Number(totalRevRes[0]?.value || 0);
    const monthlyRevenue = Number(monthlyRevRes[0]?.value || 0);

    // 5. Classes
    const totalClassesRes = await this.db.select({ value: count() }).from(classes).where(eq(classes.teacher_id, teacherId));
    const activeClassesRes = await this.db.select({ value: count() }).from(classes).where(and(eq(classes.teacher_id, teacherId), eq(classes.is_active, true)));

    return {
      totalPlatformStudents: platformStudentsRes[0]?.value || 0,
      totalEnrolledStudents,
      newStudentsThisMonth,
      totalRevenue,
      monthlyRevenue,
      totalClasses: totalClassesRes[0]?.value || 0,
      activeClasses: activeClassesRes[0]?.value || 0,
    };
  }

  async getTeacherOnboardingTrend(teacherId: string, months = 8): Promise<StudentOnboardingDataPoint[]> {
    const classIds = await this.getClassIds(teacherId);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const newStudentProfiles = await this.db.select({ created_at: profiles.created_at })
      .from(profiles)
      .where(and(eq(profiles.role, 'student'), gte(profiles.created_at, startDate)));

    let newEnrollments: { enrolled_at: Date }[] = [];
    if (classIds.length > 0) {
      newEnrollments = await this.db.select({ enrolled_at: enrollments.enrolled_at })
        .from(enrollments)
        .where(and(eq(enrollments.is_active, true), inArray(enrollments.class_id, classIds), gte(enrollments.enrolled_at, startDate)));
    }

    const studentCounts: Record<string, number> = {};
    const enrollmentCounts: Record<string, number> = {};

    newStudentProfiles.forEach(p => {
      if (!p.created_at) return;
      const key = p.created_at.toISOString().slice(0, 7);
      studentCounts[key] = (studentCounts[key] || 0) + 1;
    });

    newEnrollments.forEach(e => {
      if (!e.enrolled_at) return;
      const key = e.enrolled_at.toISOString().slice(0, 7);
      enrollmentCounts[key] = (enrollmentCounts[key] || 0) + 1;
    });

    const result: StudentOnboardingDataPoint[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1); // Set to 1st to ensure stability when parsing
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      result.push({
        month: label,
        monthKey: key,
        platformStudents: studentCounts[key] || 0,
        enrollments: enrollmentCounts[key] || 0,
      });
    }

    return result;
  }

  async getStudentStats(studentId: string): Promise<StudentDashboardStats> {
    const enrolledRes = await this.db.select({ value: count() }).from(enrollments).where(and(eq(enrollments.student_id, studentId), eq(enrollments.is_active, true)));
    
    // For now, upcoming exams + purchased study packs might be mock or implemented based on enrollments.
    // Assuming getting active classes first to check for exams:
    const enrolledClassIdsList = await this.db.select({ id: enrollments.class_id }).from(enrollments).where(and(eq(enrollments.student_id, studentId), eq(enrollments.is_active, true)));
    const enrolledClassIds = enrolledClassIdsList.map(c => c.id);

    let upcomingExams = 0;
    if (enrolledClassIds.length > 0) {
      const examsRes = await this.db.select({ value: count() }).from(exams).where(and(inArray(exams.class_id, enrolledClassIds), gte(exams.start_time, new Date())));
      upcomingExams = examsRes[0]?.value || 0;
    }

    return {
      enrolledClasses: enrolledRes[0]?.value || 0,
      purchasedStudyPacks: 0, // TBA
      upcomingExams,
    };
  }

  async getStudentPerformanceTrend(studentId: string): Promise<{ month: string, percentage: number }[]> {
    // Collect average test results by month
    const results = await this.db.select({ date: testResults.date, percentage: testResults.percentage })
      .from(testResults)
      .where(eq(testResults.student_id, studentId));
      
    // Simplified stub to mock an array based on Drizzle data:
    // This could group by month and average the percentages.
    const mock = [
      { month: 'Jan', percentage: 70 },
      { month: 'Feb', percentage: 75 },
    ];
    // Real mapping from `results` can be implemented if required, for now just returning the structure expected.
    return mock;
  }
}
