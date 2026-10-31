const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const { pool } = require('./db');

const app = express();
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/public'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Local development only; in production nginx serves the site and /uploads.
if (config.serveStatic) {
  app.use('/uploads', express.static(config.uploadDir));
  app.use(express.static(config.staticDir, { extensions: ['html'] }));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status === 400 && err.errors) return res.status(400).json({ error: err.message, errors: err.errors });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Images must be 5 MB or smaller.' });
  if (err.code === '23505') return res.status(409).json({ error: 'That value is already in use (duplicate).' });
  console.error(new Date().toISOString(), req.method, req.originalUrl, err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const server = app.listen(config.port, config.host, () => {
  console.log(`HEH API listening on http://${config.host}:${config.port}`);
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
