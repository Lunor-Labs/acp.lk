import { Router } from 'express';
import { getSuccessService } from '../../../services/successService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const successRouter = Router();
successRouter.use(requireAuth);

successRouter.get('/', async (req, res, next) => {
  try { sendSuccess(res, await getSuccessService().getAll()); } catch (err) { next(err); }
});

successRouter.post('/', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    sendSuccess(res, await getSuccessService().create(req.body), 201);
  } catch (err) { next(err); }
});

successRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    sendSuccess(res, await getSuccessService().update(req.params.id, req.body));
  } catch (err) { next(err); }
});

successRouter.delete('/:id', async (req, res, next) => {
  try {
    if (!(req as any).user?.id) throw AppError.unauthorized();
    await getSuccessService().delete(req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
