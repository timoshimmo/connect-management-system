const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createCommentSchema = z.object({
  targetType: z.enum(['document']),
  targetId: objectId,
  body: z.string().min(1),
});

const listQuerySchema = z.object({
  targetType: z.enum(['document']),
  targetId: objectId,
});

module.exports = { createCommentSchema, listQuerySchema };
