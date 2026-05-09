import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../backend/src/services/courseService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const courses = await courseService.listActiveCourses();
      return sendSuccess(res, courses);
    }

    if (req.method === 'POST') {
      const user = await getAuthUser(req);
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw AppError.forbidden('Only teachers can create classes');
      }
      const data = { ...req.body, teacher_id: user.id };
      const newCourse = await courseService.createCourse(data);
      return sendSuccess(res, newCourse, 201);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
