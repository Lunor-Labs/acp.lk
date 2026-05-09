import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFileService } from '../../backend/src/services/fileService.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await getAuthUser(req);
    const { bucket, path } = req.body;
    if (!bucket || !path) throw AppError.badRequest('bucket and path are required');
    const result = await getFileService().getSignedUploadUrl({ bucket, path });
    sendSuccess(res, result);
  } catch (err) {
    handleError(err, res);
  }
}
