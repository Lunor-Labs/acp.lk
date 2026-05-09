import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStudyPackService } from '../../backend/src/services/studyPackService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const newPack = await getStudyPackService().createStudyPack(user.id, req.body);
    sendSuccess(res, newPack, 201);
  } catch (err) {
    handleError(err, res);
  }
}
