const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');

// ========================
// @desc    Create reservation
// @route   POST /api/reservations
// @access  Customer
// ========================
router.post('/', protect, authorize('customer'), asyncHandler(async (req, res, next) => {
  const { car_id, start_date, end_date, pickup_location, dropoff_location, customer_notes } = req.body;

  if (!car_id || !start_date || !end_date) {
    return next(new AppError('الرجاء تحديد السيارة وتواريخ الحجز', 400));
  }

  // Get car info
  const carResult = await query('SELECT * FROM cars WHERE id = $1 AND status = $2', [car_id, 'available']);
  if (carResult.rows.length === 0) return next(new AppError('السيارة غير متاحة', 400));

  const car = carResult.rows[0];
  if (req.files?.avatar) {
    await query(
      "UPDATE users SET avatar=$1 WHERE id=$2",
      [req.files.avatar[0].filename, user.id]
    );
  }
  
  if (req.files?.commercial_register) {
    await query(
      "UPDATE users SET commercial_register=$1 WHERE id=$2",
      [req.files.commercial_register[0].filename, user.id]
    );
  }
  
  if (req.files?.owner_id) {
    await query(
      "UPDATE users SET owner_id=$1 WHERE id=$2",
      [req.files.owner_id[0].filename, user.id]
    );
  }
  // Check date conflict
  const conflictCheck = await query(`
    SELECT id FROM reservations 
    WHERE car_id = $1 AND status IN ('pending','approved','active')
    AND (start_date <= $3 AND end_date >= $2)
  `, [car_id, start_date, end_date]);

  if (conflictCheck.rows.length > 0) return next(new AppError('السيارة محجوزة في هذه الفترة', 400));

  const startD = new Date(start_date);
  const endD = new Date(end_date);
  const total_days = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
  if (total_days <= 0) return next(new AppError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 400));

  const total_price = total_days * car.price_per_day;

  const result = await query(`
    INSERT INTO reservations (customer_id, car_id, supplier_id, start_date, end_date, total_days, price_per_day, total_price, pickup_location, dropoff_location, customer_notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
  `, [req.user.id, car_id, car.supplier_id, start_date, end_date, total_days, car.price_per_day, total_price, pickup_location, dropoff_location, customer_notes]);

  // Create notification for supplier
  await query(`
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [car.supplier_id, 'طلب حجز جديد', `لديك طلب حجز جديد لسيارة ${car.make} ${car.model}`, 'reservation', result.rows[0].id, 'reservation']);

  // Emit socket notification
  const io = req.app.get('io');
  if (io) io.to(`user_${car.supplier_id}`).emit('new_notification', { type: 'reservation', message: 'طلب حجز جديد' });

  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Get my reservations
// @route   GET /api/reservations/my
// @access  Private
// ========================
router.get('/my', protect, asyncHandler(async (req, res) => {
  let sql;
  if (req.user.role === 'customer') {
    sql = `SELECT r.*, c.make, c.model, c.year, u.name as supplier_name,
           COALESCE((SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1), 
                    (SELECT image_url FROM car_images WHERE car_id = c.id LIMIT 1)) as car_image
           FROM reservations r 
           JOIN cars c ON r.car_id = c.id 
           JOIN users u ON r.supplier_id = u.id
           WHERE r.customer_id = $1 ORDER BY r.created_at DESC`;
  } else {
    sql = `SELECT r.*, c.make, c.model, c.year, u.name as customer_name,
           COALESCE((SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1), 
                    (SELECT image_url FROM car_images WHERE car_id = c.id LIMIT 1)) as car_image
           FROM reservations r 
           JOIN cars c ON r.car_id = c.id 
           JOIN users u ON r.customer_id = u.id
           WHERE r.supplier_id = $1 ORDER BY r.created_at DESC`;
  }
  const result = await query(sql, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Approve reservation
// @route   PUT /api/reservations/:id/approve
// @access  Supplier
// ========================
router.put('/:id/approve', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND supplier_id = $2', [id, req.user.id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (reservation.rows[0].status !== 'pending') return next(new AppError('لا يمكن الموافقة على هذا الحجز', 400));

  const result = await query(`UPDATE reservations SET status = 'approved', approved_at = NOW() WHERE id = $1 RETURNING *`, [id]);

  // Notify customer
  await query(`INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تمت الموافقة على حجزك', 'تمت الموافقة على طلب حجزك. يرجى إتمام الدفع.', 'reservation', $2, 'reservation')`,
    [reservation.rows[0].customer_id, id]);

  const io = req.app.get('io');
  if (io) io.to(`user_${reservation.rows[0].customer_id}`).emit('new_notification', { type: 'reservation', message: 'تمت الموافقة على حجزك' });

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Reject reservation
// @route   PUT /api/reservations/:id/reject
// @access  Supplier
// ========================
router.put('/:id/reject', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { supplier_notes } = req.body;
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND supplier_id = $2', [id, req.user.id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (reservation.rows[0].status !== 'pending') return next(new AppError('لا يمكن رفض هذا الحجز', 400));

  const result = await query(`UPDATE reservations SET status = 'rejected', supplier_notes = $1 WHERE id = $2 RETURNING *`, [supplier_notes, id]);

  await query(`INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تم رفض حجزك', $2, 'reservation', $3, 'reservation')`,
    [reservation.rows[0].customer_id, supplier_notes || 'تم رفض طلب الحجز من قبل المورد', id]);

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Customer/Supplier
// ========================
router.put('/:id/cancel', protect, asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  const reservation = await query('SELECT * FROM reservations WHERE id = $1', [id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const r = reservation.rows[0];
  if (r.customer_id !== req.user.id && r.supplier_id !== req.user.id) return next(new AppError('غير مصرح لك', 403));
  if (!['pending', 'approved'].includes(r.status)) return next(new AppError('لا يمكن إلغاء هذا الحجز', 400));

  const result = await query(`UPDATE reservations SET status = 'cancelled', cancellation_reason = $1, cancelled_by = $2, cancelled_at = NOW() WHERE id = $3 RETURNING *`,
    [cancellation_reason, req.user.id, id]);

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Complete reservation
// @route   PUT /api/reservations/:id/complete
// @access  Supplier
// ========================
router.put('/:id/complete', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND supplier_id = $2', [id, req.user.id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (reservation.rows[0].status !== 'active') return next(new AppError('الحجز ليس نشطاً', 400));

  const result = await query(`UPDATE reservations SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *`, [id]);

  // Update car total_trips
  await query('UPDATE cars SET total_trips = total_trips + 1, status = $1 WHERE id = $2', ['available', reservation.rows[0].car_id]);

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
// ========================
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT r.*, c.make, c.model, c.year, c.color, c.license_plate,
      cu.name as customer_name, cu.phone as customer_phone,
      su.name as supplier_name, su.phone as supplier_phone,
      (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as car_image
    FROM reservations r
    JOIN cars c ON r.car_id = c.id
    JOIN users cu ON r.customer_id = cu.id
    JOIN users su ON r.supplier_id = su.id
    WHERE r.id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const r = result.rows[0];
  if (r.customer_id !== req.user.id && r.supplier_id !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك', 403));
  }

  res.json({ success: true, data: r });
}));

module.exports = router;
