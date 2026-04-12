import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { teachers } from './schema/index.js';
export class TeacherRepository extends BaseRepository {
    constructor(db) {
        super(db);
    }
    async findById(id) {
        const result = await this.db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
        return result[0] ?? null;
    }
    async findByProfileId(profileId) {
        const result = await this.db
            .select()
            .from(teachers)
            .where(eq(teachers.profile_id, profileId))
            .limit(1);
        return result[0] ?? null;
    }
    async findVisible() {
        return this.db.select().from(teachers).where(eq(teachers.visible_on_landing, true));
    }
    async findAll() {
        return this.db.select().from(teachers);
    }
    async create(data) {
        const result = await this.db.insert(teachers).values(data).returning();
        if (!result[0])
            throw new Error('Failed to create teacher');
        return result[0];
    }
    async update(id, data) {
        const result = await this.db.update(teachers).set(data).where(eq(teachers.id, id)).returning();
        if (!result[0])
            throw new Error('Teacher not found');
        return result[0];
    }
    async toggleVisibility(teacherId, visible) {
        await this.db
            .update(teachers)
            .set({ visible_on_landing: visible })
            .where(eq(teachers.id, teacherId));
    }
}
//# sourceMappingURL=TeacherRepository.js.map