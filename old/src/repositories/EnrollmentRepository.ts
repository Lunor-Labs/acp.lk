import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export interface Enrollment {
    id: string;
    student_id: string;
    class_id: string;
    is_active: boolean;
    enrolled_at: string;
}

export interface EnrollmentWithDetails extends Enrollment {
    student?: {
        id: string;
        full_name: string;
        email: string;
        student_id: string;
        student_number: number;
    };
    class?: {
        id: string;
        title: string;
        subject: string;
    };
}

/**
 * Enrollment Repository
 * Handles all database operations for student enrollments
 */
export class EnrollmentRepository extends BaseRepository<Enrollment> {
    constructor() {
        super('enrollments');
    }

    /**
     * Get enrollment count for a specific class
     */
    async getEnrollmentCount(classId: string): Promise<number> {
        const { count, error } = await db.from<Enrollment>(this.tableName)
            .select('*', { count: 'exact', head: true } as any)
            .eq('class_id', classId)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return count || 0;
    }

    /**
     * Find all enrollments for a student
     */
    async findByStudentId(studentId: string): Promise<Enrollment[]> {
        const { data, error } = await db.from<Enrollment>(this.tableName)
            .select()
            .eq('student_id', studentId)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find all enrollments for a class
     */
    async findByClassId(classId: string): Promise<Enrollment[]> {
        const { data, error } = await db.from<Enrollment>(this.tableName)
            .select()
            .eq('class_id', classId)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Check if a student is enrolled in a class
     */
    async isEnrolled(studentId: string, classId: string): Promise<boolean> {
        const { data, error } = await db.from<Enrollment>(this.tableName)
            .select()
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        return data !== null;
    }

    /**
     * Enroll a student in a class
     */
    async enroll(studentId: string, classId: string): Promise<Enrollment> {
        return this.create({
            student_id: studentId,
            class_id: classId,
            is_active: true
        });
    }

    /**
     * Unenroll a student from a class (soft delete)
     */
    async unenroll(studentId: string, classId: string): Promise<void> {
        const { error } = await db.from<Enrollment>(this.tableName)
            .update({ is_active: false })
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .execute();

        if (error) throw error;
    }

    /**
     * Get active enrollment count for a student
     */
    async getStudentEnrollmentCount(studentId: string): Promise<number> {
        const { count, error } = await db.from<Enrollment>(this.tableName)
            .select('*', { count: 'exact', head: true } as any)
            .eq('student_id', studentId)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return count || 0;
    }
}
