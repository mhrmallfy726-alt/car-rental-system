require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting database migration...');
    const sqlFile = path.join(__dirname, '../../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('📊 17 tables created in the database');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
