import { StudyPackRepository } from '../repositories/index.js';
import { TeacherRepository } from '../repositories/index.js';
import type { NewStudyPack } from '../repositories/schema/studyPacks.js';
import { AppError } from '../utils/errors.js';

export class StudyPackService {
  private studyPackRepo: StudyPackRepository;
  private teacherRepo: TeacherRepository;

  constructor() {
    this.studyPackRepo = new StudyPackRepository();
    this.teacherRepo = new TeacherRepository();
  }

  async getTeacherStudyPacks(userId: string) {
    const teacher = await this.teacherRepo.findByProfileId(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher profile not found');
    }
    return this.studyPackRepo.findByTeacherId(teacher.id);
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

    return this.studyPackRepo.update(packId, data);
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
