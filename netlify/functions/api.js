// Wraps the same Express app used everywhere else (local dev via server.js,
// Vercel via vercel.json's services.backend.entrypoint) as a Netlify
// Function. connectDatabase() is already called on module load inside
// app.js — Mongoose buffers queries until it connects, and the connection
// is reused across warm invocations of this function, same as on Vercel.
const serverless = require('serverless-http');
const app = require('../../backend/src/app');

module.exports.handler = serverless(app);
