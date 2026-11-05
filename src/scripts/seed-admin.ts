import bcrypt from 'bcryptjs';
import { db, pool } from '../db/pool.js';
import { users } from '../db/schema.js';
import { env } from '../config/env.js';

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD missing in .env');

const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
await db
  .insert(users)
  .values({ email: env.ADMIN_EMAIL.toLowerCase(), passwordHash, role: 'admin' })
  .onConflictDoNothing({ target: users.email });

console.log('Admin ready:', env.ADMIN_EMAIL);
await pool.end();