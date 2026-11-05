import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(apiLimiter);

app.get('/api', (_req, res) => {
  res.json({
    message: 'Auth API',
    _links: {
      self: { href: '/api', method: 'GET' },
      signup: { href: '/api/auth/signup', method: 'POST' },
      signin: { href: '/api/auth/signin', method: 'POST' },
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);         
app.use('/api/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);
