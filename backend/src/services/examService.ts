import { ExamRepository } from '../repositories/ExamRepository.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { BaseRepository } from '../repositories/BaseRepository.js';
import { pdfExams, testResults } from '../repositories/schema/other.js';
import type { DrizzleDb } from '../providers/db/drizzle.js';
import type { NewExam, NewExamQuestion, NewExamAttempt, ExamQuestion } from '../repositories/schema/exams.js';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';

export class ExamService {
  private examRepo: ExamRepository;
  private enrollmentRepo: EnrollmentRepository;
  private db: DrizzleDb;

  private teacherRepo: any; // We'll import TeacherRepository

  constructor(db: DrizzleDb) {
    this.db = db;
    this.examRepo = new ExamRepository(db);
    this.enrollmentRepo = new EnrollmentRepository(db);
    const { TeacherRepository } = require('../repositories/TeacherRepository.js');
    this.teacherRepo = new TeacherRepository(db);
  }

  async listUpcomingExams(studentId: string) {
    const enrollments = await this.enrollmentRepo.findByStudentId(studentId);
    const classIds = enrollments.map(e => e.class_id).filter(id => id !== null) as string[];
    
    if (classIds.length === 0) return [];

    const upcoming = await this.examRepo.findUpcoming();
    return upcoming.filter(exam => exam.class_id && classIds.includes(exam.class_id));
  }

  async listTeacherExams(profileId: string) {
    const teacher = await this.teacherRepo.findByProfileId(profileId);
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    return this.examRepo.findByTeacherId(teacher.id);
  }

  async getExamDetails(examId: string) {
    return this.examRepo.findById(examId);
  }

  async createExam(profileId: string, data: Omit<NewExam, 'teacher_id'>) {
    const teacher = await this.teacherRepo.findByProfileId(profileId);
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    return this.examRepo.create({ ...data, teacher_id: teacher.id });
  }

  async createExamWithQuestions(profileId: string, data: Omit<NewExam, 'teacher_id'>, questions: Omit<NewExamQuestion, 'exam_id' | 'id'>[]) {
    const teacher = await this.teacherRepo.findByProfileId(profileId);
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    return this.examRepo.createWithQuestions({ ...data, teacher_id: teacher.id }, questions);
  }

  async createExamWithPdf(profileId: string, data: Omit<NewExam, 'teacher_id'>, pdfPath: string, answers: { question_no: number, correct_answer: number }[]) {
    const teacher = await this.teacherRepo.findByProfileId(profileId);
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    return this.examRepo.createWithPdf({ ...data, teacher_id: teacher.id }, pdfPath, answers);
  }

  async updateExam(examId: string, data: Partial<NewExam>) {
    return this.examRepo.update(examId, data);
  }

  async deleteExam(examId: string) {
    return this.examRepo.delete(examId);
  }

  async updateExamAnswers(examId: string, changes: Record<string, string | number>, isPdfExam: boolean) {
    if (isPdfExam) {
      for (const [questionNo, newAnswer] of Object.entries(changes)) {
        await this.db.update(pdfExams)
          .set({ correct_answer: Number(newAnswer) })
          .where(and(eq(pdfExams.exam_id, examId), eq(pdfExams.question_no, Number(questionNo))));
      }
    } else {
      const questions = await this.examRepo.getQuestions(examId);
      for (const [questionNumber, newAnswer] of Object.entries(changes)) {
        const question = questions.find(q => q.question_number === Number(questionNumber));
        if (question) {
          await this.examRepo.updateQuestion(question.id, { correct_answer: String(newAnswer) });
        }
      }
    }
  }

  async updateExamQuestion(questionId: string, data: { question_text?: string; options?: string[]; marks?: number; image_path?: string | null }) {
    return this.examRepo.updateQuestion(questionId, data as any);
  }

  async getAttempt(attemptId: string) {
    const attempts = await this.db.query.examAttempts.findFirst({
      where: (table, { eq }) => eq(table.id, attemptId)
    });
    return attempts;
  }

  async startAttempt(studentId: string, examId: string) {
    const exam = await this.getExamDetails(examId);
    if (!exam) throw AppError.notFound('Exam not found');

    const existingAttempts = await this.examRepo.getStudentAttempts(studentId, examId);
    let attempt = existingAttempts.find(a => a.status === 'started');

    if (!attempt) {
      if (existingAttempts.find(a => a.status === 'submitted')) {
        throw AppError.badRequest('You have already submitted this exam');
      }

      attempt = await this.examRepo.createAttempt({
        id: crypto.randomUUID(),
        exam_id: examId,
        student_id: studentId,
        status: 'started',
        score: 0,
        answers: {}
      });
    }

    // Fetch questions or PDF
    const pdfRecords = await this.db.select().from(pdfExams).where(eq(pdfExams.exam_id, examId));
    const isPdf = pdfRecords.length > 0;
    
    let questions: ExamQuestion[] = [];
    let pdfUrl: string | null = null;

    if (isPdf) {
      // In a real implementation we would fetch public URL from storage
      pdfUrl = pdfRecords[0].pdf_path;
    } else {
      questions = await this.examRepo.getQuestions(examId);
    }

    return {
      attempt,
      exam,
      isPdf,
      pdfUrl,
      questions
    };
  }

  async submitAttempt(studentId: string, examId: string, answers: Record<number, string | number>) {
    const attempts = await this.examRepo.getStudentAttempts(studentId, examId);
    const activeAttempt = attempts.find(a => a.status === 'started');
    if (!activeAttempt) throw AppError.badRequest('No active attempt found to submit');

    const exam = await this.getExamDetails(examId);
    if (!exam) throw AppError.notFound('Exam not found');

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const pdfRecords = await this.db.select().from(pdfExams).where(eq(pdfExams.exam_id, examId));
    const isPdf = pdfRecords.length > 0;

    if (isPdf) {
      for (const correct of pdfRecords) {
        const studentAnswer = answers[correct.question_no];
        if (studentAnswer !== undefined) {
          if (Number(studentAnswer) === correct.correct_answer) {
            score += 1;
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      }
    } else {
      const questions = await this.examRepo.getQuestions(examId);
      for (const q of questions) {
        const studentAnswer = answers[q.question_number] as string;
        if (studentAnswer !== undefined && studentAnswer !== '') {
          const correctArr = (q.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean);
          const studentArr = String(studentAnswer).split(',').map(s => s.trim()).filter(Boolean);

          const isFullyCorrect = correctArr.length === studentArr.length && correctArr.every(ca => studentArr.includes(ca));
          if (isFullyCorrect) {
            score += q.marks;
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      }
    }

    const percentage = exam.total_marks > 0 ? Math.round((score / exam.total_marks) * 100) : 0;

    const updated = await this.examRepo.updateAttempt(activeAttempt.id, {
      score,
      percentage,
      answers,
      status: 'submitted',
      submitted_at: new Date()
    });

    return updated;
  }

  async getStudentResults(studentId: string) {
    const attempts = await this.db.query.examAttempts.findMany({
      where: (table, { eq, and, isNotNull }) => and(eq(table.student_id, studentId), eq(table.status, 'submitted')),
      orderBy: (table, { desc }) => [desc(table.submitted_at)]
    });
    
    // We can enrich it with exam meta
    const enriched = [];
    for (const attempt of attempts) {
      const exam = await this.getExamDetails(attempt.exam_id);
      enriched.push({
        ...attempt,
        exam
      });
    }

    return enriched;
  }

  async getExamReviewData(examId: string) {
    const pdfRecords = await this.db.select().from(pdfExams).where(eq(pdfExams.exam_id, examId));
    const isPdf = pdfRecords.length > 0;
    
    let questions: ExamQuestion[] = [];
    let pdfUrl: string | null = null;
    let pdfAnswers: { question_no: number; correct_answer: number }[] = [];

    if (isPdf) {
      pdfUrl = pdfRecords[0].pdf_path;
      pdfAnswers = pdfRecords.map(r => ({ question_no: r.question_no, correct_answer: r.correct_answer }));
    } else {
      questions = await this.examRepo.getQuestions(examId);
    }
    return { isPdf, pdfUrl, questions, pdfAnswers };
  }
}
