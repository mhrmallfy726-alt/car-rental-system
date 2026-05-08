const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function approveCars() {
  try {
    const res = await pool.query("SELECT id, make, model FROM cars WHERE is_approved = false");
    if (res.rows.length > 0) {
      console.log('Pending cars found:', res.rows);
      for (const car of res.rows) {
        await pool.query("UPDATE cars SET is_approved = true WHERE id = $1", [car.id]);
        console.log(`Approved car: ${car.make} ${car.model} (${car.id})`);
      }
    } else {
      console.log('No pending cars found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

approveCars();
