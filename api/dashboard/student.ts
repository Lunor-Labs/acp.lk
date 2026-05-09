import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DashboardService } from '../../backend/src/services/dashboardService.js';
import { getDb } from '../../backend/src/providers/db/drizzle.js';
import { getAuthUser } from '../_lib/auth.js';
import { sendSuccess, handleError } from '../_lib/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const user = await getAuthUser(req);
    const data = await new DashboardService(getDb()).getStudentDashboard(user.id);
    sendSuccess(res, data);
  } catch (err) {
    handleError(err, res);
  }
}
