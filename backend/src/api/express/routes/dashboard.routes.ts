import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../../../services/dashboardService.js';
import { getDb } from '../../../providers/db/drizzle.js';
import { sendSuccess } from '../../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../../utils/errors.js';

export const dashboardRouter = Router();

// Dashboard service requires a DB connection, instantiate lazily or per-request
let dashboardService: DashboardService | null = null;
function getDashboardService() {
  if (!dashboardService) {
    dashboardService = new DashboardService(getDb());
  }
  return dashboardService;
}

// Ensure all dashboard routes are authenticated
dashboardRouter.use(requireAuth);

/**
 * GET /api/dashboard/teacher
 * Only allowing teachers or admins.
 */
dashboardRouter.get('/teacher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'teacher' && userRole !== 'admin') {
      throw AppError.forbidden('Only teachers can access the teacher dashboard');
    }

    const teacherId = (req as any).user?.id;
    if (!teacherId) throw AppError.unauthorized();

    const data = await getDashboardService().getTeacherDashboard(teacherId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/student
 * Only allowing students to access their own dashboard.
 */
dashboardRouter.get('/student', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = (req as any).user?.id;
    if (!studentId) throw AppError.unauthorized();

    const data = await getDashboardService().getStudentDashboard(studentId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
});
