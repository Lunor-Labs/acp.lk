import { Router } from 'express';
import { UserService } from '../../../services/userService.js';
import { SupabaseAuthProvider } from '../../../providers/auth/SupabaseAuthProvider.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';
import { env } from '../../../config/env.js';
export const usersRouter = Router();
const authProvider = new SupabaseAuthProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const userService = new UserService(authProvider);
/**
 * GET /api/users/me
 * Get the authenticated user's full profile
 */
usersRouter.get('/me', requireAuth, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('User missing from request');
        const profile = await userService.getProfile(req.user.id);
        sendSuccess(res, { profile });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PATCH /api/users/me
 * Update the authenticated user's profile
 * Body: Partial<{ full_name, avatar_url, ... }>
 */
usersRouter.patch('/me', requireAuth, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('User missing from request');
        // Whitelist updatable fields — don't let users change role or student_id
        const { full_name, avatar_url } = req.body;
        const profile = await userService.updateProfile(req.user.id, {
            ...(full_name !== undefined && { full_name }),
            ...(avatar_url !== undefined && { avatar_url }),
        });
        sendSuccess(res, { profile });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=users.routes.js.map