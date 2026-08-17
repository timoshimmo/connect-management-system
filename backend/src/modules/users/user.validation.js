const { z } = require('zod');
const { ROLES, STATUSES } = require('./user.model');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  // Optional — a Controller can create a placeholder account for someone
  // who'll only ever sign in with Microsoft SSO (see auth/microsoft.service.js,
  // which fills passwordHash in separately, or never at all).
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  // Optional/nullable — an account can be created with no role yet
  // ("Pending"), same as a first-time Microsoft SSO signup.
  role: z.enum(ROLES).nullable().optional(),
  department: objectId.optional().nullable(),
  status: z.enum(STATUSES).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Enter a valid email address').optional(),
  role: z.enum(ROLES).nullable().optional(),
  department: objectId.optional().nullable(),
  status: z.enum(STATUSES).optional(),
  jobTitle: z.string().optional(),
});

module.exports = { updateRoleSchema, createUserSchema, updateUserSchema };
