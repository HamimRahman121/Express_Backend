import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '../config/env.js';
import { db } from '../db/pool.js';
import { revokedTokens } from '../db/schema.js';

const accessTokenSchema = z.object({
  sub: z.uuid(),
  jti: z.uuid(),
  role: z.enum(['admin', 'user']),
  exp: z.number().int().positive(),
});

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

  let payload: z.infer<typeof accessTokenSchema>;
  try {
    payload = accessTokenSchema.parse(
      jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] }),
    );
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const [revoked] = await db
      .select({ jti: revokedTokens.jti })
      .from(revokedTokens)
      .where(eq(revokedTokens.jti, payload.jti))
      .limit(1);
    if (revoked) return res.status(401).json({ message: 'Token has been signed out' });
  } catch (error) {
    return next(error);
  }

  req.user = { id: payload.sub, role: payload.role, jti: payload.jti, exp: payload.exp };
  next();
};

export const requireRole =
  (role: 'admin' | 'user'): RequestHandler =>
  (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
