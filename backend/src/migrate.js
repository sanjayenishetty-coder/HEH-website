// Versioned database migrations: backend/migrations/NNNN_name.sql, applied in order, each once.
//   npm run db:migrate                 apply pending migrations
//   npm run db:migrate -- status       list applied / pending
//   npm run db:migrate -- new <name>   create the next migration file
// Each file runs in its own transaction and is recorded in schema_migrations with a checksum;
// editing a file after it was applied is reported as an error (add a new migration instead).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(__dirname, '..', 'migrations');
const LOCK_ID = 7_150_2026; // pg_advisory_lock key so two deploys can't migrate at once

function files() {
  return fs
    .readdirSync(DIR)
    .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
    .sort()
    .map((f) => {
      const sql = fs.readFileSync(path.join(DIR, f), 'utf8');
      return { version: f.slice(0, 4), name: f, sql, checksum: crypto.createHash('sha256').update(sql).digest('hex') };
    });
}

function create(name) {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!slug) throw new Error('Usage: npm run db:migrate -- new <name>');
  const last = files().at(-1);
  const version = String((last ? Number(last.version) : 0) + 1).padStart(4, '0');
  const file = path.join(DIR, `${version}_${slug}.sql`);
  fs.writeFileSync(file, `-- ${version}: ${slug.replace(/_/g, ' ')}\n\n`);
  console.log(`Created ${path.relative(process.cwd(), file)}`);
}

async function run(command) {
  const { pool } = require('./db');
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    text PRIMARY KEY,
      name       text NOT NULL,
      checksum   text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = new Map((await client.query('SELECT * FROM schema_migrations')).rows.map((r) => [r.version, r]));
    const all = files();

    const changed = all.filter((m) => applied.has(m.version) && applied.get(m.version).checksum !== m.checksum);
    const pending = all.filter((m) => !applied.has(m.version));

    if (command === 'status') {
      for (const m of all) {
        const row = applied.get(m.version);
        const state = !row ? 'pending' : row.checksum !== m.checksum ? 'CHANGED after apply' : `applied ${row.applied_at.toISOString()}`;
        console.log(`${m.name.padEnd(40)} ${state}`);
      }
      return;
    }

    if (changed.length) {
      throw new Error(`Already-applied migrations were edited: ${changed.map((m) => m.name).join(', ')}. Add a new migration instead.`);
    }
    if (!pending.length) return console.log('Database is up to date.');

    for (const m of pending) {
      await client.query('BEGIN');
      try {
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)', [m.version, m.name, m.checksum]);
        await client.query('COMMIT');
        console.log(`Applied ${m.name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        err.message = `${m.name}: ${err.message}`;
        throw err;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
    await pool.end();
  }
}

const [command, arg] = process.argv.slice(2);
(async () => {
  if (command === 'new') return create(arg);
  await run(command);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
