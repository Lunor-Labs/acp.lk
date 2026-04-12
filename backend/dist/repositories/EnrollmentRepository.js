import { eq, and, gte } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { enrollments } from './schema/index.js';
import crypto from 'crypto';
export class EnrollmentRepository extends BaseRepository {
    constructor(db) {
        super(db);
    }
    async findByStudentId(studentId) {
        return this.db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.student_id, studentId), eq(enrollments.is_active, true)));
    }
    async findByClassId(classId) {
        return this.db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.class_id, classId), eq(enrollments.is_active, true)));
    }
    async isEnrolled(studentId, classId) {
        const result = await this.db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.student_id, studentId), eq(enrollments.class_id, classId), eq(enrollments.is_active, true)))
            .limit(1);
        return result.length > 0;
    }
    async enroll(studentId, classId) {
        const result = await this.db
            .insert(enrollments)
            .values({ id: crypto.randomUUID(), student_id: studentId, class_id: classId, is_active: true })
            .returning();
        if (!result[0])
            throw new Error('Failed to enroll student');
        return result[0];
    }
    async unenroll(studentId, classId) {
        await this.db
            .update(enrollments)
            .set({ is_active: false })
            .where(and(eq(enrollments.student_id, studentId), eq(enrollments.class_id, classId)));
    }
    async getCountByClassId(classId) {
        const result = await this.db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.class_id, classId), eq(enrollments.is_active, true)));
        return result.length;
    }
    async getNewEnrollmentsAfter(classIds, after) {
        if (classIds.length === 0)
            return [];
        return this.db
            .select()
            .from(enrollments)
            .where(and(eq(enrollments.is_active, true), gte(enrollments.enrolled_at, after)));
    }
}
//# sourceMappingURL=EnrollmentRepository.js.map