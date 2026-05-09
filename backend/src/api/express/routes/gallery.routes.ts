import { Router } from 'express';
import { getGalleryService } from '../../../services/galleryService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const galleryRouter = Router();
galleryRouter.use(requireAuth);

galleryRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getGalleryService().getImages(userId));
  } catch (err) { next(err); }
});

galleryRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { storage_path, public_url, caption } = req.body;
    if (!storage_path) throw AppError.badRequest('storage_path is required');
    sendSuccess(res, await getGalleryService().addImage(userId, { storage_path, public_url, caption }), 201);
  } catch (err) { next(err); }
});

galleryRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getGalleryService().deleteImage(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});

galleryRouter.patch('/:id/toggle', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { is_active } = req.body;
    await getGalleryService().toggleActive(userId, req.params.id, Boolean(is_active));
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
