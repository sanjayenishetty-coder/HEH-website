const { Pool } = require('pg');
const { databaseUrl } = require('./config');

const pool = new Pool({ connectionString: databaseUrl, max: 10 });

// Dates/times come back as plain strings so the API never shifts them by timezone.
const types = require('pg').types;
types.setTypeParser(1082, (v) => v); // date
types.setTypeParser(1083, (v) => v); // time

const query = (text, params) => pool.query(text, params);

async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Next value of a named counter, e.g. "ENQ-2026" -> 1, 2, 3...
async function nextCounter(client, name) {
  const { rows } = await client.query(
    `INSERT INTO counters (name, value) VALUES ($1, 1)
     ON CONFLICT (name) DO UPDATE SET value = counters.value + 1
     RETURNING value`,
    [name]
  );
  return rows[0].value;
}

module.exports = { pool, query, tx, nextCounter };
