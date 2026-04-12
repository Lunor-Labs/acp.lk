import { eq, and, gte, isNotNull, desc, asc } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository.js';
import { exams, examQuestions, examAttempts } from './schema/index.js';
export class ExamRepository extends BaseRepository {
    constructor(db) {
        super(db);
    }
    async findById(id) {
        const result = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
        return result[0] ?? null;
    }
    async findByTeacherId(teacherId) {
        return this.db
            .select()
            .from(exams)
            .where(eq(exams.teacher_id, teacherId))
            .orderBy(desc(exams.created_at));
    }
    async findByClassId(classId) {
        return this.db
            .select()
            .from(exams)
            .where(eq(exams.class_id, classId))
            .orderBy(desc(exams.start_time));
    }
    async findUpcoming() {
        return this.db
            .select()
            .from(exams)
            .where(gte(exams.start_time, new Date()))
            .orderBy(asc(exams.start_time));
    }
    async create(data) {
        const result = await this.db.insert(exams).values(data).returning();
        if (!result[0])
            throw new Error('Failed to create exam');
        return result[0];
    }
    async update(id, data) {
        const result = await this.db.update(exams).set(data).where(eq(exams.id, id)).returning();
        if (!result[0])
            throw new Error('Exam not found');
        return result[0];
    }
    async delete(id) {
        await this.db.delete(exams).where(eq(exams.id, id));
    }
    // ── Questions ────────────────────────────────────────────────────────────
    async getQuestions(examId) {
        return this.db
            .select()
            .from(examQuestions)
            .where(eq(examQuestions.exam_id, examId))
            .orderBy(asc(examQuestions.question_number));
    }
    async createQuestions(questions) {
        if (questions.length === 0)
            return [];
        return this.db.insert(examQuestions).values(questions).returning();
    }
    async createWithQuestions(examData, questions) {
        const exam = await this.create(examData);
        if (questions.length > 0) {
            await this.createQuestions(questions.map(q => ({ ...q, exam_id: exam.id })));
        }
        return exam;
    }
    // ── Attempts ─────────────────────────────────────────────────────────────
    async getStudentAttempts(studentId, examId) {
        return this.db
            .select()
            .from(examAttempts)
            .where(and(eq(examAttempts.student_id, studentId), eq(examAttempts.exam_id, examId)))
            .orderBy(desc(examAttempts.started_at));
    }
    async getExamAttempts(examId) {
        return this.db
            .select()
            .from(examAttempts)
            .where(and(eq(examAttempts.exam_id, examId), isNotNull(examAttempts.submitted_at)))
            .orderBy(desc(examAttempts.score));
    }
    async createAttempt(data) {
        const result = await this.db.insert(examAttempts).values(data).returning();
        if (!result[0])
            throw new Error('Failed to create attempt');
        return result[0];
    }
    async updateAttempt(id, data) {
        const result = await this.db
            .update(examAttempts)
            .set(data)
            .where(eq(examAttempts.id, id))
            .returning();
        if (!result[0])
            throw new Error('Attempt not found');
        return result[0];
    }
}
//# sourceMappingURL=ExamRepository.js.map