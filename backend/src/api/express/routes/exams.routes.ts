import { Router, Request, Response, NextFunction } from 'express';
import { ExamService } from '../../../services/examService.js';
import { getDb } from '../../../providers/db/drizzle.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../../utils/errors.js';

export const examsRouter = Router();

let examService: ExamService | null = null;
function getExamService() {
  if (!examService) {
    examService = new ExamService(getDb());
  }
  return examService;
}

examsRouter.use(requireAuth);

// GET /api/exams/upcoming (Student)
examsRouter.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    if (!studentId) throw AppError.unauthorized();
    
    const upcoming = await getExamService().listUpcomingExams(studentId);
    sendSuccess(res, upcoming);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/results (Student)
examsRouter.get('/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    if (!studentId) throw AppError.unauthorized();

    const results = await getExamService().getStudentResults(studentId);
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/teacher (Teacher)
examsRouter.get('/teacher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = (req as any).user?.id;
    const role = (req as any).user?.role;
    if (role !== 'teacher' && role !== 'admin') throw AppError.forbidden();
    if (!profileId) throw AppError.unauthorized();

    const exams = await getExamService().listTeacherExams(profileId);
    sendSuccess(res, exams);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/teacher
examsRouter.post('/teacher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = (req as any).user?.id;
    const role = (req as any).user?.role;
    if (role !== 'teacher' && role !== 'admin') throw AppError.forbidden();
    if (!profileId) throw AppError.unauthorized();

    const { type, questions, pdfPath, pdfAnswers, ...examData } = req.body;
    let result;
    if (type === 'pdf') {
      result = await getExamService().createExamWithPdf(profileId, examData, pdfPath, pdfAnswers);
    } else if (type === 'manual') {
      result = await getExamService().createExamWithQuestions(profileId, examData, questions || []);
    } else {
      result = await getExamService().createExam(profileId, examData);
    }
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/exams/teacher/:id
examsRouter.patch('/teacher/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const { id } = req.params;
    if (role !== 'teacher' && role !== 'admin') throw AppError.forbidden();
    if (!profileId) throw AppError.unauthorized();

    const result = await getExamService().updateExam(id, req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/exams/teacher/:id
examsRouter.delete('/teacher/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profileId = (req as any).user?.id;
    const role = (req as any).user?.role;
    const { id } = req.params;
    if (role !== 'teacher' && role !== 'admin') throw AppError.forbidden();
    if (!profileId) throw AppError.unauthorized();

    await getExamService().deleteExam(id);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/:id/review
examsRouter.get('/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    const { id: examId } = req.params;
    if (!studentId) throw AppError.unauthorized();

    const reviewData = await getExamService().getExamReviewData(examId);
    sendSuccess(res, reviewData);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/:id/start
examsRouter.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    const { id: examId } = req.params;
    if (!studentId) throw AppError.unauthorized();

    const result = await getExamService().startAttempt(studentId, examId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/:id/submit
examsRouter.post('/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    const { id: examId } = req.params;
    const { answers } = req.body;
    if (!studentId) throw AppError.unauthorized();

    const result = await getExamService().submitAttempt(studentId, examId, answers || {});
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});
