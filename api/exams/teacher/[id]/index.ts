import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../backend/src/services/examService.js';
import { getDb } from '../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../_lib/response.js';
import { AppError } from '../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();

    if (req.method === 'PATCH') {
      const result = await new ExamService(getDb()).updateExam(id, req.body);
      return sendSuccess(res, result);
    }

    if (req.method === 'DELETE') {
      await new ExamService(getDb()).deleteExam(id);
      return sendSuccess(res, { success: true });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
