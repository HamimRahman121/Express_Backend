import type { RequestHandler } from 'express';
import * as authService from './auth.service.js';

export const signup: RequestHandler = async (req, res) => {
  const user = await authService.signup(req.body);
  res.status(201).json({
    data: user,
    _links: {
      self: { href: '/api/auth/signup', method: 'POST' },
      signin: { href: '/api/auth/signin', method: 'POST' },
    },
  });
};

export const signin: RequestHandler = async (req, res) => {
  const data = await authService.signin(req.body);
  res.json({
    data,
    _links: {
      self: { href: '/api/auth/signin', method: 'POST' },
      profile: { href: '/api/profile', method: 'GET' },
      create_profile: { href: '/api/profile', method: 'POST' },
      signout: { href: '/api/auth/signout', method: 'POST' },
      ...(data.user.role === 'admin' && { users: { href: '/api/admin/users', method: 'GET' } }),
    },
  });
};

export const signout: RequestHandler = async (req, res) => {
  await authService.signout(req.user!);
  res.json({
    message: 'Signed out successfully',
    _links: { signin: { href: '/api/auth/signin', method: 'POST' } },
  });
};
