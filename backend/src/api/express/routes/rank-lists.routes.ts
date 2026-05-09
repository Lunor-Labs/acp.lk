import { Router } from 'express';
import { getRankListService } from '../../../services/rankListService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const rankListsRouter = Router();
rankListsRouter.use(requireAuth);

rankListsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getRankListService().getAll(userId));
  } catch (err) { next(err); }
});

rankListsRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { year, exam_name, image_path, public_url } = req.body;
    if (!year || !exam_name || !image_path) throw AppError.badRequest('year, exam_name, and image_path are required');
    sendSuccess(res, await getRankListService().create(userId, { year: Number(year), exam_name, image_path, public_url }), 201);
  } catch (err) { next(err); }
});

rankListsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getRankListService().delete(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
