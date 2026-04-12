import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors.js';
import { SupabaseAuthProvider } from '../../providers/auth/SupabaseAuthProvider.js';
import { env } from '../../config/env.js';

const authProvider = new SupabaseAuthProvider(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Middleware to verify Bearer token using AuthProvider
 */
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    
    // Auth provider abstracts JWT verification
    const user = await authProvider.verifyToken(token);
    
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
