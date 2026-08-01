const { z } = require('zod');
const { STATUSES } = require('./drawingRegisterUser.model');

const createDrawingRegisterUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  status: z.enum(STATUSES).optional(),
  jobTitle: z.string().optional(),
});

const updateDrawingRegisterUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Enter a valid email address').optional(),
  status: z.enum(STATUSES).optional(),
  jobTitle: z.string().optional(),
});

const resetDrawingRegisterUserPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

module.exports = {
  createDrawingRegisterUserSchema,
  updateDrawingRegisterUserSchema,
  resetDrawingRegisterUserPasswordSchema,
};
