const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');
const financeService = require('../services/financeService');
const { listCurrencies, assertCurrency, convertFromYER } = require('../services/currencyService');
const { sendTextMessage } = require('../services/whatsappService');

// GET /api/payments/currencies
router.get('/currencies', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: listCurrencies(), default_currency: 'YER' });
}));

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

router.post('/advertisement-checkout', protect, asyncHandler(async (req, res, next) => {
  const { advertisement_id, payment_method = 'card', currency = 'YER', saved_card_id } = req.body;
  if (!advertisement_id) return next(new AppError('رقم الإعلان مطلوب', 400));
  assertCurrency(currency);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const adResult = await client.query(`SELECT a.*, r.supplier_id AS request_supplier_id FROM advertisements a LEFT JOIN advertisement_requests r ON r.id = a.request_id WHERE a.id = $1 FOR UPDATE`, [advertisement_id]);
    const ad = adResult.rows[0];
    if (!ad) throw new AppError('الإعلان غير موجود', 404);
    if (ad.supplier_id !== req.user.id && req.user.role !== 'admin') throw new AppError('لا تملك صلاحية دفع هذا الإعلان', 403);
    if (ad.payment_status === 'paid') throw new AppError('تم دفع هذا الإعلان مسبقاً', 409);
    if (!['pending', 'awaiting_payment'].includes(ad.status)) throw new AppError('الإعلان غير جاهز للدفع', 400);
    if (saved_card_id) {
      const card = await client.query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [saved_card_id, req.user.id]);
      if (!card.rows.length) throw new AppError('البطاقة غير صالحة', 400);
    }
    const baseAmountYER = Number(ad.total_price || ad.price || 0);
    if (!Number.isFinite(baseAmountYER) || baseAmountYER <= 0) throw new AppError('قيمة الإعلان غير صالحة', 400);
    const totalAmount = convertFromYER(baseAmountYER, currency);
    const payment = await financeService.createAdvertisementCharge(client, { advertisementId: ad.id, supplierId: ad.supplier_id, amount: totalAmount, currency, title: ad.title });
    await client.query(`UPDATE advertisements SET status='active', payment_status='paid', payment_id=$1, paid_at=NOW() WHERE id=$2`, [payment.id, ad.id]);
    await client.query(`UPDATE advertisement_requests SET payment_status='paid', payment_id=$1 WHERE id=$2`, [payment.id, ad.request_id]);
    await client.query(`INSERT INTO notifications (user_id,title,message,type,reference_id,reference_type) VALUES ($1,$2,$3,'system',$4,'advertisement')`, [ad.supplier_id, 'تم دفع الإعلان وبدء نشره', `تم دفع إعلان «${ad.title}» وبدأ نشره حسب الوقت المحدد.`, ad.id]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: payment, advertisement_status: 'active' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}));

router.post('/checkout', protect, asyncHandler(async (req, res, next) => {
  const { reservation_id, payment_method, saved_card_id } = req.body;
  let currency;
  try {
    currency = assertCurrency(req.body.currency || 'YER');
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
  const reservation = await query('SELECT * FROM reservations WHERE id = $1 AND customer_id = $2', [reservation_id, req.user.id]);
  if (reservation.rows.length === 0) return next(new AppError('الحجز غير موجود', 404));
  const r = reservation.rows[0];
  if (!['pending', 'approved'].includes(r.status)) return next(new AppError('لا يمكن الدفع لهذا الحجز في حالته الحالية', 400));
  const existingPaid = await query(
    `SELECT id FROM payments WHERE reservation_id = $1 AND status = 'paid' LIMIT 1`,
    [reservation_id]
  );
  if (existingPaid.rows.length > 0) return next(new AppError('تم دفع هذا الحجز مسبقاً', 409));

  if (saved_card_id) {
    const card = await query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [saved_card_id, req.user.id]);
    if (card.rows.length === 0) return next(new AppError('البطاقة غير صالحة', 400));
  }

  const baseAmountYER = Number(r.total_price || 0);
  const totalAmount = convertFromYER(baseAmountYER, currency);
  const payment = await query(
    `INSERT INTO payments
      (reservation_id, customer_id, payer_id, supplier_id, amount,
       currency, payment_method, status, provider_reference, metadata, paid_at)
     VALUES ($1, $2, $2, $3, $4, $5, $6, 'paid', $7, $8::jsonb, NOW())
     RETURNING *`,
    [
      reservation_id,
      req.user.id,
      r.supplier_id,
      totalAmount,
      currency,
      payment_method || 'card',
      `SIM-RES-${reservation_id}-${Date.now()}`,
      JSON.stringify({ simulated: true, event: 'reservation_checkout', base_amount: baseAmountYER, base_currency: 'YER', exchange_rate_to_YER: totalAmount ? Number((baseAmountYER / totalAmount).toFixed(6)) : 0 }),
    ]
  );

  const financeSettings = await financeService.getSettings();
  const commission = totalAmount * Number(financeSettings.commission_rate || 0) / 100;
  const supplierPayable = Math.max(0, totalAmount - commission);

  await query(
    `INSERT INTO ledger_entries
      (payment_id, reservation_id, supplier_id, entry_type, direction,
       amount, currency, description, metadata)
     VALUES ($1, $2, $3, 'charge', 'credit', $4, $5, $6, $7::jsonb),
            ($1, $2, $3, 'platform_fee', 'credit', $8, $5, $9, $7::jsonb),
            ($1, $2, $3, 'supplier_payable', 'credit', $10, $5, $11, $7::jsonb)`,
    [
      payment.rows[0].id,
      reservation_id,
      r.supplier_id,
      totalAmount,
      currency,
      'تحصيل حجز محاكى',
      JSON.stringify({ simulated: true, commission_rate: financeSettings.commission_rate }),
      commission,
      'عمولة المنصة',
      supplierPayable,
      'مستحق المورد قبل التسوية',
    ]
  );

  if (financeSettings.settlement_mode === 'automatic' && supplierPayable > 0) {
    await financeService.createPayout(
      req.user.id,
      r.supplier_id,
      supplierPayable,
      `تسوية تلقائية محاكاة للحجز ${reservation_id}`,
      currency,
    );
  }

  // Payment-first flow: payment never marks a reservation active.
  // The supplier must approve it first, then the handover report moves it to active.
  if (r.status === 'approved') {
    await query(
      `UPDATE reservations
       SET status = 'awaiting_pickup', handover_state = 'awaiting_pickup'
       WHERE id = $1 AND status = 'approved'`,
      [reservation_id]
    );
  }

  const supplierInfo = await query(
    `SELECT r.supplier_id, c.make, c.model, u.phone AS supplier_phone
     FROM reservations r
     JOIN cars c ON c.id = r.car_id
     JOIN users u ON u.id = r.supplier_id
     WHERE r.id = $1`,
    [reservation_id]
  );
  const supplier = supplierInfo.rows[0];
  if (r.status === 'pending' && supplier) {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, 'reservation', $4, 'reservation')`,
      [supplier.supplier_id, 'طلب حجز مدفوع', `تم دفع حجز سيارة ${supplier.make} ${supplier.model}. يرجى مراجعته.`, reservation_id]
    );
    const io = req.app.get('io');
    if (io) io.to(`user_${supplier.supplier_id}`).emit('new_notification', { type: 'reservation', message: 'لديك طلب حجز مدفوع جديد' });
    if (supplier.supplier_phone) {
      void sendTextMessage({
        to: supplier.supplier_phone,
        body: `لديك طلب حجز مدفوع للسيارة ${supplier.make} ${supplier.model}. يرجى مراجعة الطلب من لوحة المورد.\\nرقم الحجز: ${reservation_id}`,
      });
    }
  }

  const latestReservation = await query('SELECT status, handover_state FROM reservations WHERE id = $1', [reservation_id]);
  res.status(201).json({
    success: true,
    data: payment.rows[0],
    reservation_status: latestReservation.rows[0]?.status || r.status,
    handover_state: latestReservation.rows[0]?.handover_state || r.handover_state,
  });
}));

router.get('/history', protect, asyncHandler(async (req, res) => {
  const result = await query(`SELECT p.*, c.make, c.model FROM payments p JOIN reservations r ON p.reservation_id = r.id JOIN cars c ON r.car_id = c.id WHERE p.customer_id = $1 ORDER BY p.created_at DESC`, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
