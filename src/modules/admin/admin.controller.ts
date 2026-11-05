import type { RequestHandler } from 'express';
import { HttpError } from '../../utils/httpError.js';
import { uuidSchema } from './admin.schema.js';
import * as adminService from './admin.service.js';

export const listUsers: RequestHandler = async (_req, res) => {
  const rows = await adminService.listUsers();
  res.json({
    data: rows.map(user => ({
      ...user,
      _links: { self: { href: `/api/admin/users/${user.id}`, method: 'GET' } },
    })),
    _links: { self: { href: '/api/admin/users', method: 'GET' } },
  });
};

export const getUser: RequestHandler = async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id);
  if (!id.success) throw new HttpError(400, 'Invalid user id');
  const user = await adminService.getUser(id.data);
  res.json({
    data: user,
    _links: {
      self: { href: `/api/admin/users/${id.data}`, method: 'GET' },
      collection: { href: '/api/admin/users', method: 'GET' },
    },
  });
};

export const deleteUser: RequestHandler = async (req, res) => {
  const id = uuidSchema.safeParse(req.params.id);
  if (!id.success) throw new HttpError(400, 'Invalid user id');
  await adminService.deleteUser(id.data, req.user!.id);
  res.status(204).end();
};
