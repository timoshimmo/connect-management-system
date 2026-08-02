const { z } = require('zod');
const { STATUSES } = require('./discipline.model');

const createDisciplineSchema = z.object({
  name: z.string().min(1),
  status: z.enum(STATUSES).optional(),
});

const updateDisciplineSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(STATUSES).optional(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

module.exports = { createDisciplineSchema, updateDisciplineSchema, listQuerySchema };
