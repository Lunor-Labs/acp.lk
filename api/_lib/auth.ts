import type { VercelRequest } from '@vercel/node';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { ProfileRepository } from '../../backend/src/repositories/ProfileRepository.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { AppError } from '../../backend/src/utils/errors.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ApiUser {
  id: string;
  email: string;
  role: string;
  student_id: string;
}

export async function getAuthUser(req: VercelRequest): Promise<ApiUser> {
  const raw = req.headers.authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;

  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid authorization header');
  }

  const token = header.split(' ')[1];
  const authUser = await authProvider.verifyToken(token);

  const profile = await new ProfileRepository(getDb()).findById(authUser.id);
  if (!profile) throw AppError.unauthorized('User profile not found');
  if (!profile.is_active) throw AppError.forbidden('User account is deactivated');

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    student_id: profile.student_id || '',
  };
}
