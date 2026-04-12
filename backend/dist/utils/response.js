import { AppError } from './errors.js';
/** Send a successful JSON response */
export function sendSuccess(res, data, statusCode = 200, meta) {
    const response = { success: true, data };
    if (meta)
        response.meta = meta;
    res.status(statusCode).json(response);
}
/** Send a created (201) response */
export function sendCreated(res, data) {
    sendSuccess(res, data, 201);
}
/** Send a no-content (204) response */
export function sendNoContent(res) {
    res.status(204).send();
}
/** Send an error JSON response */
export function sendError(res, error) {
    if (error instanceof AppError) {
        const response = {
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
    const response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    };
    res.status(500).json(response);
}
//# sourceMappingURL=response.js.map