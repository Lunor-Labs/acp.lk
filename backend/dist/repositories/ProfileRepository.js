import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { profiles } from './schema/index.js';
export const CENTER_CODES = {
    online: '0',
    riochem: '1',
    vision: '2',
};
export class ProfileRepository extends BaseRepository {
    constructor(db) {
        super(db);
    }
    async findById(id) {
        const result = await this.db
            .select()
            .from(profiles)
            .where(eq(profiles.id, id))
            .limit(1);
        return result[0] ?? null;
    }
    async findByEmail(email) {
        const result = await this.db
            .select()
            .from(profiles)
            .where(eq(profiles.email, email))
            .limit(1);
        return result[0] ?? null;
    }
    async findByStudentId(studentId) {
        const result = await this.db
            .select()
            .from(profiles)
            .where(eq(profiles.student_id, studentId))
            .limit(1);
        return result[0] ?? null;
    }
    async findByRole(role) {
        return this.db
            .select()
            .from(profiles)
            .where(eq(profiles.role, role));
    }
    async findActiveByRole(role) {
        return this.db
            .select()
            .from(profiles)
            .where(and(eq(profiles.role, role), eq(profiles.is_active, true)));
    }
    async create(data) {
        const result = await this.db
            .insert(profiles)
            .values(data)
            .returning();
        if (!result[0])
            throw new Error('Failed to create profile');
        return result[0];
    }
    async update(id, data) {
        const result = await this.db
            .update(profiles)
            .set({ ...data, updated_at: new Date() })
            .where(eq(profiles.id, id))
            .returning();
        if (!result[0])
            throw new Error('Profile not found');
        return result[0];
    }
    async toggleActive(id, isActive) {
        await this.db
            .update(profiles)
            .set({ is_active: isActive, updated_at: new Date() })
            .where(eq(profiles.id, id));
    }
    async countByRole(role) {
        const result = await this.db
            .select()
            .from(profiles)
            .where(eq(profiles.role, role));
        return result.length;
    }
    async generateStudentId(alYear, center) {
        const yy = String(alYear).slice(-2);
        const c = CENTER_CODES[center];
        const prefix = `${yy}${c}`;
        const existing = await this.db
            .select({ id: profiles.id })
            .from(profiles)
            .where(and(eq(profiles.al_year, alYear), eq(profiles.center, center)));
        const count = existing.length;
        const seq = String(count + 1).padStart(4, '0');
        return `${prefix}${seq}`;
    }
}
//# sourceMappingURL=ProfileRepository.js.map