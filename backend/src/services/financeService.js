const { query, getClient } = require('../config/database');
const { assertCurrency } = require('./currencyService');

const DEFAULT_CURRENCY = 'YER';

const createAdvertisementCharge = async (client, { advertisementId, supplierId, amount, currency = DEFAULT_CURRENCY, title }) => {
  const numericAmount = Number(amount || 0);
  const paymentCurrency = assertCurrency(currency);
  if (!advertisementId || !supplierId || !Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error('بيانات دفع الإعلان غير صالحة');
  const existing = await client.query(`SELECT * FROM payments WHERE advertisement_id=$1 AND status IN ('pending','paid') ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [advertisementId]);
  if (existing.rows[0]?.status === 'paid') return existing.rows[0];
  const providerReference = `SIM-AD-${advertisementId}-${Date.now()}`;
  const payment = await client.query(`INSERT INTO payments (advertisement_id,payer_id,supplier_id,amount,currency,payment_method,status,provider_reference,metadata,paid_at) VALUES ($1,$2,$3,$4,$5,'card','paid',$6,$7::jsonb,NOW()) RETURNING *`, [advertisementId, supplierId, supplierId, numericAmount, paymentCurrency, providerReference, JSON.stringify({ simulated: true, event: 'advertisement_checkout', title: title || null })]);
  const paidPayment = payment.rows[0];
  await client.query(`INSERT INTO ledger_entries (payment_id,advertisement_id,supplier_id,entry_type,direction,amount,currency,description,metadata) VALUES ($1,$2,$3,'charge','credit',$4,$5,$6,$7::jsonb),($1,$2,$3,'platform_revenue','credit',$4,$5,$6,$7::jsonb)`, [paidPayment.id, advertisementId, supplierId, numericAmount, paymentCurrency, `خصم محاكى لترويج الإعلان: ${title || advertisementId}`, JSON.stringify({ simulated: true })]);
  return paidPayment;
};

const getAdvertisementPricing = async () => (await query(`SELECT advertisement_price_per_day,advertisement_start_time,advertisement_end_time,currency FROM finance_settings WHERE id=1`)).rows[0];
const getSettings = async () => (await query(`SELECT id,currency,commission_rate,settlement_mode,ad_charge_policy,advertisement_price_per_day,advertisement_start_time,advertisement_end_time,updated_by,updated_at FROM finance_settings WHERE id=1`)).rows[0];

const updateSettings = async (adminId, data = {}) => {
  const currency = assertCurrency(data.currency || DEFAULT_CURRENCY);
  const commissionRate = Number(data.commission_rate ?? 10);
  const settlementMode = data.settlement_mode === 'automatic' ? 'automatic' : 'manual';
  const adPricePerDay = Number(data.advertisement_price_per_day ?? 1000);
  const adStartTime = data.advertisement_start_time || '08:00';
  const adEndTime = data.advertisement_end_time || '22:00';
  if (!Number.isFinite(adPricePerDay) || adPricePerDay <= 0) throw new Error('سعر الإعلان اليومي يجب أن يكون أكبر من صفر');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(adStartTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(adEndTime) || adStartTime >= adEndTime) throw new Error('وقت بداية الإعلان يجب أن يسبق وقت النهاية');
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) throw new Error('نسبة العمولة يجب أن تكون بين 0 و100');
  return (await query(`UPDATE finance_settings SET currency=$1,commission_rate=$2,settlement_mode=$3,advertisement_price_per_day=$4,advertisement_start_time=$5,advertisement_end_time=$6,updated_by=$7,updated_at=NOW() WHERE id=1 RETURNING *`, [currency, commissionRate, settlementMode, adPricePerDay, adStartTime, adEndTime, adminId])).rows[0];
};

const getDashboard = async () => {
  const [summary, adPayments, reservationPayments, pendingPayouts] = await Promise.all([
    query(`SELECT COALESCE(SUM(amount) FILTER (WHERE status='paid'),0)::numeric AS gross_revenue,COALESCE(SUM(amount) FILTER (WHERE status='paid' AND advertisement_id IS NOT NULL),0)::numeric AS advertisement_revenue,COALESCE(SUM(amount) FILTER (WHERE status='paid' AND reservation_id IS NOT NULL),0)::numeric AS reservation_revenue,COALESCE(SUM(amount) FILTER (WHERE status='refunded'),0)::numeric AS refunded_amount,COUNT(*) FILTER (WHERE status='paid')::int AS paid_transactions,COUNT(*) FILTER (WHERE status='pending')::int AS pending_transactions FROM payments`),
    query(`SELECT p.id,p.amount,p.currency,p.status,p.paid_at,p.provider_reference,a.title,u.name AS supplier_name FROM payments p LEFT JOIN advertisements a ON a.id=p.advertisement_id LEFT JOIN users u ON u.id=p.supplier_id WHERE p.advertisement_id IS NOT NULL ORDER BY p.created_at DESC LIMIT 100`),
    query(`SELECT p.id,p.amount,p.currency,p.status,p.paid_at,p.provider_reference,c.make,c.model FROM payments p LEFT JOIN reservations r ON r.id=p.reservation_id LEFT JOIN cars c ON c.id=r.car_id WHERE p.reservation_id IS NOT NULL ORDER BY p.created_at DESC LIMIT 100`),
    query(`SELECT sp.*,u.name AS supplier_name FROM supplier_payouts sp JOIN users u ON u.id=sp.supplier_id WHERE sp.status IN ('pending','processing') ORDER BY sp.created_at ASC LIMIT 100`),
  ]);
  return { summary: summary.rows[0], advertisementPayments: adPayments.rows, reservationPayments: reservationPayments.rows, pendingPayouts: pendingPayouts.rows };
};

/**
 * Supplier payout. If transactionClient is supplied, this function participates
 * in that transaction; otherwise it opens its own transaction for admin payouts.
 * Automatic payouts have no processed_by because no administrator processed them.
 */
const createPayout = async (adminId, supplierId, amount, notes = '', currency = null, transactionClient = null) => {
  const numericAmount = Number(amount);
  const payoutCurrency = assertCurrency(currency || DEFAULT_CURRENCY);
  if (!supplierId || !Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error('بيانات التسوية غير صالحة');
  const db = transactionClient || { query };
  const ownsTransaction = !transactionClient;
  try {
    if (ownsTransaction) await db.query('BEGIN');
    const balance = await db.query(
      `SELECT
         COALESCE((SELECT SUM(amount) FROM ledger_entries WHERE supplier_id=$1 AND entry_type='supplier_payable' AND direction='credit' AND currency=$2),0) AS payable,
         COALESCE((SELECT SUM(amount) FROM supplier_payouts WHERE supplier_id=$1 AND status IN ('paid','pending','processing') AND currency=$2),0) AS reserved_payouts
       FROM users WHERE id=$1 FOR UPDATE`,
      [supplierId, payoutCurrency],
    );
    if (!balance.rows.length) throw new Error('المورد غير موجود');
    const available = Number(balance.rows[0].payable || 0) - Number(balance.rows[0].reserved_payouts || 0);
    if (numericAmount > available + 0.000001) throw new Error(`مبلغ التسوية يتجاوز الرصيد المتاح للمورد (${Math.max(0, available).toFixed(2)} ${payoutCurrency})`);

    const settings = await getSettings();
    const mode = settings.settlement_mode;
    const status = mode === 'automatic' ? 'paid' : 'pending';
    const processedBy = mode === 'automatic' ? null : adminId;
    const result = await db.query(`INSERT INTO supplier_payouts (supplier_id,amount,currency,mode,status,notes,processed_by,processed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $5='paid' THEN NOW() ELSE NULL END) RETURNING *`, [supplierId, numericAmount, payoutCurrency, mode, status, notes || null, processedBy]);
    if (status === 'paid') await db.query(`INSERT INTO ledger_entries (supplier_id,entry_type,direction,amount,currency,description,metadata) VALUES ($1,'payout','debit',$2,$3,$4,$5::jsonb)`, [supplierId, numericAmount, payoutCurrency, 'تسوية تلقائية للمورد', JSON.stringify({ simulated: true, payout_id: result.rows[0].id })]);
    if (ownsTransaction) await db.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    if (ownsTransaction) await db.query('ROLLBACK');
    throw error;
  }
};

const completePayout = async (adminId, payoutId, notes = '') => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const payout = await client.query(`SELECT * FROM supplier_payouts WHERE id=$1 AND status='pending' FOR UPDATE`, [payoutId]);
    if (!payout.rows.length) throw new Error('طلب التسوية غير موجود أو تمت معالجته');
    const current = payout.rows[0];
    const balance = await client.query(`SELECT COALESCE((SELECT SUM(amount) FROM ledger_entries WHERE supplier_id=$1 AND entry_type='supplier_payable' AND direction='credit' AND currency=$2),0) AS payable,COALESCE((SELECT SUM(amount) FROM supplier_payouts WHERE supplier_id=$1 AND status IN ('paid','pending','processing') AND currency=$2 AND id<>$3),0) AS reserved_payouts FROM users WHERE id=$1 FOR UPDATE`, [current.supplier_id, current.currency, payoutId]);
    const available = Number(balance.rows[0]?.payable || 0) - Number(balance.rows[0]?.reserved_payouts || 0);
    if (Number(current.amount) > available + 0.000001) throw new Error('لا يمكن إكمال التسوية: الرصيد المتاح للمورد غير كافٍ');
    const updated = await client.query(`UPDATE supplier_payouts SET status='paid',processed_by=$1,processed_at=NOW(),notes=COALESCE($2,notes) WHERE id=$3 RETURNING *`, [adminId, notes || null, payoutId]);
    await client.query(`INSERT INTO ledger_entries (supplier_id,entry_type,direction,amount,currency,description,metadata) VALUES ($1,'payout','debit',$2,$3,'تسوية يدوية للمورد',$4::jsonb)`, [current.supplier_id, current.amount, current.currency, JSON.stringify({ payout_id: payoutId, simulated: true })]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
};

module.exports = { createAdvertisementCharge, getAdvertisementPricing, getSettings, updateSettings, getDashboard, createPayout, completePayout };