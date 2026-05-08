const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const { uploadHandoverImages } = require('../middleware/upload');

// Record handover (before/after)
router.post('/:reservationId/:type', protect, uploadHandoverImages, asyncHandler(async (req, res, next) => {
  const { reservationId, type } = req.params;
  if (!['before', 'after'].includes(type)) return next(new AppError('النوع يجب أن يكون before أو after', 400));

  const { fuel_level, mileage, condition_notes, exterior_condition, interior_condition, gps_lat, gps_lng } = req.body;

  const fuel = parseInt(fuel_level);
  const mil = parseInt(mileage);

  const reservation = await query('SELECT * FROM reservations WHERE id = $1', [reservationId]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const log = await query(
    `INSERT INTO handover_logs (reservation_id, type, recorded_by, fuel_level, mileage, condition_notes, exterior_condition, interior_condition, gps_lat, gps_lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [reservationId, type, req.user.id, fuel || 0, mil || 0, condition_notes || '', exterior_condition, interior_condition, gps_lat || null, gps_lng || null]
  );

  // Save images
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const filePath = file.path.replace(/\\/g, '/');
      await query('INSERT INTO handover_images (handover_log_id, image_url) VALUES ($1,$2)', [log.rows[0].id, filePath]);
    }
  }

  res.status(201).json({ success: true, data: log.rows[0] });
}));

// Get handover logs for reservation
router.get('/:reservationId', protect, asyncHandler(async (req, res) => {
  const logs = await query('SELECT * FROM handover_logs WHERE reservation_id = $1 ORDER BY created_at', [req.params.reservationId]);
  for (let log of logs.rows) {
    const imgs = await query('SELECT * FROM handover_images WHERE handover_log_id = $1', [log.id]);
    log.images = imgs.rows;
  }
  res.json({ success: true, data: logs.rows });
}));

module.exports = router;
