import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export interface Exam {
    id: string;
    teacher_id: string;
    class_id?: string;
    title: string;
    description: string;
    subject: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    total_marks: number;
    questions?: any[];
    created_at: string;
}

export interface ExamQuestion {
    id: string;
    exam_id: string;
    question_number: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    marks: number;
    image_path?: string;
    created_at: string;
}

export interface ExamAttempt {
    id: string;
    exam_id: string;
    student_id: string;
    status: 'started' | 'submitted';
    score: number;
    percentage?: number;
    answers: any;
    started_at: string;
    submitted_at?: string;
    rank?: number;
    created_at: string;
}

/**
 * Exam Repository
 * Handles all database operations for exams
 */
export class ExamRepository extends BaseRepository<Exam> {
    constructor() {
        super('exams');
    }

    /**
     * Find all exams for a specific teacher
     */
    async findByTeacherId(teacherId: string): Promise<Exam[]> {
        const { data, error } = await db.from<Exam>(this.tableName)
            .select()
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find all exams for a specific class
     */
    async findByClassId(classId: string): Promise<Exam[]> {
        const { data, error } = await db.from<Exam>(this.tableName)
            .select()
            .eq('class_id', classId)
            .order('start_time', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find upcoming exams
     */
    async findUpcoming(): Promise<Exam[]> {
        const now = new Date().toISOString();
        const { data, error } = await db.from<Exam>(this.tableName)
            .select()
            .gte('start_time', now)
            .order('start_time', { ascending: true })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find active exams (currently running)
     */
    async findActive(): Promise<Exam[]> {
        const now = new Date().toISOString();
        const { data, error } = await db.from<Exam>(this.tableName)
            .select()
            .lte('start_time', now)
            .gte('end_time', now)
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Find completed exams
     */
    async findCompleted(): Promise<Exam[]> {
        const now = new Date().toISOString();
        const { data, error } = await db.from<Exam>(this.tableName)
            .select()
            .lt('end_time', now)
            .order('end_time', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Get exam questions
     */
    async getQuestions(examId: string): Promise<ExamQuestion[]> {
        const { data, error } = await db.from<ExamQuestion>('exam_questions')
            .select()
            .eq('exam_id', examId)
            .order('question_number', { ascending: true })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Create exam with questions
     */
    async createWithQuestions(exam: Partial<Exam>, questions: Partial<ExamQuestion>[]): Promise<Exam> {
        // Create exam
        //console.log('[ExamRepository] Creating exam...', exam.title);
        const createdExam = await this.create(exam);
        //console.log('[ExamRepository] ✅ Exam created with ID:', createdExam.id);

        // Create questions
        if (questions.length > 0) {
            //console.log(`[ExamRepository] Inserting ${questions.length} questions...`);
            const questionsWithExamId = questions.map((q, idx) => {
              const questionData = {
                ...q,
                exam_id: createdExam.id
              };
            //   console.log(`[ExamRepository] Q${idx + 1}:`, {
            //     question_number: questionData.question_number,
            //     text: questionData.question_text?.substring(0, 50),
            //     options_count: questionData.options?.length,
            //     has_image: !!questionData.image_path,
            //   });
              return questionData;
            });

            const { data: insertedData, error } = await db.from<ExamQuestion>('exam_questions')
                .insert(questionsWithExamId)
                .execute();

            if (error) {
              //console.error('[ExamRepository] ❌ Batch insert failed:', error);
              throw error;
            }
            //console.log(`[ExamRepository] ✅ Successfully inserted ${questions.length} questions`);
        }

        return createdExam;
    }

    /**
     * Get submission count for an exam
     */
    async getSubmissionCount(examId: string): Promise<number> {
        const { count, error } = await db.from<ExamAttempt>('exam_attempts')
            .select('*', { count: 'exact', head: true } as any)
            .eq('exam_id', examId)
            .not('submitted_at', 'is', null)
            .execute();

        if (error) throw error;
        return count || 0;
    }

    /**
     * Get student's exam attempts
     */
    async getStudentAttempts(studentId: string, examId: string): Promise<ExamAttempt[]> {
        const { data, error } = await db.from<ExamAttempt>('exam_attempts')
            .select()
            .eq('student_id', studentId)
            .eq('exam_id', examId)
            .order('started_at', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Get all attempts for an exam
     */
    async getExamAttempts(examId: string): Promise<ExamAttempt[]> {
        const { data, error } = await db.from<ExamAttempt>('exam_attempts')
            .select()
            .eq('exam_id', examId)
            .not('submitted_at', 'is', null)
            .order('score', { ascending: false })
            .execute();

        if (error) throw error;
        return data || [];
    }
}
