import express, { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { handleError } from '../../utils/errors.js';
import { authRouter } from './routes/auth.routes.js';
import { coursesRouter } from './routes/courses.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { enrollmentRouter } from './routes/enrollments.routes.js';
import { examsRouter } from './routes/exams.routes.js';
import { studyPacksRouter } from './routes/studypacks.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { galleryRouter } from './routes/gallery.routes.js';
import { reviewsRouter } from './routes/reviews.routes.js';
import { successRouter } from './routes/success.routes.js';
import { rankListsRouter } from './routes/rank-lists.routes.js';
import { mediaRouter } from './routes/media.routes.js';
import cors from 'cors';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = env.ALLOWED_ORIGINS
  ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

const previewPattern = /^https:\/\/acp-lk-[a-z0-9-]+-lunor-labs\.vercel\.app$/;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (previewPattern.test(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());
app.use('/media', mediaRouter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/exams', examsRouter);
app.use('/api/studypacks', studyPacksRouter);
app.use('/api/files', filesRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/success', successRouter);
app.use('/api/rank-lists', rankListsRouter);

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
    console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

export default app;