require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function fixAdmin() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = 'admin@carrental.com'", [hash]);
    console.log('✅ Admin password updated to: 123456');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

fixAdmin();
