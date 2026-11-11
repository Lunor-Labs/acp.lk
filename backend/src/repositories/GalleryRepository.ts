import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { galleryImages, GalleryImage, NewGalleryImage } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class GalleryRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findById(id: string): Promise<GalleryImage | null> {
    const result = await this.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async getActiveImages(): Promise<GalleryImage[]> {
    return this.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.is_active, true))
      .orderBy(galleryImages.display_order);
  }

  async getByTeacherId(teacherId: string): Promise<GalleryImage[]> {
    return this.db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.teacher_id, teacherId))
      .orderBy(galleryImages.display_order);
  }

  async create(data: NewGalleryImage): Promise<GalleryImage> {
    const result = await this.db.insert(galleryImages).values(data).returning();
    if (!result[0]) throw new Error('Failed to create gallery image record');
    return result[0];
  }

  async update(id: string, data: Partial<NewGalleryImage>): Promise<GalleryImage> {
    const result = await this.db
      .update(galleryImages)
      .set({ ...data, updated_at: new Date() })
      .where(eq(galleryImages.id, id))
      .returning();
    if (!result[0]) throw new Error('Failed to update gallery image');
    return result[0];
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.db
      .update(galleryImages)
      .set({ is_active: isActive, updated_at: new Date() })
      .where(eq(galleryImages.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(galleryImages).where(eq(galleryImages.id, id));
  }
}
