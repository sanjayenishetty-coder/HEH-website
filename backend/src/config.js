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
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  sessionSecret: process.env.SESSION_SECRET,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')),
  serveStatic: process.env.SERVE_STATIC === '1',
  staticDir: path.resolve(__dirname, '..', '..', 'htmls'),
};
