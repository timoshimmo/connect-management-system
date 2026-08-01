const { z } = require('zod');

const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
});

module.exports = { createDepartmentSchema };
