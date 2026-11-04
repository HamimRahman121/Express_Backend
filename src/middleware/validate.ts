import { RequestHandler } from 'express';
import { ZodType } from 'zod';

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body); // fail korle ZodError throw -> error handler
    next();
  };