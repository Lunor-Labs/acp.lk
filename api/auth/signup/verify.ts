import type { VercelRequest, VercelResponse } from '@vercel/node';
import { UserService } from '../../../backend/src/services/userService.js';
import { SupabaseAuthProvider } from '../../../backend/src/providers/auth/SupabaseAuthProvider.js';
import { sendSuccess, handleError } from '../../_lib/response.js';

const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const userService = new UserService(authProvider);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { email, token, data } = req.body;
    if (!email || !token || !data?.fullName) {
      return res.status(400).json({ message: 'email, token, and data.fullName are required' });
    }
    const result = await userService.verifySignUpOtp(email, token, data);
    sendSuccess(res, { user: { id: result.user.id }, studentId: result.profile.student_id });
  } catch (err) {
    handleError(err, res);
  }
}
