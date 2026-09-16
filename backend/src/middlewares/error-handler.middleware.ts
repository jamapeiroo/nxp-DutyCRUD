import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../logger/logger';

// Known errors keep their status code. Anything else is a 500 without internal details.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  logger.error({ err: error }, 'Unexpected error');
  res.status(500).json({ error: 'Something went wrong' });
}
