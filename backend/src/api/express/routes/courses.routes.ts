import { Router, Request, Response, NextFunction } from 'express';
import { CourseService } from '../../../services/courseService.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../../utils/errors.js';

export const coursesRouter = Router();
const courseService = new CourseService();

/**
 * GET /api/courses
 * List all active courses
 */
coursesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await courseService.listActiveCourses();
    sendSuccess(res, courses);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/courses/:id
 * Get single active course
 */
coursesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await courseService.getCourse(req.params.id);
    sendSuccess(res, course);
  } catch (error) {
    next(error);
  }
});

// Admin / Teacher Management Endpoints
coursesRouter.use(requireAuth);

/**
 * GET /api/courses/teacher/me
 * List classes belonging to the currently authenticated teacher
 */
coursesRouter.get('/teacher/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if ((req as any).user?.role !== 'teacher' && (req as any).user?.role !== 'admin') {
      throw AppError.forbidden('Only teachers can list their classes');
    }
    const teacherId = (req as any).user?.id;
    const courses = await courseService.listCoursesByTeacher(teacherId, false);
    sendSuccess(res, courses);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/courses
 * Create a new course
 */
coursesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if ((req as any).user?.role !== 'teacher' && (req as any).user?.role !== 'admin') {
      throw AppError.forbidden('Only teachers can create classes');
    }

    const data = req.body;
    data.teacher_id = (req as any).user?.id;

    const newCourse = await courseService.createCourse(data);
    sendSuccess(res, newCourse, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/courses/:id
 * Update an existing course
 */
coursesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if ((req as any).user?.role !== 'teacher' && (req as any).user?.role !== 'admin') {
      throw AppError.forbidden('Only teachers can update classes');
    }

    const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
    sendSuccess(res, updatedCourse);
  } catch (error) {
    next(error);
  }
});
