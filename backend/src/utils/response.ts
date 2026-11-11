import type { Response } from 'express';
import { AppError } from './errors.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/** Send a successful JSON response */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

/** Send a created (201) response */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

/** Send a no-content (204) response */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/** Send an error JSON response */
export function sendError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code || 'ERROR',
        message: error.message,
      },
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Unexpected error — log and return generic 500
  console.error('[Unhandled Error]', error);
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}
