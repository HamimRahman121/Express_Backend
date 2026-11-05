import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../../db/pool.js';
import { users, revokedTokens } from '../../db/schema.js';
import { isUniqueViolation } from '../../db/errors.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/httpError.js';
import type { SignupInput, SigninInput } from './auth.schema.js';

// Compare a hash even for unknown accounts to reduce timing differences.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

export async function signup(input: SignupInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const [user] = await db.insert(users)
      .values({ email: input.email, passwordHash })
      .returning({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt });
    return user;
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, 'Email already registered');
    throw error;
  }
}

export async function signin(input: SigninInput) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  const ok = await bcrypt.compare(input.password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    jwtid: randomUUID(),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  return { token, token_type: 'Bearer', user: { id: user.id, email: user.email, role: user.role } };
}

export async function signout(identity: { jti: string; exp: number }) {
  await db.insert(revokedTokens)
    .values({ jti: identity.jti, expiresAt: new Date(identity.exp * 1000) })
    .onConflictDoNothing();
}
