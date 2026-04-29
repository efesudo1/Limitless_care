import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http';

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Geçersiz veri', issues: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err && typeof err === 'object' && 'code' in err && (err as any).code === 'P2002') {
    return res.status(409).json({ error: 'Zaten kayıtlı' });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({ error: 'Sunucu hatası' });
};
