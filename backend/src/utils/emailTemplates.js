function wrapper(title, bodyHtml) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
    <h2 style="margin:0 0 20px;font-size:20px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#888;">${process.env.APP_NAME || 'Agency'}</p>
  </div>`;
}

const leadAutoReply = (name) =>
  wrapper(
    `Thanks for reaching out, ${name}!`,
    `<p>We've received your message and a member of our team will get back to you within 24 hours.</p>`
  );

const leadAdminAlert = (lead) =>
  wrapper(
    'New lead received',
    `<table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;">Name</td><td>${lead.name}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Email</td><td>${lead.email}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Phone</td><td>${lead.phone || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Company</td><td>${lead.company || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Service</td><td>${lead.service_interested || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Budget</td><td>${lead.budget_range || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Source</td><td>${lead.source || '-'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;vertical-align:top;">Message</td><td>${lead.message || '-'}</td></tr>
    </table>`
  );

const callbackConfirmation = (name, time) =>
  wrapper(
    `We've got your callback request, ${name}`,
    `<p>We'll call you at your preferred time: <strong>${time || 'as soon as possible'}</strong>.</p>`
  );

const callbackAdminAlert = (cb) =>
  wrapper(
    'New callback request',
    `<p><strong>${cb.name}</strong> — ${cb.phone}</p><p>Preferred time: ${cb.preferred_time || '-'}</p>`
  );

const subscriberWelcome = () =>
  wrapper(
    "You're subscribed!",
    `<p>Thanks for joining our newsletter. Expect practical, no-fluff notes on D2C growth, performance marketing and SEO — a couple of times a month, never spam.</p>`
  );

const customerPasswordReset = (name, resetUrl) =>
  wrapper(
    `Reset your password, ${name}`,
    `<p>We received a request to reset your account password. This link expires in 1 hour.</p>
     <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#d4af6a;color:#14171f;padding:12px 22px;border-radius:4px;text-decoration:none;font-weight:bold;">Reset password</a></p>
     <p style="font-size:13px;color:#888;">If you didn't request this, you can safely ignore this email — your password won't change.</p>`
  );

module.exports = {
  leadAutoReply,
  leadAdminAlert,
  callbackConfirmation,
  callbackAdminAlert,
  subscriberWelcome,
  customerPasswordReset,
};
