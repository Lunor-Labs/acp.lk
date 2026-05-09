import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../../services/userService.js';
import { SupabaseAuthProvider } from '../../../providers/auth/SupabaseAuthProvider.js';
import { sendSuccess } from '../../../utils/response.js';
import { AppError } from '../../../utils/errors.js';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { env } from '../../../config/env.js';

export const usersRouter = Router();

const authProvider = new SupabaseAuthProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const userService = new UserService(authProvider);

/**
 * GET /api/users/me
 * Get the authenticated user's full profile
 */
usersRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');
    const profile = await userService.getProfile(req.user.id);
    sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/users/me
 * Update the authenticated user's profile
 * Body: Partial<{ full_name, avatar_url, ... }>
 */
usersRouter.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');

    // Whitelist updatable fields — don't let users change role or student_id
    const { full_name, avatar_url, phone } = req.body as {
      full_name?: string;
      avatar_url?: string;
      phone?: string;
    };

    const profile = await userService.updateProfile(req.user.id, {
      ...(full_name !== undefined && { full_name }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(phone !== undefined && { phone }),
    });
    sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/me/change-password
 * Body: { currentPassword: string; newPassword: string }
 */
usersRouter.post('/me/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('currentPassword and newPassword are required');
    }
    if (newPassword.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters');
    }
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});
