import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.links && { _links: err.links }),
    });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ message: 'Payload too large' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' }); // stack trace leak korbo na
};
