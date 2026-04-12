import { Router, Request, Response, NextFunction } from 'express';
import { CourseService } from '../../../services/courseService.js';
import { sendSuccess } from '../../../utils/response.js';

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
