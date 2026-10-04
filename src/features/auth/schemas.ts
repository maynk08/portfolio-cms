import { z } from 'zod';

// Shared by the login form and the login action; the backend validates again.
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address').pipe(z.email('Enter a valid email address, like name@example.com')),
  password: z.string().min(1, 'Enter your password'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const adminSchema = z.object({
  id: z.string(),
  email: z.string(),
  lastLoginAt: z.string().nullable(),
});

export type Admin = z.infer<typeof adminSchema>;

export const loginResultSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.coerce.date(),
  admin: adminSchema,
});
