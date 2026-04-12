import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { galleryImages } from './schema/index.js';
export class GalleryRepository extends BaseRepository {
    constructor(db) {
        super(db);
    }
    async findById(id) {
        const result = await this.db
            .select()
            .from(galleryImages)
            .where(eq(galleryImages.id, id))
            .limit(1);
        return result[0] ?? null;
    }
    async getActiveImages() {
        return this.db
            .select()
            .from(galleryImages)
            .where(eq(galleryImages.is_active, true))
            .orderBy(galleryImages.display_order);
    }
    async getByTeacherId(teacherId) {
        return this.db
            .select()
            .from(galleryImages)
            .where(eq(galleryImages.teacher_id, teacherId))
            .orderBy(galleryImages.display_order);
    }
    async create(data) {
        const result = await this.db.insert(galleryImages).values(data).returning();
        if (!result[0])
            throw new Error('Failed to create gallery image record');
        return result[0];
    }
    async update(id, data) {
        const result = await this.db
            .update(galleryImages)
            .set({ ...data, updated_at: new Date() })
            .where(eq(galleryImages.id, id))
            .returning();
        if (!result[0])
            throw new Error('Failed to update gallery image');
        return result[0];
    }
    async toggleActive(id, isActive) {
        await this.db
            .update(galleryImages)
            .set({ is_active: isActive, updated_at: new Date() })
            .where(eq(galleryImages.id, id));
    }
    async delete(id) {
        await this.db.delete(galleryImages).where(eq(galleryImages.id, id));
    }
}
//# sourceMappingURL=GalleryRepository.js.map