const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', '004_supplier_extended_settings.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('🚀 Running migration: 004_supplier_extended_settings.sql...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
