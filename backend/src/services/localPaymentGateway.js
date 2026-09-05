const crypto = require('crypto');

const captureReservationPayment = async (client, {
  savedCardId,
  userId,
  reservationId,
  paymentId,
  amountYER,
}) => {
  const amount = Number(amountYER);
  if (!savedCardId || !userId || !reservationId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('بيانات بوابة الدفع المحلية غير مكتملة');
  }

  const cardResult = await client.query(
    `SELECT id, user_id, simulated_balance_yer, gateway_status, expiry_month, expiry_year
       FROM saved_cards
      WHERE id = $1 AND user_id = $2
      FOR UPDATE`,
    [savedCardId, userId]
  );
  if (!cardResult.rows.length) throw new Error('البطاقة غير موجودة أو لا تخص هذا العميل');
  const card = cardResult.rows[0];
  if (card.gateway_status !== 'active') throw new Error('البطاقة موقوفة أو منتهية في البوابة المحلية');
  const expiryMonth = Number(card.expiry_month);
  const expiryYear = Number(card.expiry_year < 100 ? `20${String(card.expiry_year).padStart(2, '0')}` : card.expiry_year);
  const now = new Date();
  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12 || !Number.isInteger(expiryYear) || expiryYear < now.getFullYear() || (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)) {
    throw new Error('البطاقة منتهية الصلاحية في البوابة المحلية');
  }

  const balanceBefore = Number(card.simulated_balance_yer || 0);
  if (balanceBefore < amount) {
    const reference = `SIM-DECLINED-${crypto.randomUUID()}`;
    await client.query(
      `INSERT INTO payment_gateway_transactions
       (saved_card_id,user_id,reservation_id,payment_id,provider_reference,amount_yer,balance_before_yer,balance_after_yer,status,failure_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'declined',$8)`,
      [savedCardId, userId, reservationId, paymentId, reference, amount, balanceBefore, 'الرصيد المتاح في البطاقة غير كافٍ']
    );
    throw new Error(`فشل الدفع: الرصيد غير كافٍ. الرصيد المتاح ${balanceBefore.toFixed(2)} ر.ي.`);
  }

  const balanceAfter = Number((balanceBefore - amount).toFixed(2));
  const reference = `SIM-CAPTURE-${crypto.randomUUID()}`;
  await client.query(
    `UPDATE saved_cards SET simulated_balance_yer = $1, last_used_at = NOW() WHERE id = $2`,
    [balanceAfter, savedCardId]
  );
  const transaction = await client.query(
    `INSERT INTO payment_gateway_transactions
     (saved_card_id,user_id,reservation_id,payment_id,provider_reference,amount_yer,balance_before_yer,balance_after_yer,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'captured') RETURNING *`,
    [savedCardId, userId, reservationId, paymentId, reference, amount, balanceBefore, balanceAfter]
  );
  return { reference, balanceBefore, balanceAfter, transaction: transaction.rows[0] };
};

module.exports = { captureReservationPayment };
