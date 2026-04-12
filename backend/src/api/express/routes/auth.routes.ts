import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../../services/userService.js';
import { SupabaseAuthProvider } from '../../../providers/auth/SupabaseAuthProvider.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';
import { env } from '../../../config/env.js';

export const authRouter = Router();

const authProvider = new SupabaseAuthProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const userService = new UserService(authProvider);

/**
 * POST /api/auth/signin
 * Sign in with Student ID or email + password
 */
authRouter.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ message: 'identifier and password are required' });
      return;
    }
    const result = await userService.signIn(identifier, password);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile
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

/**
 * POST /api/auth/signup/otp
 * Request an OTP to begin the sign-up process.
 * Body: { email, data: { fullName, role, alYear, center, nic, whatsappNo, mobileNo } }
 */
authRouter.post('/signup/otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, data } = req.body as {
      email: string;
      data: {
        fullName: string;
        role: 'student';
        alYear: number;
        center: 'online' | 'riochem' | 'vision';
        nic: string;
        whatsappNo: string;
        mobileNo: string;
        password?: string;
      };
    };

    if (!email || !data?.fullName || !data?.center || !data?.alYear) {
      res.status(400).json({ message: 'email, fullName, center, and alYear are required' });
      return;
    }

    const { studentId } = await userService.requestSignUpOtp(email, data);
    sendSuccess(res, { studentId });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/signup/verify
 * Verify OTP and create the user account.
 * Body: { email, token, data: { fullName, alYear, center, password, ... } }
 */
authRouter.post('/signup/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, data } = req.body as {
      email: string;
      token: string;
      data: {
        fullName: string;
        alYear: number;
        center: 'online' | 'riochem' | 'vision';
        password?: string;
        studentId?: string;
      };
    };

    if (!email || !token || !data?.fullName) {
      res.status(400).json({ message: 'email, token, and data.fullName are required' });
      return;
    }

    const result = await userService.verifySignUpOtp(email, token, data);
    sendSuccess(res, { user: { id: result.user.id }, studentId: result.profile.student_id });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset/otp
 * Request a password-reset OTP (accepts email or student ID)
 * Body: { identifier }
 */
authRouter.post('/reset/otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      res.status(400).json({ message: 'identifier is required' });
      return;
    }
    const { email } = await userService.requestPasswordResetOtp(identifier);
    sendSuccess(res, { email });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset/verify
 * Verify reset OTP and set a new password.
 * Body: { email, token, newPassword }
 */
authRouter.post('/reset/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      res.status(400).json({ message: 'email, token, and newPassword are required' });
      return;
    }
    await userService.resetPasswordWithOtp(email, token, newPassword);
    sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});
