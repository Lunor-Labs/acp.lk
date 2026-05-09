import { Router, Request, Response, NextFunction } from 'express';
import { getStudyPackService } from '../../../services/studyPackService.js';
import { getStudentStudyPackService } from '../../../services/studentStudyPackService.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';

export const studyPacksRouter = Router();

studyPacksRouter.use(requireAuth);

// GET /api/studypacks/teacher
studyPacksRouter.get('/teacher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();

    const studyPacks = await getStudyPackService().getTeacherStudyPacks(userId);
    sendSuccess(res, studyPacks);
  } catch (err) {
    next(err);
  }
});

// POST /api/studypacks
studyPacksRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();

    const newPack = await getStudyPackService().createStudyPack(userId, req.body);
    sendSuccess(res, newPack, 201);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/studypacks/:id
studyPacksRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) throw AppError.unauthorized();

    const updated = await getStudyPackService().updateStudyPack(userId, id, req.body);
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/studypacks/:id
studyPacksRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) throw AppError.unauthorized();

    await getStudyPackService().deleteStudyPack(userId, id);
    sendSuccess(res, { success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/studypacks/student  — returns { purchased: StudyPack[], available: StudyPack[] }
studyPacksRouter.get('/student', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw AppError.unauthorized();
    const result = await getStudentStudyPackService().getStudentPacks(userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/studypacks/:id/purchase
studyPacksRouter.post('/:id/purchase', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) throw AppError.unauthorized();
    const purchase = await getStudentStudyPackService().purchasePack(userId, id);
    sendSuccess(res, purchase, 201);
  } catch (err) {
    next(err);
  }
});
