import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can view their enrollments');
    const enrollments = await enrollmentService.getStudentEnrollments(user.id);
    sendSuccess(res, enrollments);
  } catch (err) {
    handleError(err, res);
  }
}
