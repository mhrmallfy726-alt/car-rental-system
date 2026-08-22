// require('dotenv').config();
// const fs = require('fs');
// const path = require('path');
// const { pool } = require('./database');

// async function migrate() {
//   const client = await pool.connect();
//   try {
//     console.log('🚀 Starting database migration...');
//     const sqlFile = path.join(__dirname, '../../migrations/001_initial_schema.sql');
//     const sql = fs.readFileSync(sqlFile, 'utf8');
//     await client.query(sql);
//     console.log('✅ Migration completed successfully!');
//     console.log('📊 17 tables created in the database');
//   } catch (err) {
//     console.error('❌ Migration failed:', err.message);
//     process.exit(1);
//   } finally {
//     client.release();
//     await pool.end();
//   }
// }

// migrate();

const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting database migrations...');

    const migrationsDir = path.join(__dirname, '../../migrations/002_advertisements.sql');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }

    console.log(`Migrations completed: ${files.length} file(s).`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

