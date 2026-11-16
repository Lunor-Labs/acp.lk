import { sql } from 'drizzle-orm';
import { StudyPackRepository } from '../repositories/index.js';
import { TeacherRepository } from '../repositories/index.js';
import type { NewStudyPack } from '../repositories/schema/studyPacks.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

export class StudyPackService {
  private studyPackRepo: StudyPackRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    const db = getDb();
    this.studyPackRepo = new StudyPackRepository(db);
    this.teacherRepo = new TeacherRepository(db);
  }

  private async getSalesCounts(): Promise<Map<string, number>> {
    const res: any = await getDb().execute(
      sql`SELECT study_pack_id, COUNT(*)::int AS sales FROM study_pack_purchases GROUP BY study_pack_id`
    );
    const rows: any[] = res.rows ?? res; // works for node-postgres and postgres-js
    return new Map(rows.map((r) => [String(r.study_pack_id), Number(r.sales)]));
  }

  async getTeacherStudyPacks(userId: string) {
    const teacher = await this.teacherRepo.findByProfileId(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher profile not found');
    }
    const packs = await this.studyPackRepo.findByTeacherId(teacher.id);
    const sales = await this.getSalesCounts();
    return packs.map((p) => ({ ...p, sales_count: sales.get(p.id) ?? 0 }));
  }

  async createStudyPack(userId: string, data: Omit<NewStudyPack, 'teacher_id' | 'id'>) {
    const teacher = await this.teacherRepo.findByProfileId(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher profile not found');
    }

    const newPack: NewStudyPack = {
      ...data,
      id: crypto.randomUUID(),
      teacher_id: teacher.id,
    };

    return this.studyPackRepo.create(newPack);
  }

  async updateStudyPack(userId: string, packId: string, data: Partial<NewStudyPack>) {
    const teacher = await this.teacherRepo.findByProfileId(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher profile not found');
    }

    const existing = await this.studyPackRepo.findById(packId);
    if (!existing) {
      throw AppError.notFound('Study pack not found');
    }
    if (existing.teacher_id !== teacher.id) {
      throw AppError.forbidden('Cannot modify a study pack you do not own');
    }

    // never let the client change ownership or id
    const { id: _id, teacher_id: _tid, ...safe } = data as any;
    return this.studyPackRepo.update(packId, safe);
  }

  async deleteStudyPack(userId: string, packId: string) {
    const teacher = await this.teacherRepo.findByProfileId(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher profile not found');
    }

    const existing = await this.studyPackRepo.findById(packId);
    if (!existing) {
      throw AppError.notFound('Study pack not found');
    }
    if (existing.teacher_id !== teacher.id) {
      throw AppError.forbidden('Cannot delete a study pack you do not own');
    }

    return this.studyPackRepo.delete(packId);
  }
}

let studyPackServiceInstance: StudyPackService;

export function getStudyPackService() {
  if (!studyPackServiceInstance) {
    studyPackServiceInstance = new StudyPackService();
  }
  return studyPackServiceInstance;
}