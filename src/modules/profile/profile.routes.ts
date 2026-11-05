import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createProfileSchema, updateProfileSchema } from './profile.schema.js';
import { createProfile, getProfile, updateProfile } from './profile.controller.js';

const router = Router();
router.use(requireAuth);
router.post('/', validate(createProfileSchema), createProfile);
router.get('/', getProfile);
router.patch('/', validate(updateProfileSchema), updateProfile);

export default router;
