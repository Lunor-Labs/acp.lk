import { Router, Request, Response, NextFunction } from 'express';
import { getFileService } from '../../../services/fileService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const filesRouter = Router();

filesRouter.use(requireAuth);

// POST /api/files/signed-upload-url
filesRouter.post('/signed-upload-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();

    const { bucket, path } = req.body;
    if (!bucket || !path) {
      throw AppError.badRequest('Bucket and path are required');
    }

    const result = await getFileService().getSignedUploadUrl({ bucket, path });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});
