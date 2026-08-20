// Same CJS/ESM interop hazard as pino-http in app.js — pino self-references
// its factory under `.default`/`.pino` for dual compatibility, and some
// bundlers unwrap the top-level require() into a non-callable object
// instead. Resolve explicitly so this works under either shape.
const pinoModule = require('pino');
const pino = typeof pinoModule === 'function' ? pinoModule : pinoModule.default || pinoModule.pino;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

module.exports = logger;
