import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export interface Class {
    id: string;
    teacher_id: string;
    title: string;
    description: string;
    subject: string;
    schedule?: string;
    zoom_link?: string;
    price: number;
    is_free: boolean;
    is_active: boolean;
    materials: any[];
    weeks?: any[]; // Array of weekly subclasses
    next_session_date?: string;
    status?: string;
    created_at: string;
}

/**
 * Class Repository
 * Handles all database operations for classes
 */
export class ClassRepository extends BaseRepository<Class> {
    constructor() {
        super('classes');
    }

    /**
     * Find all classes for a specific teacher
     */
    async findByTeacherId(teacherId: string): Promise<Class[]> {
        const { data, error } = await db.from<Class>(this.tableName)
            .select()
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find all active classes
     */
    async findActiveClasses(): Promise<Class[]> {
        const { data, error } = await db.from<Class>(this.tableName)
            .select()
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find active classes by teacher
     */
    async findActiveByTeacherId(teacherId: string): Promise<Class[]> {
        const { data, error } = await db.from<Class>(this.tableName)
            .select()
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find classes by subject
     */
    async findBySubject(subject: string): Promise<Class[]> {
        const { data, error } = await db.from<Class>(this.tableName)
            .select()
            .eq('subject', subject)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Toggle class active status
     */
    async toggleActive(classId: string, isActive: boolean): Promise<void> {
        const { error } = await db.from<Class>(this.tableName)
            .update({ is_active: isActive })
            .eq('id', classId)
            .execute();

        if (error) throw error;
    }

    /**
     * Search classes by title or subject
     */
    async search(query: string): Promise<Class[]> {
        // Note: This is a simplified search. For production, consider full-text search
        const { data, error } = await db.from<Class>(this.tableName)
            .select()
            .execute();

        if (error) throw error;

        const lowerQuery = query.toLowerCase();
        return (data || []).filter(cls =>
            cls.title.toLowerCase().includes(lowerQuery) ||
            cls.subject.toLowerCase().includes(lowerQuery) ||
            cls.description?.toLowerCase().includes(lowerQuery)
        );
    }
}
