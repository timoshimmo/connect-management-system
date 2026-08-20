const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
// pino-http self-references its factory function under both `.default` and
// `.pinoHttp` for dual CJS/ESM compatibility (confirmed locally: all three
// forms point at the same callable). Some bundlers' CJS/ESM interop —
// observed specifically on Vercel's build, not reproducible locally —
// unwrap the top-level require() into a plain object instead of leaving it
// callable, which made `pinoHttp({ logger })` below silently return an
// object instead of a middleware function and crash `app.use()`. Resolving
// explicitly here works under either shape.
const pinoHttpModule = require('pino-http');
const pinoHttp = typeof pinoHttpModule === 'function' ? pinoHttpModule : pinoHttpModule.default || pinoHttpModule.pinoHttp;
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./utils/logger');
const swaggerSpec = require('./docs/swagger');
const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { connectDatabase } = require('./config/database');

const app = express();

// Both Vercel and Netlify put the app behind a reverse proxy — without this,
// Express can't see the real client IP from X-Forwarded-For (req.ip falls
// back to the proxy's own internal address), which breaks per-IP rate
// limiting (express-rate-limit throws ERR_ERL_UNDEFINED_IP_ADDRESS on an
// unresolvable IP) and any secure-cookie/HTTPS detection that relies on it.
app.set('trust proxy', 1);

// This module (not server.js) is what Vercel imports directly as the
// Function entrypoint — see /vercel.json's services.backend.entrypoint —
// so the database connection has to be initiated here, not in server.js's
// listener setup, or every DB-backed route would fail in production.
// Not awaited: Mongoose buffers queries by default until the connection
// opens, so requests that arrive during a cold start simply wait rather
// than error, and the connection is reused across warm invocations of the
// same function instance.
connectDatabase().catch((err) => logger.error({ err }, 'MongoDB connection failed'));

// TEMPORARY diagnostic wrapper — pinpoints exactly which middleware factory
// isn't returning a function, instead of guessing from a compiled line
// number in Vercel's build output that doesn't map cleanly back to source.
// Remove once the actual cause is confirmed.
function safeUse(name, mw) {
  // swagger-ui-express's `.serve` is legitimately an array of middleware
  // (Express's own app.use() flattens arrays) — check each element.
  const bad = Array.isArray(mw) ? mw.filter((fn) => typeof fn !== 'function') : typeof mw === 'function' ? [] : [mw];
  if (bad.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[safeUse] "${name}" has a non-function value — got:`, Array.isArray(mw) ? mw.map((fn) => typeof fn) : typeof mw, mw);
    throw new Error(`Middleware "${name}" is not a function/array-of-functions (got ${Array.isArray(mw) ? 'array with a non-function element' : typeof mw})`);
  }
  return mw;
}

app.use(safeUse('helmet', helmet()));
app.use(
  safeUse(
    'cors',
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  )
);
app.use(safeUse('compression', compression()));
app.use(safeUse('cookieParser', cookieParser()));
app.use(safeUse('express.json', express.json()));
app.use(safeUse('pinoHttp', pinoHttp({ logger })));
app.use('/api', safeUse('apiLimiter', apiLimiter));

app.use('/api/docs', safeUse('swaggerUi.serve', swaggerUi.serve), safeUse('swaggerUi.setup', swaggerUi.setup(swaggerSpec)));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', safeUse('routes', routes));

app.use(safeUse('notFound', notFound));
app.use(safeUse('errorHandler', errorHandler));

module.exports = app;
