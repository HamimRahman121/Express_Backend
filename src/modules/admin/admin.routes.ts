import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listUsers, getUser, deleteUser } from './admin.controller.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.delete('/users/:id', deleteUser);

export default router;
