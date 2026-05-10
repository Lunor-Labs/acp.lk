import { SuccessRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
import { getFileService } from './fileService.js';
import type { NewSuccessStudent } from '../repositories/schema/index.js';

function resolveImageUrl(imagePath: string | null | undefined): string | null | undefined {
  if (!imagePath || imagePath.startsWith('http')) return imagePath;
  // Old system stored just the filename under images/success/
  // New system stores the full path like success/timestamp_file.jpg
  const storagePath = imagePath.includes('/') ? imagePath : `images/success/${imagePath}`;
  return getFileService().getPublicUrl('acp', storagePath);
}

class SuccessService {
  private repo: SuccessRepository;
  constructor() { this.repo = new SuccessRepository(getDb()); }

  async getAll() {
    const stories = await this.repo.getAll();
    return stories.map(s => ({
      ...s,
      image_path: resolveImageUrl(s.image_path),
    }));
  }

  async create(data: Omit<NewSuccessStudent, 'id'>) {
    return this.repo.create({ id: crypto.randomUUID(), ...data });
  }

  async update(id: string, data: Partial<NewSuccessStudent>) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Story not found');
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw AppError.notFound('Story not found');
    await this.repo.delete(id);
  }
}

let _instance: SuccessService;
export function getSuccessService() {
  if (!_instance) _instance = new SuccessService();
  return _instance;
}
