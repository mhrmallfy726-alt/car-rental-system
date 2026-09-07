const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { reservation_id, rating, car_rating, supplier_rating, platform_rating, comment, platform_comment } = req.body;
  const finalCarRating = car_rating || rating;
  const finalSupplierRating = supplier_rating || rating;
  const finalPlatformRating = platform_rating || rating;
  
  if (!reservation_id || !finalCarRating || !finalSupplierRating || !finalPlatformRating) return next(new AppError('تقييم السيارة والمورد والمنصة والحجز مطلوبون', 400));
  for (const value of [finalCarRating, finalSupplierRating, finalPlatformRating]) {
    if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5) return next(new AppError('كل تقييم يجب أن يكون بين 1 و5 نجوم', 400));
  }
  
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND customer_id = $2 AND status = $3', [reservation_id, req.user.id, 'completed']);
  if (reservation.rows.length === 0) return next(new AppError('لا يمكن التقييم إلا بعد اكتمال الحجز', 400));
  const r = reservation.rows[0];

  const existing = await query('SELECT id FROM reviews WHERE reservation_id = $1 AND reviewer_id = $2', [reservation_id, req.user.id]);
  if (existing.rows.length > 0) return next(new AppError('تم التقييم مسبقاً', 400));

  const result = await query(
    `INSERT INTO reviews (reservation_id, reviewer_id, car_id, supplier_id, car_rating, supplier_rating, platform_rating, comment, platform_comment) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [reservation_id, req.user.id, r.car_id, r.supplier_id, Number(finalCarRating), Number(finalSupplierRating), Number(finalPlatformRating), comment, platform_comment || comment]
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

router.get('/platform', asyncHandler(async (req, res) => {
  const summary = await query(`SELECT COUNT(*)::int AS total_reviews, COALESCE(ROUND(AVG(platform_rating)::numeric, 2), 0) AS average_rating FROM reviews WHERE is_visible = true AND platform_rating IS NOT NULL`);
  const reviews = await query(`SELECT r.id, r.platform_rating, r.platform_comment, r.created_at, u.name AS reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.is_visible = true AND r.platform_rating IS NOT NULL ORDER BY r.created_at DESC LIMIT 50`);
  res.json({ success: true, data: { summary: summary.rows[0], reviews: reviews.rows } });
}));

module.exports = router;
