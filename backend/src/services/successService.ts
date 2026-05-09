import { SuccessRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
import type { NewSuccessStudent } from '../repositories/schema/index.js';

class SuccessService {
  private repo: SuccessRepository;
  constructor() { this.repo = new SuccessRepository(getDb()); }

  getAll() { return this.repo.getAll(); }

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
