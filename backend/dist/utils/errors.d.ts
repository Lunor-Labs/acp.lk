/**
 * Application error class — carries HTTP status code + message.
 * Used throughout service and repository layers.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
    static badRequest(message: string): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(message: string): AppError;
    static conflict(message: string): AppError;
    static internalError(message?: string): AppError;
}
import { Response } from 'express';
export declare function handleError(error: unknown, res: Response): void;
//# sourceMappingURL=errors.d.ts.map