const cron = require('node-cron');
const { query } = require('../config/database');

// دالة مساعدة لإرسال الإشعارات
const sendNotification = async (userId, title, message, type, referenceId, referenceType, io) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, message, type, referenceId, referenceType]
    );

    // إرسال إشعار فوري عبر Socket.io
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', result.rows[0]);
    }
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
};

const initCronJobs = (io) => {
  console.log('⏳ Initializing Cron Jobs...');

  // تشغيل كل يوم الساعة 8 صباحاً بتوقيت السيرفر
  // '0 8 * * *'
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily notification checks...');

    try {
      // 1. التذكير بالسيارات التي سيبدأ حجزها اليوم
      const startingToday = await query(`
        SELECT r.id, r.customer_id, r.supplier_id, c.make, c.model 
        FROM reservations r 
        JOIN cars c ON r.car_id = c.id 
        WHERE r.start_date = CURRENT_DATE AND r.status IN ('approved', 'active')
      `);

      for (const res of startingToday.rows) {
        // للعميل
        await sendNotification(
          res.customer_id,
          'حجزك يبدأ اليوم!',
          `تذكير: حجزك لسيارة ${res.make} ${res.model} يبدأ اليوم. نتمنى لك رحلة سعيدة.`,
          'reservation',
          res.id,
          'reservation',
          io
        );
        // للمورد
        await sendNotification(
          res.supplier_id,
          'حجز يبدأ اليوم',
          `تذكير: سيتم استلام سيارتك ${res.make} ${res.model} من قبل العميل اليوم.`,
          'reservation',
          res.id,
          'reservation',
          io
        );
      }

      // 2. التذكير قبل انتهاء الحجز بيوم واحد
      const endingTomorrow = await query(`
        SELECT r.id, r.customer_id, c.make, c.model 
        FROM reservations r 
        JOIN cars c ON r.car_id = c.id 
        WHERE r.end_date = CURRENT_DATE + INTERVAL '1 day' AND r.status = 'active'
      `);

      for (const res of endingTomorrow.rows) {
        await sendNotification(
          res.customer_id,
          'حجزك ينتهي غداً',
          `تذكير: حجزك لسيارة ${res.make} ${res.model} ينتهي غداً. يرجى التجهيز لتسليم السيارة في الموعد المحدد.`,
          'reservation',
          res.id,
          'reservation',
          io
        );
      }

      // 3. التذكير بالسيارات التي انتهى حجزها اليوم (للتقييم والتسليم)
      const endedToday = await query(`
        SELECT r.id, r.customer_id, r.supplier_id, c.make, c.model 
        FROM reservations r 
        JOIN cars c ON r.car_id = c.id 
        WHERE r.end_date = CURRENT_DATE AND r.status IN ('active', 'completed')
      `);

      for (const res of endedToday.rows) {
        // للعميل
        await sendNotification(
          res.customer_id,
          'نرجو تقييم تجربتك',
          `انتهت فترة إيجار سيارة ${res.make} ${res.model}. ما رأيك في تجربتك؟ قم بتقييم المورد الآن.`,
          'review',
          res.id,
          'reservation',
          io
        );
        // للمورد
        await sendNotification(
          res.supplier_id,
          'انتهاء حجز سيارة',
          `انتهت فترة إيجار سيارتك ${res.make} ${res.model} اليوم. يرجى التأكد من استلام السيارة وتحديث حالتها.`,
          'reservation',
          res.id,
          'reservation',
          io
        );
      }

    } catch (error) {
      console.error('Error running cron jobs:', error);
    }
  });
};

module.exports = { initCronJobs, sendNotification };
