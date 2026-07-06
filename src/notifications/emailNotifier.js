const nodemailer = require('nodemailer');
const net = require('net');
const dns = require('dns').promises;
const { buildReviewEmail } = require('./emailFormatter');

/**
 * Resolves a hostname to an IPv4 address.
 *
 * Why: nodemailer's built-in resolver looks up both A and AAAA records and
 * then picks ONE AT RANDOM to connect to (see nodemailer/lib/shared/index.js
 * formatDNSValue). On hosts like Render, the container reports a local IPv6
 * interface even though there's no real outbound IPv6 routing — so roughly
 * half the time nodemailer picks an IPv6 address and the connection fails
 * with ENETUNREACH. Resolving to IPv4 ourselves and connecting to that
 * literal IP sidesteps nodemailer's resolver entirely.
 */
async function resolveIPv4Host(hostname) {
  if (net.isIP(hostname)) return hostname; // already a literal IP
  const addresses = await dns.resolve4(hostname);
  if (!addresses || addresses.length === 0) {
    throw new Error(`No IPv4 (A) record found for ${hostname}`);
  }
  return addresses[0];
}

/**
 * Builds a fresh transporter per send. SMTP provider IPs can change, and
 * sending review emails is infrequent enough that a DNS lookup per email
 * (a few ms) is not worth the complexity of a TTL'd cache.
 */
async function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;

  const port = parseInt(SMTP_PORT || '587', 10);
  const ipv4Host = await resolveIPv4Host(SMTP_HOST);

  return nodemailer.createTransport({
    host: ipv4Host,
    port,
    secure: port === 465, // true for 465 (implicit TLS), false for 587/25 (STARTTLS)
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    tls: {
      // Connecting to a literal IP means TLS has no hostname to validate
      // the certificate against — servername restores that, using the
      // original hostname (e.g. smtp.gmail.com), so cert validation still
      // works correctly.
      servername: SMTP_HOST,
    },
  });
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

  let transporter;
  try {
    transporter = await getTransporter();
  } catch (err) {
    return { sent: false, error: `IPv4 resolution failed for SMTP_HOST: ${err.message}` };
  }
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
