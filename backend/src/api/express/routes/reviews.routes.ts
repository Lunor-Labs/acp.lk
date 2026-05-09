import { Router } from 'express';
import { getReviewsService } from '../../../services/reviewsService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const reviewsRouter = Router();
reviewsRouter.use(requireAuth);

reviewsRouter.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getReviewsService().getReviews(userId));
  } catch (err) { next(err); }
});

reviewsRouter.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const { student_name, review_text, rating, student_image_url, gender } = req.body;
    if (!student_name || !review_text || !rating) throw AppError.badRequest('student_name, review_text, and rating are required');
    sendSuccess(res, await getReviewsService().createReview(userId, { student_name, review_text, rating, student_image_url, gender }), 201);
  } catch (err) { next(err); }
});

reviewsRouter.patch('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    sendSuccess(res, await getReviewsService().updateReview(userId, req.params.id, req.body));
  } catch (err) { next(err); }
});

reviewsRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    await getReviewsService().deleteReview(userId, req.params.id);
    sendSuccess(res, { success: true });
  } catch (err) { next(err); }
});
