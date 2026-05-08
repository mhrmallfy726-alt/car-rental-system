require('dotenv').config();
const { pool } = require('./src/config/database');

async function fixComplaints() {
  try {
    console.log('Truncating tables...');
    await pool.query('TRUNCATE TABLE complaint_messages CASCADE;');
    await pool.query('TRUNCATE TABLE complaints CASCADE;');
    
    console.log('Adding column is_chat...');
    await pool.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_chat BOOLEAN DEFAULT true;');
    
    console.log('Adding unique constraint...');
    try {
      await pool.query('ALTER TABLE complaints ADD CONSTRAINT unique_reservation_complaint UNIQUE (reservation_id);');
    } catch (e) {
      if (e.code === '42710') { // duplicate_object
        console.log('Unique constraint already exists.');
      } else {
        throw e;
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixComplaints();
