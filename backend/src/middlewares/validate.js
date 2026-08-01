const { BadRequestError } = require('../common/errors');

/**
 * Validates req.body/query/params against zod schemas.
 * Usage: `validate({ body: createDocumentSchema })`.
 */
function validate(schemas) {
  return (req, res, next) => {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        return next(new BadRequestError(message));
      }
      req[key] = result.data;
    }
    next();
  };
}

module.exports = { validate };
