import { RankListRepository, TeacherRepository } from '../repositories/index.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

class RankListService {
  private repo: RankListRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.repo = new RankListRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async resolveTeacherId(userId: string) {
    const t = await this.teacherRepo.findByProfileId(userId);
    if (!t) throw AppError.notFound('Teacher profile not found');
    return t.id;
  }

  async getAll(userId: string) {
    return this.repo.getByTeacherId(await this.resolveTeacherId(userId));
  }

  async create(userId: string, data: { year: number; exam_name: string; image_path: string; public_url?: string }) {
    const teacherId = await this.resolveTeacherId(userId);
    return this.repo.create({ id: crypto.randomUUID(), teacher_id: teacherId, ...data });
  }

  async delete(userId: string, id: string) {
    const teacherId = await this.resolveTeacherId(userId);
    const entry = await this.repo.findById(id);
    if (!entry) throw AppError.notFound('Rank list not found');
    if (entry.teacher_id !== teacherId) throw AppError.forbidden('Cannot delete entry you do not own');
    await this.repo.delete(id);
  }
}

let _instance: RankListService;
export function getRankListService() {
  if (!_instance) _instance = new RankListService();
  return _instance;
}
