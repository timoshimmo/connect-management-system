const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

/**
 * Sends via SMTP (Zoho Mail by default — see .env.example) whenever
 * credentials are configured; falls back to just logging the intent when
 * they aren't, so local dev never needs a real mailbox. Callers should never
 * assume delivery succeeded either way — the password-reset flow
 * deliberately doesn't reveal whether the send "worked" to avoid leaking
 * whether an email address has an account.
 */
async function sendMail({ to, subject, text }) {
  const transport = getTransporter();
  if (!transport) {
    logger.info({ to, subject, text }, 'mailer: email not actually sent (no SMTP configured)');
    return;
  }
  try {
    await transport.sendMail({ from: env.smtp.fromAddress || env.smtp.user, to, subject, text });
  } catch (err) {
    logger.error({ err, to, subject }, 'mailer: failed to send email');
  }
}

module.exports = { sendMail };
