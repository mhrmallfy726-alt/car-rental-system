// Supplier login context: select which existing location/showroom to enter.
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/options', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.id, l.showroom_name, l.city, l.country, l.address,
             COUNT(c.id)::int AS car_count
      FROM locations l
      JOIN cars c ON c.location_id = l.id AND c.supplier_id = $1
      WHERE COALESCE(l.is_active, TRUE) = TRUE
      GROUP BY l.id
      ORDER BY LOWER(COALESCE(l.showroom_name, l.city)), l.created_at
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Supplier context options:', error);
    res.status(500).json({ message: 'تعذر تحميل معارض المورد' });
  }
});

router.post('/select', async (req, res) => {
  try {
    const { location_id } = req.body;
    if (!location_id) return res.status(400).json({ message: 'يجب اختيار المعرض' });

    const { rows } = await pool.query(`
      SELECT l.id, l.showroom_name, l.city, l.country, l.address,
             COUNT(c.id)::int AS car_count
      FROM locations l
      JOIN cars c ON c.location_id = l.id AND c.supplier_id = $1
      WHERE l.id = $2 AND COALESCE(l.is_active, TRUE) = TRUE
      GROUP BY l.id
    `, [req.user.id, location_id]);

    if (!rows[0]) return res.status(403).json({ message: 'هذا المعرض غير تابع لحسابك' });
    res.json({ showroom: rows[0] });
  } catch (error) {
    console.error('Supplier context select:', error);
    res.status(500).json({ message: 'تعذر اختيار المعرض' });
  }
});

module.exports = router;
