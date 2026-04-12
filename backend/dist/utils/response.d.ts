import type { Response } from 'express';
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
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: ApiResponse['meta']): void;
/** Send a created (201) response */
export declare function sendCreated<T>(res: Response, data: T): void;
/** Send a no-content (204) response */
export declare function sendNoContent(res: Response): void;
/** Send an error JSON response */
export declare function sendError(res: Response, error: unknown): void;
//# sourceMappingURL=response.d.ts.map