const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

// app.js already initiates the MongoDB connection on module load (needed
// there since that's the file Vercel imports directly) — this file just
// starts the local HTTP listener on top of it for `npm run dev`/`npm start`.
app.listen(env.port, () => {
  logger.info(`API listening on http://localhost:${env.port} (docs at /api/docs)`);
});
