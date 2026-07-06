const nodemailer = require('nodemailer');
const { buildReviewEmail } = require('./emailFormatter');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;

  const port = parseInt(SMTP_PORT || '587', 10);

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  return cachedTransporter;
}

/**
 * Sends a notification email summarizing the PR and the LLM's proposed
 * review. Designed to never throw on missing config — it just skips,
 * so a lead can opt in later without code changes.
 *
 * Required env vars to actually send:
 *   EMAIL_NOTIFICATIONS_ENABLED=true
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   NOTIFY_EMAIL_TO=someone@example.com,other@example.com
 */
async function sendReviewEmail(state) {
  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'true') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS_ENABLED is not "true"' };
  }

  const to = process.env.NOTIFY_EMAIL_TO;
  if (!to) {
    return { skipped: true, reason: 'NOTIFY_EMAIL_TO is not configured' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { skipped: true, reason: 'SMTP_HOST is not configured' };
  }

  const { subject, text, html } = buildReviewEmail(state);

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, messageId: info.messageId, to };
}

module.exports = { sendReviewEmail };
