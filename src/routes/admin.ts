import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/pool.js';
import { users, profiles } from '../db/schema.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uuidSchema } from '../validators.js';

const router = Router();
router.use(requireAuth, requireRole('admin')); // age authentication, tarpor authorization

router.get('/users', async (_req, res) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      fullName: profiles.fullName,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(100);

  res.json({
    data: rows.map((u) => ({ ...u, _links: { self: { href: `/api/admin/users/${u.id}`, method: 'GET' } } })),
    _links: { self: { href: '/api/admin/users', method: 'GET' } },
  });
});

router.get('/users/:id', async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: 'Invalid user id' });

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      fullName: profiles.fullName,
      phone: profiles.phone,
      bio: profiles.bio,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, id.data))
    .limit(1);

  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    data: user,
    _links: {
      self: { href: `/api/admin/users/${id.data}`, method: 'GET' },
      collection: { href: '/api/admin/users', method: 'GET' },
    },
  });
});

export default router;