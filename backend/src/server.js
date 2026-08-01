const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDatabase } = require('./config/database');

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed — starting server anyway; DB-backed routes will fail until it connects');
  }

  app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port} (docs at /api/docs)`);
  });
}

start();
