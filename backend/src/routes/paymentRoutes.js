const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

// GET /api/payments/cards
router.get('/cards', protect, asyncHandler(async (req, res) => {
  const result = await query('SELECT id, card_holder_name, card_number_masked, expiry_month, expiry_year, brand, is_default FROM saved_cards WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

// POST /api/payments/cards
router.post('/cards', protect, asyncHandler(async (req, res, next) => {
  const { card_holder_name, card_number, expiry_month, expiry_year, cvv } = req.body;
  if (!card_number || card_number.length < 16) return next(new AppError('بيانات البطاقة غير صالحة', 400));
  
  const masked = '**** **** **** ' + card_number.slice(-4);
  const brand = card_number.startsWith('4') ? 'Visa' : 'Mastercard';
  const token = 'tok_' + Math.random().toString(36).substr(2, 9); // Simulated token

  // If first card, make it default
  const existing = await query('SELECT id FROM saved_cards WHERE user_id = $1', [req.user.id]);
  const isDefault = existing.rows.length === 0;

  const result = await query(
    `INSERT INTO saved_cards (user_id, card_holder_name, card_number_masked, card_token, expiry_month, expiry_year, brand, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, card_holder_name, card_number_masked, expiry_month, expiry_year, brand, is_default`,
    [req.user.id, card_holder_name, masked, token, expiry_month, expiry_year, brand, isDefault]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.post('/checkout', protect, asyncHandler(async (req, res, next) => {
  const { reservation_id, payment_method, saved_card_id } = req.body;
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND customer_id = $2', [reservation_id, req.user.id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  const r = reservation.rows[0];
  if (r.status !== 'approved') return next(new AppError('يجب الموافقة على الحجز أولاً', 400));

  if (saved_card_id) {
    const card = await query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [saved_card_id, req.user.id]);
    if (card.rows.length === 0) return next(new AppError('البطاقة غير صالحة', 400));
  }

  const payment = await query(
    `INSERT INTO payments (reservation_id, customer_id, amount, payment_method, status, paid_at) VALUES ($1,$2,$3,$4,'paid',NOW()) RETURNING *`,
    [reservation_id, req.user.id, r.total_price, payment_method || 'card']
  );
  await query(`UPDATE reservations SET status = 'active' WHERE id = $1`, [reservation_id]);
  await query(`UPDATE cars SET status = 'reserved' WHERE id = $1`, [r.car_id]);

  res.status(201).json({ success: true, data: payment.rows[0] });
}));

router.get('/history', protect, asyncHandler(async (req, res) => {
  const result = await query(`SELECT p.*, c.make, c.model FROM payments p JOIN reservations r ON p.reservation_id = r.id JOIN cars c ON r.car_id = c.id WHERE p.customer_id = $1 ORDER BY p.created_at DESC`, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
