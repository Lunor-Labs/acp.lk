import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can enroll in classes');
    const { classId } = req.body;
    if (!classId) throw AppError.badRequest('classId is required');
    const enrollment = await enrollmentService.enrollStudent(user.id, classId);
    sendSuccess(res, enrollment);
  } catch (err) {
    handleError(err, res);
  }
}
