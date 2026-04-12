import express, { Request, Response, NextFunction } from 'express';
import { env } from '../../../config/env.js';
import { handleError } from '../../../utils/errors.js';
import { authRouter } from './routes/auth.routes.js';
import { coursesRouter } from './routes/courses.routes.js';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  handleError(err, res);
});

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
  });
}

export default app;
