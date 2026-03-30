import { db } from '../lib/database';

/**
 * Base Repository
 * 
 * Provides common CRUD operations for all repositories.
 * Extend this class to create domain-specific repositories.
 */
export abstract class BaseRepository<T> {
    constructor(protected tableName: string) { }

    /**
     * Find all records in the table
     */
    async findAll(): Promise<T[]> {
        const { data, error } = await db.from<T>(this.tableName).select().execute();
        if (error) throw error;
        return data || [];
    }

    /**
     * Find a single record by ID
     */
    async findById(id: string): Promise<T | null> {
        const { data, error } = await db.from<T>(this.tableName)
            .select()
            .eq('id' as keyof T, id)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    /**
     * Create a new record
     */
    async create(item: Partial<T>): Promise<T> {
        const { data, error } = await db.from<T>(this.tableName)
            .insert(item)
            .select()
            .single();
        if (error) throw error;
        if (!data) throw new Error('Failed to create record');
        return data;
    }

    /**
     * Create multiple records
     */
    async createMany(items: Partial<T>[]): Promise<T[]> {
        const { data, error } = await db.from<T>(this.tableName)
            .insert(items)
            .select()
            .execute();
        if (error) throw error;
        return data || [];
    }

    /**
     * Update a record by ID
     */
    async update(id: string, item: Partial<T>): Promise<T> {
        const { data, error } = await db.from<T>(this.tableName)
            .update(item)
            .eq('id' as keyof T, id)
            .select()
            .single();
        if (error) throw error;
        if (!data) throw new Error('Failed to update record');
        return data;
    }

    /**
     * Delete a record by ID
     */
    async delete(id: string): Promise<void> {
        const { error } = await db.from<T>(this.tableName)
            .delete()
            .eq('id' as keyof T, id)
            .execute();
        if (error) throw error;
    }

    /**
     * Count total records
     */
    async count(): Promise<number> {
        const { data, error, count } = await db.from<T>(this.tableName)
            .select()
            .execute();
        if (error) throw error;
        return count || data?.length || 0;
    }
}
