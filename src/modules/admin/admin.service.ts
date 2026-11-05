import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/pool.js';
import { users, profiles } from '../../db/schema.js';
import { HttpError } from '../../utils/httpError.js';

export async function listUsers() {
  return db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    fullName: profiles.fullName,
  }).from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(users.createdAt)).limit(100);
}

export async function getUser(id: string) {
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    fullName: profiles.fullName,
    phone: profiles.phone,
    bio: profiles.bio,
  }).from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, id)).limit(1);
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

export async function deleteUser(id: string, adminId: string) {
  if (id.toLowerCase() === adminId.toLowerCase()) {
    throw new HttpError(403, 'You cannot delete your own account');
  }

  // PostgreSQL cascades the deletion to the user's profile.
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (!deleted) throw new HttpError(404, 'User not found');
}
