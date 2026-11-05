import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { signupSchema, signinSchema } from './auth.schema.js';
import { signup, signin, signout } from './auth.controller.js';

const router = Router();
router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/signin', authLimiter, validate(signinSchema), signin);
router.post('/signout', requireAuth, signout);

export default router;
