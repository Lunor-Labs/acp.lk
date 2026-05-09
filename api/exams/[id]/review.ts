import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id as string;
  try {
    await getAuthUser(req);
    const data = await new ExamService(getDb()).getExamReviewData(id);
    sendSuccess(res, data);
  } catch (err) {
    handleError(err, res);
  }
}
