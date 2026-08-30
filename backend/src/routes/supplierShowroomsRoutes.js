// Supplier showroom routes using existing locations table.
// Each showroom is a locations row owned by the supplier through cars.supplier_id.

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.id, l.showroom_name, l.city, l.country, l.address,
             l.latitude, l.longitude, l.is_active,
             COUNT(c.id)::int AS car_count
      FROM locations l
      LEFT JOIN cars c ON c.location_id = l.id AND c.supplier_id = $1
      WHERE EXISTS (
        SELECT 1 FROM cars owned WHERE owned.location_id = l.id AND owned.supplier_id = $1
      )
      GROUP BY l.id
      ORDER BY LOWER(COALESCE(l.showroom_name, l.city)), l.created_at
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Supplier showrooms GET:', error);
    res.status(500).json({ message: 'تعذر تحميل المعارض' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { showroom_name, city, country = 'Yemen', address, latitude, longitude } = req.body;
    const name = String(showroom_name || '').trim();
    if (!name) return res.status(400).json({ message: 'اسم المعرض مطلوب' });
    if (!city || !String(city).trim()) return res.status(400).json({ message: 'المدينة مطلوبة' });

    const duplicate = await pool.query(
      `SELECT id FROM locations WHERE LOWER(TRIM(showroom_name)) = LOWER(TRIM($1)) LIMIT 1`,
      [name]
    );
    if (duplicate.rowCount) return res.status(409).json({ message: 'اسم المعرض مستخدم بالفعل' });

    const { rows } = await pool.query(`
      INSERT INTO locations (showroom_name, city, country, address, latitude, longitude)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, showroom_name, city, country, address, latitude, longitude, is_active
    `, [name, String(city).trim(), country, address || null, latitude ?? null, longitude ?? null]);

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'اسم المعرض مستخدم بالفعل' });
    console.error('Supplier showroom POST:', error);
    res.status(500).json({ message: 'تعذر إنشاء المعرض' });
  }
});

module.exports = router;
