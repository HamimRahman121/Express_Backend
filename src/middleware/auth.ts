import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db } from '../db/pool.js';
import { revokedTokens } from '../db/schema.js';

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing token' });

    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;

    const [revoked] = await db
      .select({ jti: revokedTokens.jti })
      .from(revokedTokens)
      .where(eq(revokedTokens.jti, payload.jti!))
      .limit(1);
    if (revoked) return res.status(401).json({ message: 'Token has been signed out' });

    req.user = { id: payload.sub!, role: payload.role, jti: payload.jti!, exp: payload.exp! };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole =
  (role: 'admin' | 'user'): RequestHandler =>
  (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };