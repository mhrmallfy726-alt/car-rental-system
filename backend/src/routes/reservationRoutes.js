const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');
const {
  sendTextMessage,
  sendReservationStatusMessage,
} = require('../services/whatsappService');
const { refundReservationPayment } = require('../services/financeService');
const getSupplierId = (req) => req.user.supplier_id || req.user.id;
const getBranchId = (req) => req.user.account_type === 'branch' ? req.user.branch_id : null;

async function notifyReservationStaff(reservationId, title, message, io) {
  const result = await query(
    `SELECT r.supplier_id, ARRAY_REMOVE(ARRAY_AGG(DISTINCT CASE WHEN u.account_type = 'branch' THEN u.id END), NULL) AS branch_manager_ids
       FROM reservations r
       JOIN cars c ON c.id = r.car_id
       LEFT JOIN users u
         ON u.account_type = 'branch'
        AND u.branch_id = c.location_id
        AND u.supplier_id = r.supplier_id
        AND COALESCE(u.status, 'active') = 'active'
      WHERE r.id = $1
      GROUP BY r.supplier_id`,
    [reservationId]
  );
  if (!result.rows.length) return;
  const recipients = [...new Set([result.rows[0].supplier_id, ...(result.rows[0].branch_manager_ids || [])].map(String))];
  for (const userId of recipients) {
    const notification = await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, 'reservation', $4, 'reservation') RETURNING *`,
      [userId, title, message, reservationId]
    );
    if (io && notification.rows[0]) io.to(`user_${userId}`).emit('new_notification', notification.rows[0]);
  }
}

async function notifyReservationWhatsApp(reservationId, status, reason = null) {
  try {
    const result = await query(
      `SELECT r.id, r.customer_id, r.supplier_id,
              cu.name AS customer_name, cu.phone AS customer_phone,
              su.name AS supplier_name, su.phone AS supplier_phone,
              c.make, c.model
       FROM reservations r
       JOIN users cu ON cu.id = r.customer_id
       JOIN users su ON su.id = r.supplier_id
       JOIN cars c ON c.id = r.car_id
       WHERE r.id = $1`,
      [reservationId]
    );

    const reservation = result.rows[0];
    if (!reservation) return;

    if (status === 'pending') {
      await sendTextMessage({
        to: reservation.supplier_phone,
        body: `لديك طلب حجز جديد للسيارة ${reservation.make} ${reservation.model}. يرجى مراجعة الطلب من لوحة المورد.\nرقم الحجز: ${reservation.id}`,
      });
      return;
    }

    await sendReservationStatusMessage({
      to: reservation.customer_phone,
      customerName: reservation.customer_name,
      carName: `${reservation.make} ${reservation.model}`,
      status,
      reservationId: reservation.id,
      reason,
    });
  } catch (error) {
    console.error('WhatsApp reservation notification failed:', error.message);
  }
}

function getCancellationPolicy(reservation) {
  const pickupAt = reservation.pickup_at
    ? new Date(reservation.pickup_at)
    : new Date(`${reservation.start_date}T${reservation.pickup_time || '09:00'}:00`);
  const hoursRemaining = (pickupAt.getTime() - Date.now()) / (60 * 60 * 1000);
  if (!Number.isFinite(hoursRemaining) || hoursRemaining <= 0) return { hoursRemaining: 0, refundRate: 0, refundPercent: 0, feePercent: 100, canCancel: false };
  if (hoursRemaining >= 72) return { hoursRemaining, refundRate: 1, refundPercent: 100, feePercent: 0, canCancel: true };
  if (hoursRemaining >= 24) return { hoursRemaining, refundRate: 0.75, refundPercent: 75, feePercent: 25, canCancel: true };
  return { hoursRemaining, refundRate: 0.5, refundPercent: 50, feePercent: 50, canCancel: true };
}

// ========================
// @desc    Create reservation
// @route   POST /api/reservations
// @access  Customer
// ========================
router.post('/', protect, authorize('customer'), asyncHandler(async (req, res, next) => {
  const { car_id, start_date, end_date, pickup_time = '09:00', return_time = '18:00', pickup_location, dropoff_location, customer_notes, with_driver = false, policy_version, policy_accepted } = req.body;

  if (!policy_accepted || !policy_version) return next(new AppError('يجب قراءة سياسة الحجوزات والتسليم والاستلام والموافقة عليها قبل إنشاء الحجز', 400));

  if (!car_id || !start_date || !end_date || !pickup_time || !return_time) {
    return next(new AppError('الرجاء تحديد السيارة وتواريخ وأوقات الحجز', 400));
  }

  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (start_date < todayValue || end_date < todayValue) {
    return next(new AppError('لا يمكن إنشاء حجز بتاريخ قبل اليوم', 400));
  }

  const pickupAt = new Date(`${start_date}T${pickup_time}:00`);
  const returnAt = new Date(`${end_date}T${return_time}:00`);
  if (Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime()) || returnAt <= pickupAt) {
    return next(new AppError('وقت الإرجاع يجب أن يكون بعد وقت الاستلام', 400));
  }

  // Reject pickup times that have already passed when the pickup date is today (Yemen time).
  const nowYemen = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Aden' }));
  const todayYemen = `${nowYemen.getFullYear()}-${String(nowYemen.getMonth() + 1).padStart(2, '0')}-${String(nowYemen.getDate()).padStart(2, '0')}`;
  if (start_date === todayYemen) {
    const pickupMinutes = Number(String(pickup_time).slice(0, 2)) * 60 + Number(String(pickup_time).slice(3, 5));
    const currentMinutes = nowYemen.getHours() * 60 + nowYemen.getMinutes();
    if (pickupMinutes < currentMinutes) {
      return next(new AppError('وقت الاستلام يجب أن يكون الآن أو بعد الوقت الحالي', 400));
    }
  }

  // Get car info
  const carResult = await query('SELECT * FROM cars WHERE id = $1 AND status = $2', [car_id, 'available']);
  if (carResult.rows.length === 0) return next(new AppError('السيارة غير متاحة', 400));

  const car = carResult.rows[0];
  // Check exact date/time conflict. Old reservations without pickup_at/return_at fall back to their dates.

  const conflictCheck = await query(`
    SELECT id FROM reservations
    WHERE car_id = $1 AND status IN ('pending','approved','awaiting_pickup','active','returned')
    AND COALESCE(pickup_at, start_date::timestamp) < $3::timestamp
    AND COALESCE(return_at, end_date::timestamp + interval '23 hours 59 minutes') > $2::timestamp
  `, [car_id, pickupAt.toISOString(), returnAt.toISOString()]);

  if (conflictCheck.rows.length > 0) return next(new AppError('السيارة محجوزة في هذه الفترة', 400));

  const startD = new Date(`${start_date}T00:00:00`);
  const endD = new Date(`${end_date}T00:00:00`);
  const total_days = Math.max(1, Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)));
  if (returnAt <= pickupAt) return next(new AppError('وقت الإرجاع يجب أن يكون بعد وقت الاستلام', 400));

  const pricePerDayYER = Number(car.price_per_day_yer ?? car.price_per_day ?? 0);
  const total_price = Number((total_days * pricePerDayYER).toFixed(2));

  const policy = await query(`SELECT id, version FROM policy_versions WHERE version = $1 AND status = 'effective'`, [policy_version]);
  if (!policy.rows.length) return next(new AppError('نسخة السياسة غير متاحة أو غير فعالة', 400));
  const result = await query(`
    INSERT INTO reservations (customer_id, car_id, supplier_id, start_date, end_date, pickup_time, return_time, pickup_at, return_at, total_days, price_per_day, total_price, price_per_day_yer, total_price_yer, exchange_rate_used, pickup_location, dropoff_location, customer_notes, with_driver, handover_state, status, policy_version, policy_accepted_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$11,$12,1,$13,$14,$15,$16,$17,$18,$19,NOW()) RETURNING *
  `, [req.user.id, car_id, car.supplier_id, start_date, end_date, pickup_time, return_time, pickupAt.toISOString(), returnAt.toISOString(), total_days, pricePerDayYER, total_price, pickup_location, dropoff_location, customer_notes, Boolean(with_driver), 'not_started', 'pending', policy.rows[0].version]);
  await query(`INSERT INTO policy_acceptances (policy_version_id, user_id, account_type, context_type, context_id, ip_address, user_agent) VALUES ($1,$2,$3,'reservation',$4,$5,$6)`, [policy.rows[0].id, req.user.id, req.user.role, result.rows[0].id, req.ip || null, req.get('user-agent') || null]);
  await query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address, user_agent) VALUES ($1,'policy_accepted_and_reservation_created','reservation',$2,$3,$4,$5)`, [req.user.id, result.rows[0].id, JSON.stringify({ policy_version: policy.rows[0].version }), req.ip || null, req.get('user-agent') || null]);

  // The supplier is notified after successful payment in paymentRoutes.js.
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Get my reservations
// @route   GET /api/reservations/my
// @access  Private
// ========================
router.get('/my', protect, asyncHandler(async (req, res) => {
  const requestedLocationId = req.query.location_id;
  const location_id = req.user.account_type === 'branch' ? req.user.branch_id : requestedLocationId;
  const supplierId = req.user.supplier_id || req.user.id;
  const params = [supplierId];
  let locationFilter = '';
  let sql;
  if (req.user.role === 'customer') {
      sql = `SELECT r.*,
           COALESCE((SELECT p.status FROM payments p WHERE p.reservation_id = r.id ORDER BY p.created_at DESC LIMIT 1), 'unpaid') AS payment_status,
           c.make, c.model, c.year, u.name as supplier_name,
           COALESCE((SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1), 
                    (SELECT image_url FROM car_images WHERE car_id = c.id LIMIT 1)) as car_image
           FROM reservations r 
           JOIN cars c ON r.car_id = c.id 
           JOIN users u ON r.supplier_id = u.id
           WHERE r.customer_id = $1 ORDER BY r.created_at DESC`;
  } else {
    if (location_id) {
      const ownedLocation = await query(
        `SELECT id FROM locations WHERE id = $1 AND supplier_id = $2 AND COALESCE(is_active, TRUE) = TRUE`,
        [location_id, supplierId]
      );
      if (!ownedLocation.rows.length) return res.status(403).json({ success: false, message: 'الفرع المحدد غير تابع لحسابك أو غير نشط' });
      params.push(location_id);
      locationFilter = ' AND c.location_id = $2';
    }
    sql = `SELECT r.*, c.make, c.model, c.year, u.name as customer_name,
           COALESCE((SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1), 
                    (SELECT image_url FROM car_images WHERE car_id = c.id LIMIT 1)) as car_image
           FROM reservations r 
           JOIN cars c ON r.car_id = c.id 
           JOIN users u ON r.customer_id = u.id
           WHERE r.supplier_id = $1${locationFilter}
             AND EXISTS (SELECT 1 FROM payments p WHERE p.reservation_id = r.id AND p.status = 'paid')
           ORDER BY r.created_at DESC`;
  }
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Approve reservation
// @route   PUT /api/reservations/:id/approve
// @access  Supplier
// ========================
router.put('/:id/approve', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const reservation = await query('SELECT r.* FROM reservations r JOIN cars c ON c.id = r.car_id WHERE r.id = $1 AND r.supplier_id = $2 AND ($3::text IS NULL OR c.location_id = $3)', [id, getSupplierId(req), getBranchId(req)]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (reservation.rows[0].status !== 'pending') return next(new AppError('لا يمكن الموافقة على هذا الحجز', 400));
  const paidPayment = await query(`SELECT id FROM payments WHERE reservation_id = $1 AND status = 'paid' LIMIT 1`, [id]);
  if (paidPayment.rows.length === 0) return next(new AppError('لا يمكن مراجعة الحجز قبل إتمام الدفع', 400));

  const result = await query(`UPDATE reservations SET status = 'awaiting_pickup', handover_state = 'awaiting_pickup', approved_at = NOW() WHERE id = $1 RETURNING *`, [id]);

  // Notify customer
  const notificationResult = await query(`INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تمت الموافقة على حجزك', 'تمت الموافقة على طلب حجزك المدفوع. يمكنك متابعة تفاصيل الاستلام.', 'reservation', $2, 'reservation') RETURNING *`,
    [reservation.rows[0].customer_id, id]);

  const io = req.app.get('io');
  if (io && notificationResult.rows[0]) io.to(`user_${reservation.rows[0].customer_id}`).emit('new_notification', notificationResult.rows[0]);
  await notifyReservationStaff(id, 'تمت الموافقة على الحجز', 'تمت الموافقة على الحجز وأصبح بانتظار استلام العميل.', io);

  void notifyReservationWhatsApp(id, 'awaiting_pickup');

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
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND supplier_id = $2', [id, getSupplierId(req)]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (reservation.rows[0].status !== 'pending') return next(new AppError('لا يمكن رفض هذا الحجز', 400));

  const refund = await refundReservationPayment(id, supplier_notes || 'تم رفض الحجز من قبل المورد');
  const result = await query(`UPDATE reservations SET status = 'rejected', supplier_notes = $1 WHERE id = $2 RETURNING *`, [supplier_notes, id]);

  const notificationResult = await query(`INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تم رفض حجزك', $2, 'reservation', $3, 'reservation') RETURNING *`,
    [reservation.rows[0].customer_id, supplier_notes || 'تم رفض طلب الحجز من قبل المورد', id]);

  const io = req.app.get('io');
  if (io && notificationResult.rows[0]) io.to(`user_${reservation.rows[0].customer_id}`).emit('new_notification', notificationResult.rows[0]);

  void notifyReservationWhatsApp(id, 'rejected', supplier_notes || null);

  res.json({ success: true, data: result.rows[0], refund: refund ? { status: 'refunded', amount: refund.amount, currency: refund.currency } : { status: 'not_required' } });
}));

// ========================
// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Customer/Supplier
// ========================
router.put('/:id/cancel', protect, asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  const reservation = await query(`SELECT r.*, c.location_id AS car_location_id FROM reservations r JOIN cars c ON c.id = r.car_id WHERE r.id = $1`, [id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const r = reservation.rows[0];
  const supplierOwnsReservation = String(r.supplier_id) === String(getSupplierId(req)) && (!getBranchId(req) || String(r.car_location_id) === String(getBranchId(req)));
  if (r.customer_id !== req.user.id && !supplierOwnsReservation) return next(new AppError('غير مصرح لك', 403));
  if (!['pending', 'approved', 'awaiting_pickup'].includes(r.status)) return next(new AppError('لا يمكن إلغاء هذا الحجز بعد بدء الاستلام أو الإرجاع', 400));

  const policy = r.customer_id === req.user.id ? getCancellationPolicy(r) : { refundRate: 1, refundPercent: 100, feePercent: 0, canCancel: true };
  if (!policy.canCancel) return next(new AppError('لا يمكن إلغاء الحجز بعد موعد الاستلام', 400));
  const policyReason = `${cancellation_reason || 'تم إلغاء الحجز'} — سياسة الإلغاء: استرداد ${policy.refundPercent}% وخصم ${policy.feePercent}%`;
  const refund = await refundReservationPayment(id, policyReason, policy.refundRate);
  const result = await query(`UPDATE reservations SET status = 'cancelled', cancellation_reason = $1, cancelled_by = $2, cancelled_at = NOW() WHERE id = $3 RETURNING *`,
    [policyReason, req.user.id, id]);
  const recipientId = r.customer_id === req.user.id ? r.supplier_id : r.customer_id;
  if (r.customer_id === req.user.id) {
    const io = req.app.get('io');
    await notifyReservationStaff(id, 'تم إلغاء الحجز', 'تم إلغاء الحجز من قبل العميل.', io);
  }
  const notificationResult = await query(`INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تم إلغاء الحجز', $2, 'reservation', $3, 'reservation') RETURNING *`,
    [recipientId, `تم إلغاء الحجز. سياسة الإلغاء: استرداد ${policy.refundPercent}% وخصم ${policy.feePercent}%.${refund ? ` مبلغ الاسترداد: ${refund.refund_amount} ${refund.currency}.` : ''}`, id]);
  const io = req.app.get('io');
  if (io && notificationResult.rows[0]) io.to(`user_${recipientId}`).emit('new_notification', notificationResult.rows[0]);

  void notifyReservationWhatsApp(id, 'cancelled', policyReason);

  res.json({ success: true, data: result.rows[0], cancellation_policy: policy, refund: refund ? { status: refund.refund_rate === 1 ? 'refunded' : 'partially_refunded', amount: refund.refund_amount, currency: refund.currency } : { status: 'not_required' } });
}));

// ========================
// @desc    Complete reservation
// @route   PUT /api/reservations/:id/complete
// @access  Supplier
// ========================
router.put('/:id/complete', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND supplier_id = $2', [id, getSupplierId(req)]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  if (!['returned', 'active'].includes(reservation.rows[0].status)) return next(new AppError('لا يمكن إغلاق الحجز قبل استلام السيارة', 400));
  if (reservation.rows[0].status === 'active' && reservation.rows[0].handover_state !== 'returned') {
    return next(new AppError('يجب توثيق استرجاع السيارة أولاً', 400));
  }

  const result = await query(`UPDATE reservations SET status = 'completed', handover_state = 'closed', completed_at = NOW() WHERE id = $1 RETURNING *`, [id]);

  // Update car only after the return is documented and the reservation is closed.
  await query('UPDATE cars SET total_trips = total_trips + 1, status = $1 WHERE id = $2', ['available', reservation.rows[0].car_id]);

  void notifyReservationWhatsApp(id, 'completed');

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
// ========================
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT r.*, c.location_id AS car_location_id, c.make, c.model, c.year, c.color, c.license_plate,
      cu.name as customer_name, cu.phone as customer_phone,
      su.name as supplier_name, su.phone as supplier_phone,
      COALESCE((SELECT p.status FROM payments p WHERE p.reservation_id = r.id ORDER BY p.created_at DESC LIMIT 1), 'unpaid') AS payment_status,
      (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as car_image
    FROM reservations r
    JOIN cars c ON r.car_id = c.id
    JOIN users cu ON r.customer_id = cu.id
    JOIN users su ON r.supplier_id = su.id
    WHERE r.id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const r = result.rows[0];
  const supplierCanView = String(r.supplier_id) === String(getSupplierId(req)) && (!getBranchId(req) || String(r.car_location_id) === String(getBranchId(req)));
  if (r.customer_id !== req.user.id && !supplierCanView && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك', 403));
  }
  if (supplierCanView && r.customer_id !== req.user.id && r.payment_status !== 'paid' && req.user.role !== 'admin') {
    return next(new AppError('الحجز غير متاح للمورد قبل إتمام الدفع', 404));
  }

  res.json({ success: true, data: r });
}));

module.exports = router;
