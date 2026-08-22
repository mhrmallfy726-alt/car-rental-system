require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function migrateAdvertisements() {
  const client = await pool.connect();
  try {
    const sqlFile = path.join(__dirname, '../../migrations/002_advertisements.sql');
    await client.query(fs.readFileSync(sqlFile, 'utf8'));
    console.log('Advertisement migration completed successfully.');
  } catch (error) {
    console.error('Advertisement migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAdvertisements();
