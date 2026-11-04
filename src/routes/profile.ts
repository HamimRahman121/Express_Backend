import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/pool.js';
import { profiles } from '../db/schema.js';
import { isUniqueViolation } from '../db/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createProfileSchema, updateProfileSchema } from '../validators.js';

const router = Router();
router.use(requireAuth);

const links = {
  self: { href: '/api/profile', method: 'GET' },
  update: { href: '/api/profile', method: 'PATCH' },
  signout: { href: '/api/auth/signout', method: 'POST' },
};

router.post('/', validate(createProfileSchema), async (req, res) => {
  const { full_name, phone, bio } = req.body;
  try {
    const [profile] = await db
      .insert(profiles)
      .values({ userId: req.user!.id, fullName: full_name, phone, bio }) // userId always token theke
      .returning();
    res.status(201).json({ data: profile, _links: links });
  } catch (e) {
    if (isUniqueViolation(e)) return res.status(409).json({ message: 'Profile already exists, use PATCH' });
    throw e;
  }
});

router.get('/', async (req, res) => {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, req.user!.id)).limit(1);
  if (!profile) {
    return res.status(404).json({
      message: 'Profile not found',
      _links: { create: { href: '/api/profile', method: 'POST' } },
    });
  }
  res.json({ data: profile, _links: links });
});

router.patch('/', validate(updateProfileSchema), async (req, res) => {
  const { full_name, phone, bio } = req.body;
  const [profile] = await db
    .update(profiles)
    .set({ fullName: full_name, phone, bio, updatedAt: new Date() }) // undefined field Drizzle ignore kore
    .where(eq(profiles.userId, req.user!.id))
    .returning();
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  res.json({ data: profile, _links: links });
});

export default router;