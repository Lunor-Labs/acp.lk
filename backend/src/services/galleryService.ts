import { GalleryRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class GalleryService {
  private galleryRepo: GalleryRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.galleryRepo = new GalleryRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getImages(userId: string) {
    return this.galleryRepo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async addImage(userId: string, data: { storage_path: string; public_url?: string; caption?: string }) {
    const teacherId = await this.resolveTeacherId(userId);
    const existing = await this.galleryRepo.getByTeacherId(teacherId);
    return this.galleryRepo.create({
      id: crypto.randomUUID(),
      teacher_id: teacherId,
      storage_path: data.storage_path,
      public_url: data.public_url,
      caption: data.caption,
      display_order: existing.length,
    });
  }

  async deleteImage(userId: string, imageId: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const img = await this.galleryRepo.findById(imageId);
    if (!img) throw AppError.notFound('Image not found');
    if (img.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete image you do not own');
    await this.galleryRepo.delete(imageId);
  }

  async toggleActive(userId: string, imageId: string, isActive: boolean) {
    const teacherId = await this.resolveTeacherId(userId);
    const img = await this.galleryRepo.findById(imageId);
    if (!img) throw AppError.notFound('Image not found');
    if (img.teacher_id !== teacherId) throw AppError.forbidden('Cannot modify image you do not own');
    await this.galleryRepo.toggleActive(imageId, isActive);
  }
}

let _instance: GalleryService;
export function getGalleryService() {
  if (!_instance) _instance = new GalleryService();
  return _instance;
}
