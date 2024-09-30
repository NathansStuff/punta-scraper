import { NextFunction, Request, Response } from 'express';
import CustomError from 'src/exceptions/CustomError';
import { ZodError } from 'zod';

type MiddlewareFunction<T = Record<string, string>> = (
    req: Request<T>,
    res: Response,
    next: NextFunction
) => Promise<void>;

export function TryCatchMiddleware<T = Record<string, string>>(
    middlewareFn: MiddlewareFunction<T>
): MiddlewareFunction<T> {
    return async (req: Request<T>, res: Response, next: NextFunction): Promise<void> => {
        try {
            await middlewareFn(req, res, next);
        } catch (error) {
            if (error instanceof CustomError) {
                res.status(error.statusCode).json({
                    status: error.status,
                    error: error.message,
                });
            } else if (error instanceof ZodError) {
                const parsedErrors = JSON.parse(error.message);
                // Map over the parsed errors and create a formatted string for each
                const formattedErrors = parsedErrors.map(
                    (err: {
                        code?: string;
                        expected?: string;
                        received?: string;
                        path?: string[];
                        message?: string;
                    }) => {
                        let errorMessage = '';

                        if (err.path && Array.isArray(err.path)) errorMessage += `Path: ${err.path.join('.')}. `;
                        if (err.code) errorMessage += `Code: ${err.code}. `;
                        if (err.expected) errorMessage += `Expected: ${err.expected}. `;
                        if (err.received) errorMessage += `Received: ${err.received}. `;
                        if (err.message) errorMessage += `Message: ${err.message}.`;

                        return errorMessage;
                    }
                );
                res.status(422).json({
                    message: `Bad Request. Errors:`,
                    errors: formattedErrors,
                });
            } else if (error instanceof Error) {
                if (error.message) {
                    if (error.message.includes('E11000')) {
                        // This is a duplicate key error
                        res.status(400).json({
                            message:
                                'A record with the given identifier already exists. Please use a unique identifier.',
                        });
                    } else {
                        // This is some other internal error
                        res.status(500).json({
                            message: `Internal error. Error: ${error.message}`,
                        });
                    }
                } else {
                    // This is some other internal error
                    res.status(500).json({
                        message: `Internal error. Error: ${error}`,
                    });
                }
            } else {
                res.status(500).json({
                    message: `Internal error. Error: ${error}`,
                });
            }
        }
    };
}
