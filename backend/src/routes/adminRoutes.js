const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Dashboard stats
router.get('/stats', asyncHandler(async (req, res) => {
  const users = await query('SELECT COUNT(*) FROM users');
  const cars = await query('SELECT COUNT(*) FROM cars');
  const reservations = await query('SELECT COUNT(*) FROM reservations');
  const revenue = await query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'paid'");
  const pending = await query("SELECT COUNT(*) FROM reservations WHERE status = 'pending'");
  const complaints = await query("SELECT COUNT(*) FROM complaints WHERE status IN ('open','in_progress') AND is_chat = false");

  res.json({
    success: true,
    data: {
      totalUsers: parseInt(users.rows[0].count),
      totalCars: parseInt(cars.rows[0].count),
      totalReservations: parseInt(reservations.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
      pendingReservations: parseInt(pending.rows[0].count),
      openComplaints: parseInt(complaints.rows[0].count),
    },
  });
}));

// Get all users
router.get('/users', asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name, email, role, phone, is_verified, is_active, created_at FROM users ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
}));

// Verify user
router.put('/users/:id/verify', asyncHandler(async (req, res, next) => {
  const result = await query('UPDATE users SET is_verified = true WHERE id = $1 RETURNING id, name, email, is_verified', [req.params.id]);
  if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));
  res.json({ success: true, data: result.rows[0] });
}));

// Toggle user active
router.put('/users/:id/toggle-active', asyncHandler(async (req, res, next) => {
  const result = await query('UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active', [req.params.id]);
  if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));
  res.json({ success: true, data: result.rows[0] });
}));

// Get all cars (including unapproved)
router.get('/cars', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT c.*, u.name as supplier_name, cat.name as category_name,
           (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as primary_image
    FROM cars c
    LEFT JOIN users u ON c.supplier_id = u.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    ORDER BY c.is_approved ASC, c.created_at DESC
  `);
  res.json({ success: true, data: result.rows });
}));

// Approve car
router.put('/cars/:id/approve', asyncHandler(async (req, res, next) => {
  const result = await query('UPDATE cars SET is_approved = true, approved_by = $1, approved_at = NOW() WHERE id = $2 RETURNING *', [req.user.id, req.params.id]);
  if (result.rows.length === 0) return next(new AppError('السيارة غير موجودة', 404));
  res.json({ success: true, data: result.rows[0] });
}));

// Get all complaints (only disputes)
router.get('/complaints', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT c.*, u1.name as complainant_name, u2.name as against_name
    FROM complaints c JOIN users u1 ON c.complainant_id = u1.id JOIN users u2 ON c.against_id = u2.id
    WHERE c.is_chat = false
    ORDER BY CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, c.created_at DESC
  `);
  res.json({ success: true, data: result.rows });
}));

// Get all reservations
router.get('/reservations', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT r.*, c.make, c.model, cu.name as customer_name, su.name as supplier_name
    FROM reservations r JOIN cars c ON r.car_id = c.id JOIN users cu ON r.customer_id = cu.id JOIN users su ON r.supplier_id = su.id
    ORDER BY r.created_at DESC LIMIT 100
  `);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
