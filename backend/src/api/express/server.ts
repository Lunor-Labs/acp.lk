import express, { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { handleError } from '../../utils/errors.js';
import { authRouter } from './routes/auth.routes.js';
import { coursesRouter } from './routes/courses.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { usersRouter } from './routes/users.routes.js';
import cors from 'cors';

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow any localhost origin or the configured FRONTEND_URL in development
    if (!origin || origin.startsWith('http://localhost:') || origin === env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  handleError(err, res);
});

// ─── Boot ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`   Auth:    /api/auth/signin | /api/auth/me`);
    console.log(`   Signup:  /api/auth/signup/otp | /api/auth/signup/verify`);
    console.log(`   Reset:   /api/auth/reset/otp  | /api/auth/reset/verify`);
    console.log(`   Courses: /api/courses`);
    console.log(`   Users:   /api/users/me`);
  });
}

export default app;
