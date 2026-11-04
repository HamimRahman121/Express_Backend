import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool.js';
import { users, revokedTokens } from '../db/schema.js';
import { isUniqueViolation } from '../db/errors.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { signupSchema, signinSchema } from '../validators.js';

const router = Router();

// brute-force thekate: signup/signin-e kora limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many attempts, try again later' },
});

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash }) // role default 'user', client dite pare na
      .returning({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt });

    res.status(201).json({
      data: user,
      _links: {
        self: { href: '/api/auth/signup', method: 'POST' },
        signin: { href: '/api/auth/signin', method: 'POST' },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: 'Email already registered' });
    throw e;
  }
});

router.post('/signin', authLimiter, validate(signinSchema), async (req, res) => {
  const { email, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // user na thakleo compare kori, jate response time diye email enumerate na kora jay
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    jwtid: randomUUID(),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  res.json({
    data: { token, token_type: 'Bearer', user: { id: user.id, email: user.email, role: user.role } },
    _links: {
      self: { href: '/api/auth/signin', method: 'POST' },
      profile: { href: '/api/profile', method: 'GET' },
      create_profile: { href: '/api/profile', method: 'POST' },
      signout: { href: '/api/auth/signout', method: 'POST' },
      ...(user.role === 'admin' && { users: { href: '/api/admin/users', method: 'GET' } }),
    },
  });
});

router.post('/signout', requireAuth, async (req, res) => {
  await db
    .insert(revokedTokens)
    .values({ jti: req.user!.jti, expiresAt: new Date(req.user!.exp * 1000) })
    .onConflictDoNothing();

  res.json({
    message: 'Signed out successfully',
    _links: { signin: { href: '/api/auth/signin', method: 'POST' } },
  });
});

export default router;