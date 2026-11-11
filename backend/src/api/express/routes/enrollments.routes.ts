import { Router, Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../../../services/enrollmentService.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../../utils/errors.js';

export const enrollmentRouter = Router();
const enrollmentService = new EnrollmentService();

// All enrollment operations require being logged in as a student
enrollmentRouter.use(requireAuth);

/**
 * GET /api/enrollments/me
 * List all classes the student is enrolled in
 */
enrollmentRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'student') throw AppError.forbidden('Only students can view their enrollments');

    const studentId = (req as any).user?.id;
    const enrollments = await enrollmentService.getStudentEnrollments(studentId);
    sendSuccess(res, enrollments);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/enrollments
 * Enroll in a class
 */
enrollmentRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'student') throw AppError.forbidden('Only students can enroll in classes');

    const studentId = (req as any).user?.id;
    const { classId } = req.body;
    
    if (!classId) throw AppError.badRequest('className is required');

    const enrollment = await enrollmentService.enrollStudent(studentId, classId);
    sendSuccess(res, enrollment);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/enrollments/:classId
 * Unenroll from a class
 */
enrollmentRouter.delete('/:classId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'student') throw AppError.forbidden('Only students can unenroll');

    const studentId = (req as any).user?.id;
    const { classId } = req.params;

    await enrollmentService.unenrollStudent(studentId, classId);
    sendSuccess(res, { message: 'Unenrolled successfully' });
  } catch (error) {
    next(error);
  }
});
