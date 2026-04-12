/**
 * Application error class — carries HTTP status code + message.
 * Used throughout service and repository layers.
 */
export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
    static badRequest(message) {
        return new AppError(400, message, 'BAD_REQUEST');
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError(401, message, 'UNAUTHORIZED');
    }
    static forbidden(message = 'Forbidden') {
        return new AppError(403, message, 'FORBIDDEN');
    }
    static notFound(message) {
        return new AppError(404, message, 'NOT_FOUND');
    }
    static conflict(message) {
        return new AppError(409, message, 'CONFLICT');
    }
    static internalError(message = 'Internal server error') {
        return new AppError(500, message, 'INTERNAL_ERROR');
    }
}
export function handleError(error, res) {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code,
        });
        return;
    }
    console.error('Unhandled Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
    });
}
//# sourceMappingURL=errors.js.map