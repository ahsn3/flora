/* Email sender for PIN verification.
 *
 * Railway blocks or breaks Gmail SMTP (IPv6 ENETUNREACH, port restrictions).
 * Recommended for production: set RESEND_API_KEY (HTTPS, always works).
 *
 * Fallback: SMTP_* env vars with explicit IPv4 resolution.
 * Dev: if neither is set, PINs are logged to the console.
 */

const nodemailer = require('nodemailer');
const dns = require('dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {
  /* older Node */
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Flora & Gifts <onboarding@resend.dev>';

const HOST = process.env.SMTP_HOST;
const PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || 'Flora & Gifts <no-reply@flora.local>';
const SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || PORT === 465;

const useResend = Boolean(RESEND_API_KEY);
const useSmtp = Boolean(HOST && USER && PASS);
/** True when real emails can be sent (Resend or SMTP) */
const emailEnabled = useResend || useSmtp;
/** @deprecated use emailEnabled */
const smtpEnabled = emailEnabled;

let transporter = null;
let transportReady = null;

async function createSmtpTransport() {
  const cleanPass = String(PASS).replace(/\s+/g, '');
  const { address } = await dns.promises.lookup(HOST, { family: 4 });
  console.log(`SMTP using IPv4 ${address} for ${HOST}:${PORT}`);
  return nodemailer.createTransport({
    host: address,
    port: PORT,
    secure: SECURE,
    auth: { user: USER, pass: cleanPass },
    tls: { servername: HOST, minVersion: 'TLSv1.2' },
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  });
}

async function getTransporter() {
  if (transporter) return transporter;
  if (!transportReady) {
    transportReady = createSmtpTransport().then((t) => {
      transporter = t;
      return t;
    });
  }
  return transportReady;
}

function pinEmailHtml(pin, email) {
  const safePin = String(pin).replace(/[^0-9]/g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fff8f5;font-family:'Source Sans 3',Arial,sans-serif;color:#1e1b18;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fff8f5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(98,20,40,0.08);">
        <tr><td style="background-color:#621428;padding:32px;text-align:center;">
          <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#ffffff;font-size:32px;font-weight:400;letter-spacing:-0.5px;">Flora &amp; Gifts</h1>
          <p style="margin:8px 0 0;color:#ffd9dd;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Botanical Poetry</p>
        </td></tr>
        <tr><td style="padding:40px 32px;">
          <p style="margin:0 0 8px;color:#775a19;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;font-weight:600;">Verify Your Email</p>
          <h2 style="margin:0 0 16px;font-family:'Playfair Display',Georgia,serif;color:#621428;font-size:28px;font-weight:400;line-height:1.2;">Welcome to our garden.</h2>
          <p style="margin:0 0 24px;color:#544244;font-size:15px;line-height:1.6;">We received a request to register an account with <strong style="color:#1e1b18;">${email}</strong>. To complete signup, enter this 6-digit verification code in the app:</p>
          <div style="background-color:#fbf2ed;border:1px solid #dac0c3;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <div style="font-family:'Source Sans 3',Arial,sans-serif;font-size:42px;letter-spacing:14px;font-weight:600;color:#621428;line-height:1;">${safePin}</div>
            <p style="margin:12px 0 0;color:#877274;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Expires in 10 minutes</p>
          </div>
          <p style="margin:0 0 12px;color:#544244;font-size:13px;line-height:1.6;">If you didn't request this code, you can safely ignore this email — no account will be created.</p>
          <hr style="border:none;border-top:1px solid #efe6e2;margin:32px 0;">
          <p style="margin:0;color:#877274;font-size:11px;line-height:1.5;text-align:center;">Sent with care from the Flora &amp; Gifts atelier.<br>This is an automated message; please don't reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function pinEmailText(pin) {
  return `Welcome to Flora & Gifts.\n\nYour verification code is: ${pin}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.\n\n— Flora & Gifts`;
}

async function sendViaResend(to, pin) {
  const subject = `Your Flora & Gifts verification code: ${pin}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      html: pinEmailHtml(pin, to),
      text: pinEmailText(pin),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.message || body.error || res.statusText;
    throw new Error(`Resend API ${res.status}: ${detail}`);
  }
  console.log(`✉  Sent PIN to ${to} via Resend (id: ${body.id})`);
  return { sent: true, provider: 'resend', messageId: body.id };
}

async function sendViaSmtp(to, pin) {
  const t = await getTransporter();
  const info = await Promise.race([
    t.sendMail({
      from: FROM,
      to,
      subject: `Your Flora & Gifts verification code: ${pin}`,
      text: pinEmailText(pin),
      html: pinEmailHtml(pin, to),
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP send timed out after 15s')), 15_000)
    ),
  ]);
  console.log(`✉  Sent PIN to ${to} via SMTP (messageId: ${info.messageId})`);
  return { sent: true, provider: 'smtp', messageId: info.messageId };
}

async function sendPinEmail(to, pin) {
  if (useResend) return sendViaResend(to, pin);
  if (useSmtp) return sendViaSmtp(to, pin);
  console.log(`\n  ✉  [DEV MODE] PIN for ${to}: ${pin}\n     Set RESEND_API_KEY or SMTP_* in Railway to send real emails.\n`);
  return { dev: true, pin };
}

if (useResend) {
  console.log(`✓ Email via Resend API (from: ${RESEND_FROM})`);
} else if (useSmtp) {
  getTransporter()
    .then((t) => t.verify())
    .then(() => console.log(`✓ SMTP ready: ${HOST}:${PORT} as ${USER}`))
    .catch((err) =>
      console.warn(
        `⚠️  SMTP verification failed: ${err.message}\n` +
          '   On Railway, Gmail SMTP often fails — use RESEND_API_KEY instead (see .env.example).'
      )
    );
} else {
  console.warn(
    '⚠️  No email provider configured. Set RESEND_API_KEY (recommended) or SMTP_* — PINs will print to logs only.'
  );
}

module.exports = { sendPinEmail, smtpEnabled, emailEnabled };
