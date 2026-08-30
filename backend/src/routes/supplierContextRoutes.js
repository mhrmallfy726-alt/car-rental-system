const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('supplier'));

router.get('/options', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT l.id, l.showroom_name, l.city, l.country, l.address,
           l.latitude, l.longitude, l.is_active, l.subscription_status,
           l.subscription_plan, l.subscription_expires_at,
           COUNT(c.id)::int AS car_count
    FROM locations l
    LEFT JOIN cars c ON c.location_id = l.id AND c.supplier_id = $1
    WHERE l.supplier_id = $1 AND COALESCE(l.is_active, TRUE) = TRUE
    GROUP BY l.id
    ORDER BY LOWER(COALESCE(l.showroom_name, l.city)), l.created_at
  `, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

router.post('/select', asyncHandler(async (req, res) => {
  const { location_id } = req.body;
  if (!location_id) return res.status(400).json({ success: false, message: 'يجب اختيار المعرض' });

  const result = await query(`
    SELECT l.id, l.showroom_name, l.city, l.country, l.address,
           l.latitude, l.longitude, l.is_active, l.subscription_status,
           l.subscription_plan, l.subscription_expires_at,
           COUNT(c.id)::int AS car_count
    FROM locations l
    LEFT JOIN cars c ON c.location_id = l.id AND c.supplier_id = $1
    WHERE l.id = $2 AND l.supplier_id = $1 AND COALESCE(l.is_active, TRUE) = TRUE
    GROUP BY l.id
  `, [req.user.id, location_id]);

  if (!result.rows[0]) return res.status(403).json({ success: false, message: 'هذا المعرض غير تابع لحسابك أو غير نشط' });
  res.json({ success: true, showroom: result.rows[0] });
}));

module.exports = router;
