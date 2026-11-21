const fs = require('fs');
const path = require('path');

// Minimal .env loader (KEY=value per line) so we don't need another dependency.
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv(path.join(__dirname, '..', '.env'));

const required = ['DATABASE_URL', 'SESSION_SECRET', 'ADMIN_PASSWORD_HASH'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var ${key} (see backend/.env.example)`);
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT || 1502),
  host: process.env.HOST || '127.0.0.1',
  databaseUrl: process.env.DATABASE_URL,
  // First admin account (copied into the admin_users table when it is empty; after that the password lives there)
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  adminEmail: (process.env.ADMIN_EMAIL || '').trim(),
  // 1 = email a 6-digit security code at every password sign-in (needs SMTP)
  adminLoginCode: process.env.ADMIN_LOGIN_CODE === '1',
  // Public address used in emailed links, e.g. https://heh.visuprojects.in
  siteUrl: (process.env.SITE_URL || 'https://heh.visuprojects.in').replace(/\/+$/, ''),
  // Outgoing email (password reset links and sign-in codes). Email features are off until SMTP_HOST is set.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === '1', // 1 for port 465; port 587 uses STARTTLS
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },
  // Google sign-in (OAuth client ID from Google Cloud console); the button is hidden until this is set.
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  sessionSecret: process.env.SESSION_SECRET,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')),
  // Member Portal verification documents: private, outside the public /uploads folder (default: <uploads>-documents)
  docDir: path.resolve(process.env.DOC_DIR || `${path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'))}-documents`),
  serveStatic: process.env.SERVE_STATIC === '1',
  staticDir: path.resolve(__dirname, '..', '..', 'web', 'dist'), // React build (cd web && npm run build)
};
