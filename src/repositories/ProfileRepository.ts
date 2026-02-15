import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    phone: string;
    avatar_url: string;
    student_number?: number;
    created_at: string;
    updated_at: string;
}

/**
 * Profile Repository
 * Handles all database operations for user profiles
 */
export class ProfileRepository extends BaseRepository<Profile> {
    constructor() {
        super('profiles');
    }

    /**
     * Find profile by email
     */
    async findByEmail(email: string): Promise<Profile | null> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .eq('email', email)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Find all profiles by role
     */
    async findByRole(role: UserRole): Promise<Profile[]> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .eq('role', role)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find all active profiles
     */
    async findActive(): Promise<Profile[]> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find active profiles by role
     */
    async findActiveByRole(role: UserRole): Promise<Profile[]> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .eq('role', role)
            .eq('is_active', true)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Update profile role
     */
    async updateRole(profileId: string, role: UserRole): Promise<Profile> {
        return this.update(profileId, { role });
    }

    /**
     * Toggle profile active status
     */
    async toggleActive(profileId: string, isActive: boolean): Promise<void> {
        const { error } = await db.from<Profile>(this.tableName)
            .update({ is_active: isActive })
            .eq('id', profileId)
            .execute();

        if (error) throw error;
    }

    /**
     * Update profile avatar
     */
    async updateAvatar(profileId: string, avatarUrl: string): Promise<Profile> {
        return this.update(profileId, { avatar_url: avatarUrl });
    }

    /**
     * Search profiles by name or email
     */
    async search(query: string): Promise<Profile[]> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .execute();

        if (error) throw error;

        const lowerQuery = query.toLowerCase();
        return (data || []).filter(profile =>
            profile.full_name.toLowerCase().includes(lowerQuery) ||
            profile.email.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get profile count by role
     */
    async countByRole(role: UserRole): Promise<number> {
        const { count, error } = await db.from<Profile>(this.tableName)
            .select('*', { count: 'exact', head: true } as any)
            .eq('role', role)
            .execute();

        if (error) throw error;
        return count || 0;
    }
}
