import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { ClassRepository } from '../repositories/ClassRepository.js';
import { AppError } from '../utils/errors.js';
import { getDb } from '../providers/db/drizzle.js';
export class EnrollmentService {
    enrollmentRepo;
    classRepo;
    constructor() {
        this.enrollmentRepo = new EnrollmentRepository(getDb());
        this.classRepo = new ClassRepository(getDb());
    }
    /**
     * Get all enrollments for a specific student
     */
    async getStudentEnrollments(studentId) {
        const enrollments = await this.enrollmentRepo.findByStudentId(studentId);
        // In a real GraphQL or nested Drizzle setup we'd join this dynamically.
        // For now we can fetch the classes for these enrollments to return rich data.
        const enriched = await Promise.all(enrollments.map(async (e) => {
            const cls = await this.classRepo.findById(e.class_id);
            return {
                ...e,
                class: cls
            };
        }));
        return enriched;
    }
    /**
     * Enroll a student in a class
     */
    async enrollStudent(studentId, classId) {
        // 1. Verify class exists and is active
        const cls = await this.classRepo.findById(classId);
        if (!cls || !cls.is_active) {
            throw AppError.badRequest('Invalid or inactive class');
        }
        // 2. Check if already enrolled
        const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId);
        if (isEnrolled) {
            throw AppError.conflict('Already enrolled in this class');
        }
        // 3. Create enrollment
        return this.enrollmentRepo.enroll(studentId, classId);
    }
    /**
     * Remove enrollment
     */
    async unenrollStudent(studentId, classId) {
        await this.enrollmentRepo.unenroll(studentId, classId);
    }
}
//# sourceMappingURL=enrollmentService.js.map