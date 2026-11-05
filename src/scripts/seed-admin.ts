import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, pool } from '../db/pool.js';
import { users } from '../db/schema.js';
import { env } from '../config/env.js';
import { signupSchema } from '../modules/auth/auth.schema.js';

try {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD missing in .env');

  const { email, password } = signupSchema.parse({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(users)
    .values({ email, passwordHash, role: 'admin' })
    .onConflictDoNothing({ target: users.email });

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.role !== 'admin') {
    throw new Error('Admin seed failed: email belongs to a non-admin account or no admin was found. No role was changed.');
  }

  console.log('Admin ready:', email);
} finally {
  await pool.end();
}
