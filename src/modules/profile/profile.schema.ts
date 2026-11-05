import { z } from 'zod';

export const createProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(100),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone').optional(),
    bio: z.string().trim().max(500).optional(),
  })
  .strict();

export const updateProfileSchema = createProfileSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'At least one field required');

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
