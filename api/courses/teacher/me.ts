import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourseService } from '../../../backend/src/services/courseService.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';
import { AppError } from '../../../backend/src/utils/errors.js';

const courseService = new CourseService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw AppError.forbidden('Only teachers can list their classes');
    }
    const courses = await courseService.listCoursesByTeacher(user.id, false);
    sendSuccess(res, courses);
  } catch (err) {
    handleError(err, res);
  }
}
