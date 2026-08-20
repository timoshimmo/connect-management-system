/* eslint-disable no-console */
/**
 * One-off manual check: send a real email through the configured SMTP
 * transport to confirm the Zoho credentials actually work end-to-end
 * (nodemailer's sendMail() doesn't throw on auth failure by default in
 * mailer.js — it just logs — so this calls the transporter directly to
 * surface any error instead of swallowing it).
 *
 * Usage: node src/database/testSmtp.js <recipient-email>
 */
require('dotenv').config();
const nodemailer = require('nodemailer');
const env = require('../config/env');
const { renderEmail } = require('../utils/emailTemplates');

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: node src/database/testSmtp.js <recipient-email>');
    process.exitCode = 1;
    return;
  }
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    console.error('SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing from .env).');
    process.exitCode = 1;
    return;
  }

  const transport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  console.log('Verifying SMTP connection/auth...');
  await transport.verify();
  console.log('SMTP connection verified.');

  console.log(`Sending test email to ${to}...`);
  const info = await transport.sendMail({
    from: env.smtp.fromAddress || env.smtp.user,
    to,
    subject: 'STAC Management System SMTP test',
    text: `This is a test email confirming the Zoho SMTP configuration works.\n\nSent at: ${new Date().toISOString()}`,
    html: renderEmail({
      title: 'SMTP Test',
      bodyText: `This is a test email confirming the Zoho SMTP configuration works, styled with the new email template.\n\nSent at: ${new Date().toISOString()}`,
      cta: { label: 'Open STAC Management System', url: env.frontendUrl },
      preheader: 'Zoho SMTP + new HTML template test.',
    }),
  });
  console.log('Sent:', info.messageId, info.response);
}

main().catch((err) => {
  console.error('SMTP test failed:', err);
  process.exitCode = 1;
});
