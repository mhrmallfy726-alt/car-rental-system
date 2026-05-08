const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { reservation_id, rating, car_rating, supplier_rating, comment } = req.body;
  // Support both 'rating' (simple) and 'car_rating'/'supplier_rating' (detailed)
  const finalCarRating = car_rating || rating;
  const finalSupplierRating = supplier_rating || rating;
  
  if (!reservation_id || !finalCarRating) return next(new AppError('التقييم والحجز مطلوبان', 400));
  
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND customer_id = $2 AND status = $3', [reservation_id, req.user.id, 'completed']);
  if (reservation.rows.length === 0) return next(new AppError('لا يمكن التقييم إلا بعد اكتمال الحجز', 400));
  const r = reservation.rows[0];

  const existing = await query('SELECT id FROM reviews WHERE reservation_id = $1 AND reviewer_id = $2', [reservation_id, req.user.id]);
  if (existing.rows.length > 0) return next(new AppError('تم التقييم مسبقاً', 400));

  const result = await query(
    `INSERT INTO reviews (reservation_id, reviewer_id, car_id, supplier_id, car_rating, supplier_rating, comment) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [reservation_id, req.user.id, r.car_id, r.supplier_id, finalCarRating, finalSupplierRating, comment]
  );

  // Update car average rating
  const avgResult = await query('SELECT AVG(car_rating)::numeric(3,2) as avg FROM reviews WHERE car_id = $1', [r.car_id]);
  await query('UPDATE cars SET average_rating = $1 WHERE id = $2', [avgResult.rows[0].avg, r.car_id]);

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/car/:carId', asyncHandler(async (req, res) => {
  const result = await query(`SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.car_id = $1 AND r.is_visible = true ORDER BY r.created_at DESC`, [req.params.carId]);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
