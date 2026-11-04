import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';      // <-- NOTUN

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));

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
app.use('/api/profile', profileRoutes);               // <-- NOTUN

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);