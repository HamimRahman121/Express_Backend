import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

const JWT_SECRET = required('JWT_SECRET');
if (JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 chars');

const PORT = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(PORT) || PORT <= 0) throw new Error('PORT must be a positive integer');

export const env = {
  PORT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};