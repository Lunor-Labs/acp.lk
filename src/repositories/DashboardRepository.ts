import { supabase } from '../lib/supabase';

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

/**
 * Dashboard Repository
 *
 * Provides all data-access operations needed by the Teacher Dashboard.
 * Uses the Supabase client directly for cross-table aggregate queries.
 */
export class DashboardRepository {

    /** Resolve class IDs belonging to a teacher (used as sub-filter) */
    private async getClassIds(teacherId: string): Promise<string[]> {
        const { data } = await supabase
            .from('classes')
            .select('id')
            .eq('teacher_id', teacherId);
        return (data ?? []).map((c: { id: string }) => c.id);
    }

    /**
     * Get full dashboard statistics for a teacher.
     *
     * - totalPlatformStudents  → all profiles with role = 'student'
     * - totalEnrolledStudents  → unique active enrollments in this teacher's classes
     * - newStudentsThisMonth   → enrollments created this calendar month
     * - totalRevenue           → sum of all fee_payments for this teacher
     * - monthlyRevenue         → sum of fee_payments this calendar month
     * - totalClasses / activeClasses → class counts
     */
    async getStats(teacherId: string): Promise<DashboardStats> {
        const classIds = await this.getClassIds(teacherId);

        // 1. Total students on the platform
        const { count: totalPlatformStudents } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student');

        // 2. Enrolled students (active enrollments in teacher's classes)
        let totalEnrolledStudents = 0;
        if (classIds.length > 0) {
            const { count } = await supabase
                .from('enrollments')
                .select('student_id', { count: 'exact', head: true })
                .eq('is_active', true)
                .in('class_id', classIds);
            totalEnrolledStudents = count ?? 0;
        }

        // 3. New enrollments this calendar month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        let newStudentsThisMonth = 0;
        if (classIds.length > 0) {
            const { count } = await supabase
                .from('enrollments')
                .select('student_id', { count: 'exact', head: true })
                .eq('is_active', true)
                .gte('enrolled_at', monthStart.toISOString())
                .in('class_id', classIds);
            newStudentsThisMonth = count ?? 0;
        }

        // 4. Revenue
        const { data: allFees } = await supabase
            .from('fee_payments')
            .select('amount')
            .eq('teacher_id', teacherId);

        const { data: monthlyFees } = await supabase
            .from('fee_payments')
            .select('amount')
            .eq('teacher_id', teacherId)
            .gte('payment_date', monthStart.toISOString().slice(0, 10));

        const totalRevenue = allFees?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
        const monthlyRevenue = monthlyFees?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

        // 5. Class counts
        const { count: totalClasses } = await supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        const { count: activeClasses } = await supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
            .eq('teacher_id', teacherId)
            .eq('is_active', true);

        return {
            totalPlatformStudents: totalPlatformStudents ?? 0,
            totalEnrolledStudents,
            newStudentsThisMonth,
            totalRevenue,
            monthlyRevenue,
            totalClasses: totalClasses ?? 0,
            activeClasses: activeClasses ?? 0,
        };
    }

    /**
     * Get student onboarding trend for the last N months.
     *
     * Returns per-month counts for:
     *   - platformStudents → new student profiles created that month
     *   - enrollments      → new enrollments in this teacher's classes that month
     */
    async getOnboardingTrend(teacherId: string, months = 8): Promise<StudentOnboardingDataPoint[]> {
        const classIds = await this.getClassIds(teacherId);

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (months - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // New platform students since startDate
        const { data: newStudentProfiles } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('role', 'student')
            .gte('created_at', startDate.toISOString());

        // New enrollments for this teacher's classes since startDate
        let newEnrollments: { enrolled_at: string }[] = [];
        if (classIds.length > 0) {
            const { data } = await supabase
                .from('enrollments')
                .select('enrolled_at')
                .eq('is_active', true)
                .gte('enrolled_at', startDate.toISOString())
                .in('class_id', classIds);
            newEnrollments = data ?? [];
        }

        // Bucket into months
        const studentCounts: Record<string, number> = {};
        const enrollmentCounts: Record<string, number> = {};

        newStudentProfiles?.forEach((p: { created_at: string }) => {
            const key = new Date(p.created_at).toISOString().slice(0, 7);
            studentCounts[key] = (studentCounts[key] ?? 0) + 1;
        });

        newEnrollments.forEach(e => {
            const key = new Date(e.enrolled_at).toISOString().slice(0, 7);
            enrollmentCounts[key] = (enrollmentCounts[key] ?? 0) + 1;
        });

        // Build ordered result for last N months
        const result: StudentOnboardingDataPoint[] = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            result.push({
                month: label,
                monthKey: key,
                platformStudents: studentCounts[key] ?? 0,
                enrollments: enrollmentCounts[key] ?? 0,
            });
        }

        return result;
    }
}

export const dashboardRepository = new DashboardRepository();
