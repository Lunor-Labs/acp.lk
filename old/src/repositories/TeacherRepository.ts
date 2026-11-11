import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export interface Teacher {
    id: string;
    profile_id: string;
    subjects: string[];
    visible_on_landing: boolean;
    teacher_number: number;
    created_at: string;
}

export interface TeacherWithProfile extends Teacher {
    profile?: {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        avatar_url: string;
    };
}

/**
 * Teacher Repository
 * Handles all database operations for teachers
 */
export class TeacherRepository extends BaseRepository<Teacher> {
    constructor() {
        super('teachers');
    }

    /**
     * Find teacher by profile ID
     */
    async findByProfileId(profileId: string): Promise<Teacher | null> {
        const { data, error } = await db.from<Teacher>(this.tableName)
            .select()
            .eq('profile_id', profileId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Find all visible teachers (for landing page)
     */
    async findVisible(): Promise<Teacher[]> {
        const { data, error } = await db.from<Teacher>(this.tableName)
            .select()
            .eq('visible_on_landing', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find teachers by subject
     */
    async findBySubject(subject: string): Promise<Teacher[]> {
        // Note: This requires array contains operation
        // For Supabase, we can use the contains operator
        const { data, error } = await db.from<Teacher>(this.tableName)
            .select()
            .execute();

        if (error) throw error;

        // Filter in memory for now (can be optimized with database-specific queries)
        return (data || []).filter(teacher =>
            teacher.subjects.includes(subject)
        );
    }

    /**
     * Update teacher subjects
     */
    async updateSubjects(teacherId: string, subjects: string[]): Promise<Teacher> {
        return this.update(teacherId, { subjects });
    }

    /**
     * Toggle visibility on landing page
     */
    async toggleVisibility(teacherId: string, visible: boolean): Promise<void> {
        const { error } = await db.from<Teacher>(this.tableName)
            .update({ visible_on_landing: visible })
            .eq('id', teacherId)
            .execute();

        if (error) throw error;
    }

    /**
     * Get teacher statistics
     */
    async getStatistics(teacherId: string): Promise<{
        totalClasses: number;
        activeClasses: number;
        totalStudents: number;
        totalExams: number;
    }> {
        // Get total classes
        const { count: totalClasses } = await db.from('classes')
            .select('*', { count: 'exact', head: true } as any)
            .eq('teacher_id', teacherId)
            .execute();

        // Get active classes
        const { count: activeClasses } = await db.from('classes')
            .select('*', { count: 'exact', head: true } as any)
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .execute();

        // Get total exams
        const { count: totalExams } = await db.from('exams')
            .select('*', { count: 'exact', head: true } as any)
            .eq('teacher_id', teacherId)
            .execute();

        // Get total students (unique enrollments)
        const { data: classes } = await db.from('classes')
            .select('id')
            .eq('teacher_id', teacherId)
            .execute();

        let totalStudents = 0;
        if (classes && classes.length > 0) {
            const classIds = classes.map(c => c.id);
            const { count } = await db.from('enrollments')
                .select('*', { count: 'exact', head: true } as any)
                .in('class_id', classIds)
                .eq('is_active', true)
                .execute();
            totalStudents = count || 0;
        }

        return {
            totalClasses: totalClasses || 0,
            activeClasses: activeClasses || 0,
            totalStudents,
            totalExams: totalExams || 0
        };
    }
}
