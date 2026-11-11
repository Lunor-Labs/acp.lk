import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors.js';
import { JwtAuthProvider } from '../../providers/auth/JwtAuthProvider.js';
import { ProfileRepository } from '../../repositories/ProfileRepository.js';
import { getDb } from '../../providers/db/drizzle.js';

const jwtAuth = new JwtAuthProvider();
let profileRepo: ProfileRepository | null = null;

function getProfileRepo() {
  if (!profileRepo) profileRepo = new ProfileRepository(getDb());
  return profileRepo;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    student_id: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    const authUser = await jwtAuth.verifyToken(token);

    const profile = await getProfileRepo().findById(authUser.id);
    if (!profile) throw AppError.unauthorized('User profile not found');
    if (!profile.is_active) throw AppError.forbidden('User account is deactivated');

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      student_id: profile.student_id || '',
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };