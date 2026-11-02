// Outgoing email (admin password reset links and sign-in codes) through the SMTP account in .env.
const nodemailer = require('nodemailer');
const { smtp } = require('./config');

const enabled = Boolean(smtp.host && smtp.from);
const transport = enabled
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    })
  : null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Simple branded HTML email; `lines` are paragraphs, `big` is a code or button shown between them.
function layout({ title, lines, code, button }) {
  const p = (t) => `<p style="margin:0 0 14px;font:15px/1.55 Arial,sans-serif;color:#1d2f4a">${esc(t)}</p>`;
  const middle = code
    ? `<p style="margin:22px 0;font:bold 32px/1 'Courier New',monospace;letter-spacing:10px;color:#0d2a4f">${esc(code)}</p>`
    : `<p style="margin:24px 0"><a href="${esc(button.url)}" style="display:inline-block;padding:13px 26px;border-radius:8px;background:#f26a1b;color:#fff;font:bold 15px Arial,sans-serif;text-decoration:none">${esc(button.text)}</a></p>`;
  return `<div style="background:#f4f6f9;padding:28px 12px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:30px 28px">
<p style="margin:0 0 20px;font:bold 15px Arial,sans-serif;color:#0d2a4f">Hyderabad Entrepreneurs Hub</p>
<h1 style="margin:0 0 16px;font:bold 22px Georgia,serif;color:#0d2a4f">${esc(title)}</h1>
${p(lines[0])}${middle}${lines.slice(1).map(p).join('')}
</div></div>`;
}

async function send(to, subject, content) {
  if (!enabled) throw Object.assign(new Error('Email is not set up on this server.'), { code: 'NO_MAIL' });
  const text = [content.title, '', content.lines[0], '', content.code || content.button.url, '', ...content.lines.slice(1)].join('\n');
  await transport.sendMail({ from: smtp.from, to, subject, text, html: layout(content) });
}

module.exports = { enabled, send };
