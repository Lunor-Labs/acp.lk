import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../../backend/src/services/examService.js';
import { getDb } from '../../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../../_lib/auth.js';
import { sendSuccess, handleError } from '../../../_lib/response.js';
import { AppError } from '../../../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    if (user.role !== 'teacher' && user.role !== 'admin') throw AppError.forbidden();
    const detail = await new ExamService(getDb()).getExamReviewData(id);
    sendSuccess(res, detail);
  } catch (err) {
    handleError(err, res);
  }
}
