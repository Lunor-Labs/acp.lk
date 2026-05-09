import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EnrollmentService } from '../../backend/src/services/enrollmentService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

const enrollmentService = new EnrollmentService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'student') throw AppError.forbidden('Only students can unenroll');
    const classId = req.query.classId as string;
    await enrollmentService.unenrollStudent(user.id, classId);
    sendSuccess(res, { message: 'Unenrolled successfully' });
  } catch (err) {
    handleError(err, res);
  }
}
