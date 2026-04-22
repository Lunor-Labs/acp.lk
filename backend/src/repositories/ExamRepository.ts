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

  async updateQuestion(questionId: string, data: Partial<NewExamQuestion>): Promise<ExamQuestion> {
    const result = await this.db.update(examQuestions).set(data).where(eq(examQuestions.id, questionId)).returning();
    if (!result[0]) throw new Error('Question not found');
    return result[0];
  }

  async createQuestions(questions: NewExamQuestion[]): Promise<ExamQuestion[]> {
    if (questions.length === 0) return [];
    return this.db.insert(examQuestions).values(questions).returning();
  }

  async createWithQuestions(examData: NewExam, questions: Omit<NewExamQuestion, 'exam_id' | 'id'>[]): Promise<Exam> {
    return this.db.transaction(async (tx) => {
      const [exam] = await tx.insert(exams).values({
        ...examData,
        id: examData.id || crypto.randomUUID()
      }).returning();

      if (questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          ...q,
          id: crypto.randomUUID(),
          exam_id: exam.id
        }));
        await tx.insert(examQuestions).values(questionsToInsert);
      }

      return exam;
    });
  }

  async createWithPdf(examData: NewExam, pdfPath: string, answers: { question_no: number, correct_answer: number }[]): Promise<Exam> {
    return this.db.transaction(async (tx) => {
      const [exam] = await tx.insert(exams).values({
        ...examData,
        id: examData.id || crypto.randomUUID()
      }).returning();

      if (answers.length > 0) {
        const { pdfExams } = await import('./schema/other.js');
        const pdfAnswersToInsert = answers.map(a => ({
          ...a,
          id: crypto.randomUUID(),
          exam_id: exam.id,
          pdf_path: pdfPath
        }));
        await tx.insert(pdfExams).values(pdfAnswersToInsert);
      }

      return exam;
    });
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
