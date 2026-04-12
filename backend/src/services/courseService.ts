import { ClassRepository } from '../repositories/ClassRepository.js';
import crypto from 'crypto';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';

export class CourseService {
  private classRepo: ClassRepository;

  constructor() {
    this.classRepo = new ClassRepository(getDb());
  }

  /**
   * List all active courses
   */
  async listActiveCourses() {
    return this.classRepo.findActiveClasses();
  }

  /**
   * List courses by teacher
   */
  async listCoursesByTeacher(teacherId: string, onlyActive = true) {
    if (onlyActive) {
      return this.classRepo.findActiveByTeacherId(teacherId);
    }
    return this.classRepo.findByTeacherId(teacherId);
  }

  /**
   * Get a specific course
   */
  async getCourse(classId: string) {
    const course = await this.classRepo.findById(classId);
    if (!course) {
      throw AppError.notFound('Class not found');
    }
    return course;
  }

  /**
   * Create a new course
   */
  async createCourse(data: Omit<Parameters<ClassRepository['create']>[0], 'id'>) {
    const id = crypto.randomUUID();
    return this.classRepo.create({ ...data, id });
  }

  /**
   * Update course details
   */
  async updateCourse(classId: string, updates: Parameters<ClassRepository['update']>[1]) {
    return this.classRepo.update(classId, updates);
  }

  /**
   * Soft delete/deactivate a course
   */
  async deactivateCourse(classId: string) {
    return this.classRepo.toggleActive(classId, false);
  }
}
