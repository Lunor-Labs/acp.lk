import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../../services/userService.js';
import { SupabaseAuthProvider } from '../../../providers/auth/SupabaseAuthProvider.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';

export const authRouter = Router();

const authProvider = new SupabaseAuthProvider();
const userService = new UserService(authProvider);

/**
 * POST /api/auth/signin
 * SignIn with Student ID or Email
 */
authRouter.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    const result = await userService.signIn(identifier, password);
    
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get currently authenticated profile
 */
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');
    const profile = await userService.getProfile(req.user.id);
    sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
});
