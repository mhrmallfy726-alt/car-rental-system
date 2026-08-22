const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const { uploadHandoverImages } = require('../middleware/upload');

// Record before-delivery or after-return inspection and advance the reservation lifecycle.
router.post('/:reservationId/:type', protect, uploadHandoverImages, asyncHandler(async (req, res, next) => {
  const { reservationId, type } = req.params;
  if (!['before', 'after'].includes(type)) return next(new AppError('النوع يجب أن يكون before أو after', 400));

  const { fuel_level, mileage, condition_notes, exterior_condition, interior_condition, gps_lat, gps_lng, images } = req.body;
  const fuel = Number.parseInt(fuel_level, 10);
  const mil = Number.parseInt(mileage, 10);
  if (!Number.isFinite(fuel) || fuel < 0 || fuel > 100) return next(new AppError('نسبة الوقود يجب أن تكون بين 0 و100', 400));
  if (!Number.isFinite(mil) || mil < 0) return next(new AppError('قراءة العداد غير صحيحة', 400));

  const reservationResult = await query(
    `SELECT r.*, c.make, c.model
     FROM reservations r JOIN cars c ON c.id = r.car_id
     WHERE r.id = $1`,
    [reservationId]
  );
  if (reservationResult.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));

  const reservation = reservationResult.rows[0];
  const isOwner = reservation.supplier_id === req.user.id || req.user.role === 'admin';
  if (!isOwner) return next(new AppError('غير مصرح لك بتوثيق هذا الحجز', 403));

  const expectedStatus = type === 'before' ? ['approved', 'awaiting_pickup'] : ['active'];
  if (!expectedStatus.includes(reservation.status)) {
    return next(new AppError(type === 'before' ? 'الحجز ليس في انتظار التسليم' : 'السيارة ليست مستلمة من العميل حالياً', 400));
  }

  const duplicate = await query('SELECT id FROM handover_logs WHERE reservation_id = $1 AND type = $2', [reservationId, type]);
  if (duplicate.rows.length) return next(new AppError('تم توثيق هذه المرحلة مسبقاً', 409));

  const log = await query(
    `INSERT INTO handover_logs (reservation_id, type, recorded_by, fuel_level, mileage, condition_notes, exterior_condition, interior_condition, gps_lat, gps_lng,images)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [reservationId, type, req.user.id, fuel, mil, condition_notes || '', exterior_condition, interior_condition, gps_lat || null, gps_lng || null]
  );

  if (req.files?.length) {
    for (const file of req.files) {
      const filePath = file.path.replace(/\\/g, '/');
      await query('INSERT INTO handover_images (handover_log_id, image_url) VALUES ($1,$2)', [log.rows[0].id, filePath]);
    }
  }

  if (type === 'before') {
    await query(
      `UPDATE reservations
       SET status = 'active', handover_state = 'with_customer', before_handover_at = NOW(), vehicle_delivered_at = NOW()
       WHERE id = $1`,
      [reservationId]
    );
    await query('UPDATE cars SET status = $1, mileage = GREATEST(mileage, $2) WHERE id = $3', ['reserved', mil, reservation.car_id]);
  } else {
    await query(
      `UPDATE reservations
       SET status = 'returned', handover_state = 'returned', after_handover_at = NOW(), vehicle_returned_at = NOW()
       WHERE id = $1`,
      [reservationId]
    );
    await query('UPDATE cars SET mileage = GREATEST(mileage, $1) WHERE id = $2', [mil, reservation.car_id]);
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${reservation.customer_id}`).emit('reservation_status_updated', {
      reservationId,
      status: type === 'before' ? 'active' : 'returned',
      handoverState: type === 'before' ? 'with_customer' : 'returned'
    });
  }

  res.status(201).json({
    success: true,
    data: log.rows[0],
    lifecycle: type === 'before'
      ? { status: 'active', handover_state: 'with_customer', message: 'السيارة الآن مع العميل' }
      : { status: 'returned', handover_state: 'returned', message: 'تم استلام السيارة من العميل ويمكن إغلاق الحجز' }
  });
}));

router.get('/:reservationId', protect, asyncHandler(async (req, res, next) => {
  const reservation = await query('SELECT customer_id, supplier_id FROM reservations WHERE id = $1', [req.params.reservationId]);
  if (!reservation.rows.length) return next(new AppError('الحجز غير موجود', 404));
  const r = reservation.rows[0];
  if (![r.customer_id, r.supplier_id].includes(req.user.id) && req.user.role !== 'admin') return next(new AppError('غير مصرح لك', 403));

  const logs = await query('SELECT * FROM handover_logs WHERE reservation_id = $1 ORDER BY created_at', [req.params.reservationId]);
  for (const log of logs.rows) {
    const imgs = await query('SELECT * FROM handover_images WHERE handover_log_id = $1', [log.id]);
    log.images = imgs.rows;
  }
  res.json({ success: true, data: logs.rows });
}));

module.exports = router;
