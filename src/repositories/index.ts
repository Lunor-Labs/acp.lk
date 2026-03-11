/**
 * Repository Index
 * 
 * Central export point for all repositories.
 * Import repositories from here for consistency.
 */

export { BaseRepository } from './BaseRepository';
export { ClassRepository } from './ClassRepository';
export { EnrollmentRepository } from './EnrollmentRepository';
export { ExamRepository } from './ExamRepository';
export { TeacherRepository } from './TeacherRepository';
export { ProfileRepository } from './ProfileRepository';
export { SuccessRepository, successRepository } from './SuccessRepository';

// Export types
export type { Class } from './ClassRepository';
export type { Enrollment, EnrollmentWithDetails } from './EnrollmentRepository';
export type { Exam, ExamQuestion, ExamAttempt } from './ExamRepository';
export type { Teacher, TeacherWithProfile } from './TeacherRepository';
export type { Profile, UserRole, ClassCenter } from './ProfileRepository';
export type { FormattedSuccessStudent } from './SuccessRepository';
