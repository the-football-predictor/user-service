import * as z from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(100, "Username must be at most 100 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long").max(100, "Password must be at most 100 characters long"),
  }),
});

export const updateUserProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long").max(100, "Username must be at most 100 characters long").optional(),
    email: z.string().email("Invalid email address").optional(),
  }).refine(data => data.username || data.email, { message: "At least one field (username or email) must be provided for update." })
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long").max(100, "Password must be at most 100 characters long"),
  }),
});
