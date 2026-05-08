const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkAdmin() {
  try {
    const res = await pool.query("SELECT * FROM users WHERE role = 'admin'");
    if (res.rows.length > 0) {
      console.log('Admin users found:', res.rows.map(u => ({ id: u.id, email: u.email, role: u.role, is_active: u.is_active })));
      
      // Update the password of the first admin to 123456
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, res.rows[0].email]);
      console.log(`Password reset for ${res.rows[0].email} to '123456'`);
    } else {
      console.log('No admin user found. Creating one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      await pool.query(
        "INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)",
        ['Admin Manager', 'admin@admin.com', hashedPassword, 'admin', true]
      );
      console.log("Admin user created: admin@admin.com / 123456");
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

checkAdmin();
