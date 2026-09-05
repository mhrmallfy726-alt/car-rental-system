const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');
const financeService = require('../services/financeService');
const { listCurrencies, assertCurrency, convertFromYER } = require('../services/currencyService');
const { sendTextMessage } = require('../services/whatsappService');

const isValidCardNumber = (value) => {
  const digits = String(value || '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
};

// GET /api/payments/currencies
router.get('/currencies', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: listCurrencies(), default_currency: 'YER' });
}));

// GET /api/payments/cards
router.get('/cards', protect, asyncHandler(async (req, res) => {
  const result = await query('SELECT id, card_holder_name, card_number_masked, expiry_month, expiry_year, brand, is_default, simulated_balance_yer, gateway_status FROM saved_cards WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

// POST /api/payments/cards
router.post('/cards', protect, asyncHandler(async (req, res, next) => {
  const { card_holder_name, card_number, expiry_month, expiry_year, cvv } = req.body;
  const simulatedBalance = Number(req.body.simulated_balance_yer ?? 1000000);
  if (!isValidCardNumber(card_number) || !/^\d{3,4}$/.test(String(cvv || ''))) return next(new AppError('رقم البطاقة أو رمز الأمان غير صالح', 400));
  const expiryMonth = Number(expiry_month);
  const expiryYear = Number(expiry_year < 100 ? `20${String(expiry_year).padStart(2, '0')}` : expiry_year);
  const now = new Date();
  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12 || !Number.isInteger(expiryYear) || expiryYear < now.getFullYear() || (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)) return next(new AppError('البطاقة منتهية أو تاريخها غير صالح', 400));
  if (!Number.isFinite(simulatedBalance) || simulatedBalance < 0 || simulatedBalance > 100000000) return next(new AppError('الرصيد التجريبي غير صالح', 400));
  
  const masked = '**** **** **** ' + card_number.slice(-4);
  const brand = card_number.startsWith('4') ? 'Visa' : 'Mastercard';
  const token = 'tok_' + Math.random().toString(36).substr(2, 9); // Simulated token

  // If first card, make it default
  const existing = await query('SELECT id FROM saved_cards WHERE user_id = $1', [req.user.id]);
  const isDefault = existing.rows.length === 0;

  const result = await query(
    `INSERT INTO saved_cards (user_id, card_holder_name, card_number_masked, card_token, expiry_month, expiry_year, brand, is_default, simulated_balance_yer)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, card_holder_name, card_number_masked, expiry_month, expiry_year, brand, is_default, simulated_balance_yer`,
    [req.user.id, card_holder_name, masked, token, expiry_month, expiry_year, brand, isDefault, simulatedBalance]
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
  const { reservation_id, payment_method, saved_card_id, with_driver } = req.body;
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
  if (with_driver !== undefined && typeof with_driver !== 'boolean') return next(new AppError('اختيار السائق غير صالح', 400));
  const existingPaid = await query(
    `SELECT id FROM payments WHERE reservation_id = $1 AND status = 'paid' LIMIT 1`,
    [reservation_id]
  );
  if (existingPaid.rows.length > 0) return next(new AppError('تم دفع هذا الحجز مسبقاً', 409));

  if (with_driver !== undefined) {
    await query('UPDATE reservations SET with_driver = $1 WHERE id = $2', [with_driver, reservation_id]);
  }

  if (saved_card_id) {
    const card = await query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [saved_card_id, req.user.id]);
    if (card.rows.length === 0) return next(new AppError('البطاقة غير صالحة', 400));
  }

  const charge = await financeService.createReservationCharge({
    reservationId: reservation_id,
    customerId: req.user.id,
    savedCardId: saved_card_id,
    paymentMethod: payment_method || 'simulation',
    currency,
    withDriver: req.body.with_driver,
  });
  const payment = { rows: [charge.payment] };
  const financeSettings = await financeService.getSettings();
  let settlementWarning = null;
  if (financeSettings.settlement_mode === 'automatic' && charge.supplierPayable > 0) {
    try {
      await financeService.createPayout(req.user.id, r.supplier_id, charge.supplierPayable, `تسوية تلقائية محاكاة للحجز ${reservation_id}`, currency);
    } catch (error) {
      settlementWarning = 'تم تأكيد الدفع، لكن التسوية التلقائية تحتاج مراجعة الإدارة المالية';
      console.error('Automatic simulated payout failed:', error.message);
    }
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
    data: { ...payment.rows[0], commission: charge.commission, supplier_payable: charge.supplierPayable, simulated: true },
    verification: { gateway: 'local_database', verified: true, reconciliation_status: 'matched', balance_after_yer: charge.gateway.balanceAfter },
    settlement_warning: settlementWarning,
    reservation_status: latestReservation.rows[0]?.status || r.status,
    handover_state: latestReservation.rows[0]?.handover_state || r.handover_state,
  });
}));

router.get('/:id/verify', protect, asyncHandler(async (req, res, next) => {
  const result = await query(
    `SELECT p.*, r.customer_id, r.supplier_id,
            COALESCE((SELECT SUM(amount) FROM ledger_entries WHERE payment_id=p.id AND entry_type='platform_fee' AND direction='credit'),0) AS commission,
            COALESCE((SELECT SUM(amount) FROM ledger_entries WHERE payment_id=p.id AND entry_type='supplier_payable' AND direction='credit'),0) AS supplier_payable,
            COALESCE((SELECT SUM(amount) FROM ledger_entries WHERE payment_id=p.id AND direction='credit'),0) AS ledger_total
       FROM payments p JOIN reservations r ON r.id=p.reservation_id
      WHERE p.id=$1`,
    [req.params.id]
  );
  if (!result.rows.length) return next(new AppError('عملية الدفع غير موجودة', 404));
  const payment = result.rows[0];
  const allowed = req.user.role === 'admin' || req.user.id === payment.customer_id || req.user.id === payment.supplier_id;
  if (!allowed) return next(new AppError('غير مصرح لك بالتحقق من عملية الدفع', 403));
  const verified = payment.status === 'paid'
    && payment.provider_reference?.startsWith('SIM-')
    && payment.metadata?.simulated === true
    && Math.abs(Number(payment.commission) + Number(payment.supplier_payable) - Number(payment.amount)) < 0.01
    && Math.abs(Number(payment.ledger_total) - (Number(payment.amount) + Number(payment.commission) + Number(payment.supplier_payable))) < 0.01;
  res.json({ success: true, data: { payment_id: payment.id, gateway: 'sandbox', verified, reconciliation_status: verified ? 'matched' : 'check', amount: payment.amount, currency: payment.currency, commission: payment.commission, supplier_payable: payment.supplier_payable } });
}));

router.get('/history', protect, asyncHandler(async (req, res) => {
  const result = await query(`SELECT p.*, c.make, c.model FROM payments p JOIN reservations r ON p.reservation_id = r.id JOIN cars c ON r.car_id = c.id WHERE p.customer_id = $1 ORDER BY p.created_at DESC`, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
