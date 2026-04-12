import { eq, and, lte, gte, isNotNull, desc, asc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { exams, examQuestions, examAttempts, Exam, NewExam, ExamQuestion, NewExamQuestion, ExamAttempt, NewExamAttempt } from './schema/index.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';

export class ExamRepository extends BaseRepository {
  constructor(db: DrizzleDb) {
    super(db);
  }

  async findById(id: string): Promise<Exam | null> {
    const result = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0] ?? null;
  }

  async findByTeacherId(teacherId: string): Promise<Exam[]> {
    return this.db
      .select()
      .from(exams)
      .where(eq(exams.teacher_id, teacherId))
      .orderBy(desc(exams.created_at));
  }

  async findByClassId(classId: string): Promise<Exam[]> {
    return this.db
      .select()
      .from(exams)
      .where(eq(exams.class_id, classId))
      .orderBy(desc(exams.start_time));
  }

  async findUpcoming(): Promise<Exam[]> {
    return this.db
      .select()
      .from(exams)
      .where(gte(exams.start_time, new Date()))
      .orderBy(asc(exams.start_time));
  }

  async create(data: NewExam): Promise<Exam> {
    const result = await this.db.insert(exams).values(data).returning();
    if (!result[0]) throw new Error('Failed to create exam');
    return result[0];
  }

  async update(id: string, data: Partial<NewExam>): Promise<Exam> {
    const result = await this.db.update(exams).set(data).where(eq(exams.id, id)).returning();
    if (!result[0]) throw new Error('Exam not found');
    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(exams).where(eq(exams.id, id));
  }

  // ── Questions ────────────────────────────────────────────────────────────

  async getQuestions(examId: string): Promise<ExamQuestion[]> {
    return this.db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.exam_id, examId))
      .orderBy(asc(examQuestions.question_number));
  }

  async createQuestions(questions: NewExamQuestion[]): Promise<ExamQuestion[]> {
    if (questions.length === 0) return [];
    return this.db.insert(examQuestions).values(questions).returning();
  }

  async createWithQuestions(examData: NewExam, questions: Omit<NewExamQuestion, 'exam_id'>[]): Promise<Exam> {
    const exam = await this.create(examData);
    if (questions.length > 0) {
      await this.createQuestions(questions.map(q => ({ ...q, exam_id: exam.id })));
    }
    return exam;
  }

  // ── Attempts ─────────────────────────────────────────────────────────────

  async getStudentAttempts(studentId: string, examId: string): Promise<ExamAttempt[]> {
    return this.db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.student_id, studentId), eq(examAttempts.exam_id, examId)))
      .orderBy(desc(examAttempts.started_at));
  }

  async getExamAttempts(examId: string): Promise<ExamAttempt[]> {
    return this.db
      .select()
      .from(examAttempts)
      .where(and(eq(examAttempts.exam_id, examId), isNotNull(examAttempts.submitted_at)))
      .orderBy(desc(examAttempts.score));
  }

  async createAttempt(data: NewExamAttempt): Promise<ExamAttempt> {
    const result = await this.db.insert(examAttempts).values(data).returning();
    if (!result[0]) throw new Error('Failed to create attempt');
    return result[0];
  }

  async updateAttempt(id: string, data: Partial<NewExamAttempt>): Promise<ExamAttempt> {
    const result = await this.db
      .update(examAttempts)
      .set(data)
      .where(eq(examAttempts.id, id))
      .returning();
    if (!result[0]) throw new Error('Attempt not found');
    return result[0];
  }
}
