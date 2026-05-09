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
    const { email, data } = req.body;
    if (!email || !data?.fullName || !data?.center || !data?.alYear) {
      return res.status(400).json({ message: 'email, fullName, center, and alYear are required' });
    }
    const { studentId } = await userService.requestSignUpOtp(email, data);
    sendSuccess(res, { studentId });
  } catch (err) {
    handleError(err, res);
  }
}
