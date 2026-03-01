import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export type UserRole = 'admin' | 'teacher' | 'student';
export type ClassCenter = 'online' | 'riochem' | 'vision';

export const CENTER_CODES: Record<ClassCenter, string> = {
    online: '0',
    riochem: '1',
    vision: '2',
};

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    phone: string;
    avatar_url: string;
    student_id?: string;
    al_year?: number;
    center?: ClassCenter;
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
     * Find profile by student ID
     */
    async findByStudentId(studentId: string): Promise<Profile | null> {
        const { data, error } = await db.from<Profile>(this.tableName)
            .select()
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    /**
     * Generate a unique student ID in the format: YY-C-NNNNN
     */
    async generateStudentId(alYear: number, center: ClassCenter): Promise<string> {
        const yy = String(alYear).slice(-2);
        const c = CENTER_CODES[center];
        const prefix = `${yy}-${c}-`;

        // Get count of existing students with this prefix
        // We select just the ID and check length to stay compliant with our Repository pattern
        const { data, error } = await db.from<Profile>(this.tableName)
            .select('id')
            .eq('al_year', alYear as any)
            .eq('center', center as any)
            .execute();

        if (error) throw error;

        const count = (data ?? []).length;
        const seq = String(count + 1).padStart(5, '0');
        return `${prefix}${seq}`;
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
        const { data, error } = await db.from<Profile>(this.tableName)
            .select('id')
            .eq('role', role)
            .execute();

        if (error) throw error;
        return (data ?? []).length;
    }
}
