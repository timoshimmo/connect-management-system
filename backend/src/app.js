const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./utils/logger');
const swaggerSpec = require('./docs/swagger');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { connectDatabase } = require('./config/database');

const app = express();

// This module (not server.js) is what Vercel imports directly as the
// Function entrypoint — see /vercel.json's services.backend.entrypoint —
// so the database connection has to be initiated here, not in server.js's
// listener setup, or every DB-backed route would fail in production.
// Not awaited: Mongoose buffers queries by default until the connection
// opens, so requests that arrive during a cold start simply wait rather
// than error, and the connection is reused across warm invocations of the
// same function instance.
connectDatabase().catch((err) => logger.error({ err }, 'MongoDB connection failed'));

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use('/api', apiLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
