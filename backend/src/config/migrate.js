require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => /^\d+.*\.sql$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of files) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (existing.rowCount > 0) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Running ${file}...`);
      const migrationOwnsTransaction = /^\\s*BEGIN\\s*;/im.test(sql);
      try {
        if (!migrationOwnsTransaction) await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        if (!migrationOwnsTransaction) await client.query('COMMIT');
      } catch (error) {
        if (!migrationOwnsTransaction) await client.query('ROLLBACK');
        throw new Error(`${file}: ${error.message}`);
      }
    }

    console.log(`Migrations completed: ${files.length} file(s) checked.`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
