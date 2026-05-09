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
  try {
    const user = await getAuthUser(req);

    if (req.method === 'GET') {
      const profile = await userService.getProfile(user.id);
      return sendSuccess(res, { profile });
    }

    if (req.method === 'PATCH') {
      const { full_name, avatar_url } = req.body as {
        full_name?: string;
        avatar_url?: string;
      };
      const profile = await userService.updateProfile(user.id, {
        ...(full_name !== undefined && { full_name }),
        ...(avatar_url !== undefined && { avatar_url }),
      });
      return sendSuccess(res, { profile });
    }

    res.status(405).end();
  } catch (err) {
    handleError(err, res);
  }
}
