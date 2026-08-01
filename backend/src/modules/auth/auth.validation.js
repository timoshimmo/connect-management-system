const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const resetPasswordParamsSchema = z.object({
  token: z.string().min(1),
});

module.exports = { loginSchema, forgotPasswordSchema, resetPasswordSchema, resetPasswordParamsSchema };
