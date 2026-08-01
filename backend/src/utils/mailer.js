const logger = require('./logger');

/**
 * No SMTP credentials were provided, so "sending" an email just logs the
 * intent — swap this for a real provider (SES, Postmark, SMTP...) once
 * credentials exist. Callers should never assume delivery succeeded either
 * way; the password-reset flow deliberately doesn't reveal whether the send
 * "worked" to avoid leaking whether an email address has an account.
 */
async function sendMail({ to, subject, text }) {
  logger.info({ to, subject, text }, 'mailer: email not actually sent (no SMTP configured)');
}

module.exports = { sendMail };
