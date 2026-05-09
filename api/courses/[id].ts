import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../backend/src/services/courseService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    if (req.method === 'GET') {
      const course = await courseService.getCourse(id);
      return sendSuccess(res, course);
    }

    if (req.method === 'PUT') {
      const user = await getAuthUser(req);
      if (user.role !== 'teacher' && user.role !== 'admin') {
        throw AppError.forbidden('Only teachers can update classes');
      }
      const updated = await courseService.updateCourse(id, req.body);
      return sendSuccess(res, updated);
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
