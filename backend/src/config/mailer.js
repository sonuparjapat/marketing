const nodemailer = require('nodemailer');

const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendMail({ to, subject, html }) {
  if (!isConfigured) {
    console.warn(`[mailer] SMTP not configured — skipped email "${subject}" to ${to}`);
    return { skipped: true };
  }
  return transporter.sendMail({
    from: `"${process.env.APP_NAME || 'Agency'}" <${process.env.MAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail, isConfigured };
