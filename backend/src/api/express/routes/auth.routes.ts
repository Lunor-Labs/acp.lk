import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../../services/userService.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth, AuthenticatedRequest } from '../../middleware/auth.js';

export const authRouter = Router();
const userService = new UserService();

// POST /api/auth/signin
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

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('User missing from request');
    const profile = await userService.getProfile(req.user.id);
    sendSuccess(res, { profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/signup/otp
authRouter.post('/signup/otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, data } = req.body;
    if (!email || !data?.fullName || !data?.center || !data?.alYear || !data?.password) {
      res.status(400).json({ message: 'email, fullName, center, alYear and password are required' });
      return;
    }
    const { studentId } = await userService.requestSignUpOtp(email, data);
    sendSuccess(res, { studentId });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/signup/verify
authRouter.post('/signup/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, data } = req.body;
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

// POST /api/auth/reset/otp
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

// POST /api/auth/reset/verify
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