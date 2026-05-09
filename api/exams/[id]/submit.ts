import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExamService } from '../../../backend/src/services/examService.js';
import { getDb } from '../../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../../_lib/auth.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);
    const { answers } = req.body;
    const result = await new ExamService(getDb()).submitAttempt(user.id, id, answers || {});
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
