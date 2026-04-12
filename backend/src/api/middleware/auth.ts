import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors.js';
import { SupabaseAuthProvider } from '../../providers/auth/SupabaseAuthProvider.js';
import { env } from '../../config/env.js';

const authProvider = new SupabaseAuthProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

import { ProfileRepository } from '../../repositories/ProfileRepository.js';
import { getDb } from '../../providers/db/drizzle.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    student_id: string;
  };
}

let profileRepo: ProfileRepository | null = null;
function getProfileRepo() {
  if (!profileRepo) profileRepo = new ProfileRepository(getDb());
  return profileRepo;
}

/**
 * Middleware to verify Bearer token using AuthProvider and append profile
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    // Auth provider abstracts JWT verification
    const authUser = await authProvider.verifyToken(token);
    
    // Fetch profile to get role and other metadata
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
