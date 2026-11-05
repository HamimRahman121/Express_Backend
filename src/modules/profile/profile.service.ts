import { eq } from 'drizzle-orm';
import { db } from '../../db/pool.js';
import { profiles } from '../../db/schema.js';
import { isUniqueViolation } from '../../db/errors.js';
import { HttpError } from '../../utils/httpError.js';
import type { CreateProfileInput, UpdateProfileInput } from './profile.schema.js';

export async function createProfile(userId: string, input: CreateProfileInput) {
  try {
    const [profile] = await db.insert(profiles)
      .values({ userId, fullName: input.full_name, phone: input.phone, bio: input.bio })
      .returning();
    return profile;
  } catch (error) {
    if (isUniqueViolation(error)) throw new HttpError(409, 'Profile already exists, use PATCH');
    throw error;
  }
}

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return profile;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const [profile] = await db.update(profiles)
    .set({ fullName: input.full_name, phone: input.phone, bio: input.bio, updatedAt: new Date() })
    .where(eq(profiles.userId, userId)).returning();
  if (!profile) throw new HttpError(404, 'Profile not found');
  return profile;
}
