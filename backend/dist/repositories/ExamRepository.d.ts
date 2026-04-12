import { BaseRepository } from './BaseRepository.js';
import { Exam, NewExam, ExamQuestion, NewExamQuestion, ExamAttempt, NewExamAttempt } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
export declare class ExamRepository extends BaseRepository {
    constructor(db: DrizzleDb);
    findById(id: string): Promise<Exam | null>;
    findByTeacherId(teacherId: string): Promise<Exam[]>;
    findByClassId(classId: string): Promise<Exam[]>;
    findUpcoming(): Promise<Exam[]>;
    create(data: NewExam): Promise<Exam>;
    update(id: string, data: Partial<NewExam>): Promise<Exam>;
    delete(id: string): Promise<void>;
    getQuestions(examId: string): Promise<ExamQuestion[]>;
    createQuestions(questions: NewExamQuestion[]): Promise<ExamQuestion[]>;
    createWithQuestions(examData: NewExam, questions: Omit<NewExamQuestion, 'exam_id'>[]): Promise<Exam>;
    getStudentAttempts(studentId: string, examId: string): Promise<ExamAttempt[]>;
    getExamAttempts(examId: string): Promise<ExamAttempt[]>;
    createAttempt(data: NewExamAttempt): Promise<ExamAttempt>;
    updateAttempt(id: string, data: Partial<NewExamAttempt>): Promise<ExamAttempt>;
}
//# sourceMappingURL=ExamRepository.d.ts.map