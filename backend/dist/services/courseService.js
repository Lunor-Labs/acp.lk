import { ClassRepository } from '../repositories/ClassRepository.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
export class CourseService {
    classRepo;
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
    async listCoursesByTeacher(teacherId, onlyActive = true) {
        if (onlyActive) {
            return this.classRepo.findActiveByTeacherId(teacherId);
        }
        return this.classRepo.findByTeacherId(teacherId);
    }
    /**
     * Get a specific course
     */
    async getCourse(classId) {
        const course = await this.classRepo.findById(classId);
        if (!course) {
            throw AppError.notFound('Class not found');
        }
        return course;
    }
    /**
     * Create a new course
     */
    async createCourse(data) {
        return this.classRepo.create(data);
    }
    /**
     * Update course details
     */
    async updateCourse(classId, updates) {
        return this.classRepo.update(classId, updates);
    }
    /**
     * Soft delete/deactivate a course
     */
    async deactivateCourse(classId) {
        return this.classRepo.toggleActive(classId, false);
    }
}
//# sourceMappingURL=courseService.js.map