import { Router, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { FileService } from '../../../services/fileService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import multer from 'multer';

export const filesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/files/upload
// Direct server-side upload (for small files)
filesRouter.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw AppError.badRequest('No file provided');

      const { path } = req.body;
      if (!path) throw AppError.badRequest('path is required');

      const result = await FileService.upload(
        path,
        req.file.buffer,
        req.file.mimetype
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/files/signed-upload-url
// Returns a presigned URL so the browser uploads directly to S3
filesRouter.post(
  '/signed-upload-url',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { path } = req.body;
      if (!path) throw AppError.badRequest('path is required');

      const result = await FileService.createSignedUploadUrl(path);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/files/signed-url?path=xxx
// Returns a signed download URL for a private file
filesRouter.get(
  '/signed-url',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { path, expiresIn } = req.query as { path: string; expiresIn?: string };
      if (!path) throw AppError.badRequest('path is required');

      const url = await FileService.getSignedUrl(path, expiresIn ? parseInt(expiresIn) : 3600);
      sendSuccess(res, { url });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/files/public-url?bucket=xxx&path=xxx
// Returns a permanent public URL for a public file
filesRouter.get(
  '/public-url',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query as { path: string };
      if (!path) throw AppError.badRequest('path is required');

      const url = FileService.getPublicUrl(path);
      sendSuccess(res, { url });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/files
// Delete one or more files
filesRouter.delete(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { paths } = req.body as { paths: string[] };
      if (!paths?.length) throw AppError.badRequest('paths array is required');

      await FileService.delete(paths);
      sendSuccess(res, { deleted: paths.length });
    } catch (error) {
      next(error);
    }
  }
);