import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const profile = await userService.getProfile(user.id);
    sendSuccess(res, { profile });
  } catch (err) {
    handleError(err, res);
  }
}
