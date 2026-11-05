import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(255).pipe(z.email());

const newPassword = z
  .string()
  .min(8, 'Min 8 characters')
  .max(72, 'Max 72 characters')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Max 72 UTF-8 bytes')
  .regex(/[a-z]/, 'Need a lowercase letter')
  .regex(/[A-Z]/, 'Need an uppercase letter')
  .regex(/[0-9]/, 'Need a number');

// .strict() = extra field (jemon "role") dile reject
export const signupSchema = z.object({ email, password: newPassword }).strict();

export const signinSchema = z
  .object({
    email,
    password: z.string().min(1).max(72)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Max 72 UTF-8 bytes'),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
