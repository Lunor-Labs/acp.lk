import { BaseRepository } from './BaseRepository';
import { db } from '../lib/database';

export interface PdfPaper {
    id: number;
    exam_id: string;
    question_no: number;
    correct_answer: string;
    pdf_path: string;
    created_at: string;
}

/**
 * PDF Paper Repository
 * Handles all database operations for PDF exam papers and their answers
 */
export class PdfPaperRepository extends BaseRepository<PdfPaper> {
    constructor() {
        super('pdf_exams');
    }

    /**
     * Find all PDF papers for a specific exam
     */
    async findByExamId(examId: string): Promise<PdfPaper[]> {
        const { data, error } = await db.from<PdfPaper>(this.tableName)
            .select()
            .eq('exam_id', examId)
            .order('question_no', { ascending: true })
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Create multiple PDF answer records for a single exam
     * Used to batch insert all 50 question answers
     */
    async createPdfAnswers(
        examId: string,
        pdfPath: string,
        answers: Array<{ question_no: number; correct_answer: string }>
    ): Promise<PdfPaper[]> {
        const answersToInsert = answers.map(answer => ({
            exam_id: examId,
            pdf_path: pdfPath,
            question_no: answer.question_no,
            correct_answer: answer.correct_answer,
        }));

        const { data, error } = await db.from<PdfPaper>(this.tableName)
            .insert(answersToInsert)
            .select()
            .execute();

        if (error) throw error;
        return data || [];
    }

    /**
     * Check if PDF answers already exist for an exam
     */
    async existsForExam(examId: string): Promise<boolean> {
        const { data, error, count } = await db.from<PdfPaper>(this.tableName)
            .select('*', { count: 'exact', head: true } as any)
            .eq('exam_id', examId)
            .execute();

        if (error) throw error;
        return (count || 0) > 0;
    }

    /**
     * Get the PDF path for an exam
     */
    async getPdfPath(examId: string): Promise<string | null> {
        const { data, error } = await db.from<PdfPaper>(this.tableName)
            .select('pdf_path')
            .eq('exam_id', examId)
            .limit(1)
            .maybeSingle()
            .execute();

        if (error) throw error;
        return data?.pdf_path || null;
    }

    /**
     * Delete all answers for a specific exam (useful for re-uploading)
     */
    async deleteByExamId(examId: string): Promise<void> {
        const { error } = await db.from<PdfPaper>(this.tableName)
            .delete()
            .eq('exam_id', examId)
            .execute();

        if (error) throw error;
    }

    /**
     * Update a single answer for a question
     */
    async updateAnswer(examId: string, questionNo: number, correctAnswer: string): Promise<PdfPaper> {
        const { data, error } = await db.from<PdfPaper>(this.tableName)
            .update({ correct_answer: correctAnswer })
            .eq('exam_id', examId)
            .eq('question_no', questionNo)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to update answer');
        return data;
    }

    /**
     * Update multiple answers at once for a specific exam
     * This is more efficient than calling updateAnswer multiple times
     */
    async updateMultipleAnswers(
        examId: string,
        answers: Array<{ question_no: number; correct_answer: string }>
    ): Promise<PdfPaper[]> {
        if (answers.length === 0) {
            return [];
        }

        try {
            const updatedPapers: PdfPaper[] = [];

            // Update each answer and collect the results
            for (const answer of answers) {
                const { data, error } = await db.from<PdfPaper>(this.tableName)
                    .update({ correct_answer: answer.correct_answer })
                    .eq('exam_id', examId)
                    .eq('question_no', answer.question_no)
                    .select()
                    .single();

                if (error) {
                    console.error(`Failed to update question ${answer.question_no}:`, error);
                    throw error;
                }

                if (data) {
                    updatedPapers.push(data);
                }
            }

            return updatedPapers;
        } catch (error) {
            console.error('Error updating multiple answers:', error);
            throw error;
        }
    }
}
