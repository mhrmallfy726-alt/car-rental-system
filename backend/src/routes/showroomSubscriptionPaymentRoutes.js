const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query, getClient } = require('../config/database');

router.use(protect, authorize('supplier'));

router.post('/checkout', asyncHandler(async (req, res, next) => {
  const { subscription_id, payment_method = 'card' } = req.body;
  if (!subscription_id) return next(new AppError('رقم الاشتراك مطلوب', 400));

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      SELECT ss.*, l.showroom_name, l.city, l.supplier_id AS location_supplier_id
      FROM showroom_subscriptions ss
      JOIN locations l ON l.id = ss.showroom_id
      WHERE ss.id = $1 AND ss.supplier_id = $2 AND l.supplier_id = $2
      FOR UPDATE
    `, [subscription_id, req.user.id]);
    const subscription = result.rows[0];
    if (!subscription) throw new AppError('طلب الاشتراك غير موجود', 404);
    if (subscription.status === 'paid') throw new AppError('تم دفع هذا الاشتراك مسبقاً', 409);
    if (subscription.status !== 'pending') throw new AppError('حالة الاشتراك لا تسمح بالدفع', 400);

    const settings = await client.query('SELECT enabled FROM showroom_subscription_settings WHERE id = 1');
    if (settings.rows[0] && !settings.rows[0].enabled) throw new AppError('اشتراكات المعارض متوقفة حالياً', 403);

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    if (subscription.plan === 'annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const payment = await client.query(`
      INSERT INTO payments
        (reservation_id, customer_id, showroom_subscription_id, payer_id, supplier_id,
         amount, currency, payment_method, status, provider_reference, metadata, paid_at)
      VALUES (NULL, NULL, $1, $2, $2, $3, $4, $5, 'paid', $6, $7::jsonb, NOW())
      RETURNING *
    `, [
      subscription.id,
      req.user.id,
      subscription.amount,
      subscription.currency,
      payment_method,
      `SIM-SHOWROOM-${subscription.id}-${Date.now()}`,
      JSON.stringify({ simulated: true, event: 'showroom_subscription_checkout', plan: subscription.plan, showroom_id: subscription.showroom_id }),
    ]);

    await client.query(`
      UPDATE showroom_subscriptions
      SET status='paid', starts_at=$1, expires_at=$2, payment_id=$3, updated_at=NOW()
      WHERE id=$4
    `, [startsAt, expiresAt, payment.rows[0].id, subscription.id]);

    await client.query(`
      UPDATE locations
      SET is_active=TRUE, subscription_status='active', subscription_plan=$1,
          subscription_started_at=$2, subscription_expires_at=$3, updated_at=NOW()
      WHERE id=$4 AND supplier_id=$5
    `, [subscription.plan, startsAt, expiresAt, subscription.showroom_id, req.user.id]);

    await client.query(`
      INSERT INTO ledger_entries (payment_id, supplier_id, entry_type, direction, amount, currency, description, metadata)
      VALUES ($1,$2,'charge','credit',$3,$4,$5,$6::jsonb)
    `, [
      payment.rows[0].id,
      req.user.id,
      subscription.amount,
      subscription.currency,
      `اشتراك معرض ${subscription.showroom_name}`,
      JSON.stringify({ type: 'showroom_subscription', plan: subscription.plan, showroom_id: subscription.showroom_id }),
    ]);

    await client.query(`
      INSERT INTO notifications (user_id,title,message,type,reference_id,reference_type)
      VALUES ($1,$2,$3,'system',$4,'showroom_subscription')
    `, [req.user.id, 'تم تفعيل المعرض', `تم تفعيل معرض «${subscription.showroom_name}» في ${subscription.city} حتى ${expiresAt.toISOString().slice(0,10)}.`, subscription.id]);

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      data: { payment: payment.rows[0], subscription: { ...subscription, status: 'paid', starts_at: startsAt, expires_at: expiresAt }, showroom_status: 'active' },
      message: 'تم دفع الاشتراك وتفعيل المعرض بنجاح',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

module.exports = router;
