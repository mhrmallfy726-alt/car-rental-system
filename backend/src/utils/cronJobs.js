const cron = require('node-cron');
const { query } = require('../config/database');
const { sendTemplateMessage } = require('../services/whatsappService');

async function createInAppNotification({ userId, title, message, type = 'reservation', referenceId, io }) {
  const result = await query(
    `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
     VALUES ($1, $2, $3, $4, $5, 'reservation') RETURNING *`,
    [userId, title, message, type, referenceId]
  );
  if (io) io.to(`user_${userId}`).emit('new_notification', result.rows[0]);
  return result.rows[0];
}

async function claimReminder(reservationId, kind, channel) {
  const result = await query(
    `INSERT INTO reservation_reminders (reservation_id, kind, channel, status)
     VALUES ($1, $2, $3, 'pending')
     ON CONFLICT (reservation_id, kind, channel) DO NOTHING
     RETURNING id`,
    [reservationId, kind, channel]
  );
  return result.rows[0]?.id || null;
}

async function completeReminder(id, status, details = {}) {
  await query(
    `UPDATE reservation_reminders
     SET status = $1, provider_message_id = $2, error_message = $3, sent_at = CASE WHEN $1 = 'sent' THEN NOW() ELSE sent_at END
     WHERE id = $4`,
    [status, details.messageId || null, details.error || null, id]
  );
}

async function sendWhatsAppReminder(reservation, kind) {
  const reminderId = await claimReminder(reservation.id, kind, 'whatsapp');
  if (!reminderId) return { sent: false, duplicate: true };
  try {
    const result = await sendTemplateMessage({
      to: reservation.customer_phone,
      parameters: [
        reservation.customer_name || 'عميلنا الكريم',
        `${reservation.make} ${reservation.model}`,
        kind === 'pickup_24h' ? reservation.pickup_at : reservation.return_at,
        reservation.pickup_location || reservation.dropoff_location || 'الموقع المتفق عليه'
      ]
    });
    if (result.skipped) {
      await completeReminder(reminderId, 'failed', { error: result.reason });
      return result;
    }
    await completeReminder(reminderId, 'sent', { messageId: result.messageId });
    return result;
  } catch (error) {
    await completeReminder(reminderId, 'failed', { error: error.message });
    console.error('WhatsApp reminder failed:', error.message);
    return { sent: false, error: error.message };
  }
}

async function notifyPickupTomorrow(reservation, io) {
  const title = 'تذكير: استلام سيارتك غداً';
  const message = `تذكير: موعد استلام سيارة ${reservation.make} ${reservation.model} غداً في ${reservation.pickup_time}. المكان: ${reservation.pickup_location || 'سيتم الاتفاق مع المورد'}.`;
  const reminderId = await claimReminder(reservation.id, 'pickup_24h', 'in_app');
  if (reminderId) {
    await createInAppNotification({ userId: reservation.customer_id, title, message, referenceId: reservation.id, io });
    await completeReminder(reminderId, 'sent');
  }
  await sendWhatsAppReminder(reservation, 'pickup_24h');
}

async function notifyReturnTomorrow(reservation, io) {
  const title = 'تذكير: إرجاع السيارة غداً';
  const message = `تذكير: موعد إرجاع سيارة ${reservation.make} ${reservation.model} غداً في ${reservation.return_time}. يرجى إعادة السيارة بنفس حالة استلامها وفي الوقت المحدد.`;
  const reminderId = await claimReminder(reservation.id, 'return_24h', 'in_app');
  if (reminderId) {
    await createInAppNotification({ userId: reservation.customer_id, title, message, referenceId: reservation.id, io });
    await completeReminder(reminderId, 'sent');
  }
  await sendWhatsAppReminder(reservation, 'return_24h');
}

const initCronJobs = (io) => {
  console.log('⏳ Initializing reservation reminders every 15 minutes...');

  cron.schedule('*/15 * * * *', async () => {
    try {
      const pickupTomorrow = await query(`
        SELECT r.id, r.customer_id, r.supplier_id, r.pickup_at, r.pickup_time, r.pickup_location,
               u.name AS customer_name, u.phone AS customer_phone, c.make, c.model
        FROM reservations r
        JOIN users u ON u.id = r.customer_id
        JOIN cars c ON c.id = r.car_id
        WHERE r.pickup_at BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes'
          AND r.status IN ('approved', 'awaiting_pickup')
      `);
      for (const reservation of pickupTomorrow.rows) await notifyPickupTomorrow(reservation, io);

      const returnTomorrow = await query(`
        SELECT r.id, r.customer_id, r.return_at, r.return_time, r.dropoff_location,
               u.name AS customer_name, u.phone AS customer_phone, c.make, c.model
        FROM reservations r
        JOIN users u ON u.id = r.customer_id
        JOIN cars c ON c.id = r.car_id
        WHERE r.return_at BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes'
          AND r.status IN ('active', 'returned')
      `);
      for (const reservation of returnTomorrow.rows) await notifyReturnTomorrow(reservation, io);

      const overdue = await query(`
        SELECT r.id, r.customer_id, r.supplier_id, r.return_at, c.make, c.model
        FROM reservations r JOIN cars c ON c.id = r.car_id
        WHERE r.status = 'active' AND r.return_at < NOW()
      `);
      for (const reservation of overdue.rows) {
        const reminderId = await claimReminder(reservation.id, 'return_overdue', 'in_app');
        if (!reminderId) continue;
        await createInAppNotification({
          userId: reservation.customer_id,
          title: 'موعد الإرجاع مستحق',
          message: `موعد إرجاع سيارة ${reservation.make} ${reservation.model} مستحق الآن. يرجى التواصل مع المورد.`,
          referenceId: reservation.id,
          io
        });
        await createInAppNotification({
          userId: reservation.supplier_id,
          title: 'حجز متأخر عن الإرجاع',
          message: `الحجز لسيارة ${reservation.make} ${reservation.model} تجاوز موعد الإرجاع.`,
          referenceId: reservation.id,
          io
        });
        await completeReminder(reminderId, 'sent');
      }
    } catch (error) {
      console.error('Error running reservation reminder job:', error);
    }
  }, { timezone: process.env.APP_TIMEZONE || 'Asia/Aden' });
};

module.exports = { initCronJobs, createInAppNotification, sendWhatsAppReminder };
