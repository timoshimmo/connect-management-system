const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'STAC Management System API',
      version: '0.1.0',
      description:
        'Document and engineering-drawing lifecycle management: authoring, review, approval, publishing, ' +
        'the public Read Site, and the STAC Drawing Register — backing the STAC Management System frontend.',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: [path.join(__dirname, '../modules/**/*.routes.js')],
});

module.exports = spec;
