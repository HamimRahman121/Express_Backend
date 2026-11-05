import type { RequestHandler } from 'express';
import { HttpError } from '../../utils/httpError.js';
import * as profileService from './profile.service.js';

const links = {
  self: { href: '/api/profile', method: 'GET' },
  update: { href: '/api/profile', method: 'PATCH' },
  signout: { href: '/api/auth/signout', method: 'POST' },
};

export const createProfile: RequestHandler = async (req, res) => {
  const profile = await profileService.createProfile(req.user!.id, req.body);
  res.status(201).json({ data: profile, _links: links });
};

export const getProfile: RequestHandler = async (req, res) => {
  const profile = await profileService.getProfile(req.user!.id);
  if (!profile) throw new HttpError(404, 'Profile not found', {
    create: { href: '/api/profile', method: 'POST' },
  });
  res.json({ data: profile, _links: links });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const profile = await profileService.updateProfile(req.user!.id, req.body);
  res.json({ data: profile, _links: links });
};
