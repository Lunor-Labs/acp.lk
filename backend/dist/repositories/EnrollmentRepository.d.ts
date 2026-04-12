import { BaseRepository } from './BaseRepository.js';
import { Enrollment } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export declare class EnrollmentRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findByStudentId(studentId: string): Promise<Enrollment[]>;
    findByClassId(classId: string): Promise<Enrollment[]>;
    isEnrolled(studentId: string, classId: string): Promise<boolean>;
    enroll(studentId: string, classId: string): Promise<Enrollment>;
    unenroll(studentId: string, classId: string): Promise<void>;
    getCountByClassId(classId: string): Promise<number>;
    getNewEnrollmentsAfter(classIds: string[], after: Date): Promise<Enrollment[]>;
}
//# sourceMappingURL=EnrollmentRepository.d.ts.map