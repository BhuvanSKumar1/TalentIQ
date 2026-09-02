import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected errors
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');

  res.status(500).json({
    error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode: 500,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  // In production, don't expose the full route path to prevent reconnaissance
  const message = process.env.NODE_ENV === 'production'
    ? `${req.method} not found`
    : `Route ${req.method} ${req.originalUrl} not found`;
  res.status(404).json({
    error: message,
    statusCode: 404,
  });
}
