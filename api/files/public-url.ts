import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFileService } from '../../backend/src/services/fileService.js';
import { sendSuccess, handleError } from '../_lib/response.js';
import { AppError } from '../../backend/src/utils/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { bucket, path } = req.query as { bucket: string; path: string };
    if (!bucket || !path) throw AppError.badRequest('bucket and path are required');
    const url = getFileService().getPublicUrl(bucket, path);
    sendSuccess(res, { url });
  } catch (err) {
    handleError(err, res);
  }
}
