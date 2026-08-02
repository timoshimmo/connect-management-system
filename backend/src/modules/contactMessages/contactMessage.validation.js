const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const createContactMessageSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  department: objectId.optional(),
  relatedDocument: objectId.optional(),
});

module.exports = { createContactMessageSchema };
