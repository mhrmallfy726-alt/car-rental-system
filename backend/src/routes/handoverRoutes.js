const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');
const { uploadHandoverImages } = require('../middleware/upload');

const REPORT_WINDOW_MS = 60 * 60 * 1000;

function getScheduledAt(reservation, type) {
  const value = type === 'before' ? reservation.pickup_at : reservation.return_at;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isReportWindowOpen(reservation, type) {
  const scheduledAt = getScheduledAt(reservation, type);
  if (!scheduledAt) return false;
  return Date.now() >= scheduledAt.getTime() - REPORT_WINDOW_MS;
}

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

  if (!isReportWindowOpen(reservation, type)) {
    const scheduledAt = getScheduledAt(reservation, type);
    return next(new AppError(`لا يمكن رفع تقرير ${type === 'before' ? 'التسليم' : 'الإرجاع'} قبل ساعة من الموعد المحدد (${scheduledAt.toLocaleString('ar-YE')})`, 425));
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

router.post('/:reservationId/before/review', protect, uploadHandoverImages, asyncHandler(async (req, res, next) => {
  const { reservationId } = req.params;
  const { result, notes = '' } = req.body;
  if (!['matched', 'discrepancy'].includes(result)) return next(new AppError('نتيجة المطابقة يجب أن تكون matched أو discrepancy', 400));
  if (result === 'discrepancy' && String(notes).trim().length < 3 && !req.files?.length) {
    return next(new AppError('عند تسجيل اختلاف يجب إضافة وصف أو صورة واحدة على الأقل', 400));
  }

  const reservationResult = await query(
    `SELECT r.id, r.customer_id, r.supplier_id, r.status, h.id AS handover_log_id
     FROM reservations r
     LEFT JOIN handover_logs h ON h.reservation_id = r.id AND h.type = 'before'
     WHERE r.id = $1`,
    [reservationId]
  );
  if (!reservationResult.rows.length) return next(new AppError('الحجز غير موجود', 404));
  const reservation = reservationResult.rows[0];
  if (reservation.customer_id !== req.user.id) return next(new AppError('غير مصرح لك بمراجعة هذا التقرير', 403));
  if (!reservation.handover_log_id) return next(new AppError('لم يرفع المورد تقرير التسليم بعد', 409));
  if (!['active', 'returned', 'completed'].includes(reservation.status)) return next(new AppError('لا يمكن مراجعة تقرير التسليم في الحالة الحالية', 400));

  const existing = await query(
    `SELECT id FROM handover_verifications WHERE reservation_id = $1 AND handover_log_id = $2 AND stage = 'before'`,
    [reservationId, reservation.handover_log_id]
  );
  if (existing.rows.length) return next(new AppError('تمت مراجعة تقرير التسليم مسبقاً', 409));

  const verification = await query(
    `INSERT INTO handover_verifications (reservation_id, handover_log_id, verified_by, stage, result, notes)
     VALUES ($1, $2, $3, 'before', $4, $5) RETURNING *`,
    [reservationId, reservation.handover_log_id, req.user.id, result, String(notes).trim()]
  );

  if (req.files?.length) {
    for (const file of req.files) {
      await query(
        'INSERT INTO handover_verification_images (verification_id, image_url) VALUES ($1, $2)',
        [verification.rows[0].id, file.path.replace(/\\/g, '/')]
      );
    }
  }

  if (result === 'discrepancy') {
    await query(`UPDATE reservations SET status = 'disputed' WHERE id = $1 AND status IN ('active', 'returned')`, [reservationId]);
  }

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${reservation.supplier_id}`).emit('handover_verification_created', {
      reservationId,
      stage: 'before',
      result,
      status: result === 'discrepancy' ? 'disputed' : reservation.status
    });
  }

  res.status(201).json({ success: true, data: verification.rows[0], message: result === 'matched' ? 'تم تأكيد مطابقة السيارة' : 'تم تسجيل الاختلاف وإبلاغ المورد' });
}));

router.get('/:reservationId', protect, asyncHandler(async (req, res, next) => {
  const reservation = await query('SELECT customer_id, supplier_id FROM reservations WHERE id = $1', [req.params.reservationId]);
  if (!reservation.rows.length) return next(new AppError('الحجز غير موجود', 404));
  const r = reservation.rows[0];
  if (![r.customer_id, r.supplier_id].includes(req.user.id) && req.user.role !== 'admin') return next(new AppError('غير مصرح لك', 403));

  const logs = await query('SELECT * FROM handover_logs WHERE reservation_id = $1 ORDER BY created_at', [req.params.reservationId]);
  for (const log of logs.rows) {
    const imgs = await query('SELECT * FROM handover_images WHERE handover_log_id = $1', [log.id]);
    const verification = await query(
      `SELECT v.*, COALESCE(json_agg(i ORDER BY i.created_at) FILTER (WHERE i.id IS NOT NULL), '[]') AS verification_images
       FROM handover_verifications v
       LEFT JOIN handover_verification_images i ON i.verification_id = v.id
       WHERE v.handover_log_id = $1
       GROUP BY v.id`,
      [log.id]
    );
    log.images = imgs.rows;
    log.verification = verification.rows[0] || null;
  }
  res.json({ success: true, data: logs.rows });
}));

module.exports = router;
