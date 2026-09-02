import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime?: number;
    }
  }
}

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-correlation-id'] as string) || randomUUID();
  req.correlationId = id;
  req.startTime = Date.now();

  // Set response header so clients can correlate
  res.setHeader('X-Correlation-Id', id);
  res.setHeader('X-Request-Id', id);

  next();
}
