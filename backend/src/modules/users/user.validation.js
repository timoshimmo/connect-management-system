const { z } = require('zod');
const { ROLES, STATUSES } = require('./user.model');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(ROLES),
  department: objectId.optional().nullable(),
  status: z.enum(STATUSES).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Enter a valid email address').optional(),
  role: z.enum(ROLES).optional(),
  department: objectId.optional().nullable(),
  status: z.enum(STATUSES).optional(),
  jobTitle: z.string().optional(),
});

module.exports = { updateRoleSchema, createUserSchema, updateUserSchema };
