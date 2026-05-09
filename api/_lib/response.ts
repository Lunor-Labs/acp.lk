import type { VercelResponse } from '@vercel/node';
import { AppError } from '../../backend/src/utils/errors.js';

export function sendSuccess<T>(res: VercelResponse, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function handleError(error: unknown, res: VercelResponse): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
    return;
  }
  console.error('[API Error]', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
