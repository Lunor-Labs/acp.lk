import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStudyPackService } from '../../backend/src/services/studyPackService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string;
  try {
    const user = await getAuthUser(req);

    if (req.method === 'PATCH') {
      const updated = await getStudyPackService().updateStudyPack(user.id, id, req.body);
      return sendSuccess(res, updated);
    }

    if (req.method === 'DELETE') {
      await getStudyPackService().deleteStudyPack(user.id, id);
      return sendSuccess(res, { success: true });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
