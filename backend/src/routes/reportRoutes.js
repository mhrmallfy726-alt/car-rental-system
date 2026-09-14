const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('admin'));

function dateRange(value) {
  const end = new Date();
  const start = new Date();
  const days = Number(value) || 30;
  start.setDate(end.getDate() - Math.min(Math.max(days, 1), 3650));
  return { start: start.toISOString(), end: end.toISOString() };
}

router.get('/overview', asyncHandler(async (req, res) => {
  const { start, end } = dateRange(req.query.days);
  const params = [start, end];
  const [kpis, reservationStatuses, paymentStatuses, paymentMethods, monthly, topCars, topSuppliers, complaints, ratings] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2) AS new_users,
      (SELECT COUNT(*) FROM cars WHERE created_at >= $1 AND created_at < $2) AS new_cars,
      (SELECT COUNT(*) FROM reservations WHERE created_at >= $1 AND created_at < $2) AS reservations,
      (SELECT COALESCE(SUM(total_price),0) FROM reservations WHERE created_at >= $1 AND created_at < $2 AND status NOT IN ('rejected','cancelled')) AS booking_value,
      (SELECT COUNT(*) FROM payments WHERE created_at >= $1 AND created_at < $2 AND status='paid') AS paid_transactions,
      (SELECT COALESCE(SUM(amount),0) FROM payments WHERE created_at >= $1 AND created_at < $2 AND status='paid') AS paid_amount,
      (SELECT COALESCE(SUM(refund_amount),0) FROM payments WHERE created_at >= $1 AND created_at < $2 AND status IN ('refunded','partially_refunded')) AS refunded_amount,
      (SELECT COUNT(*) FROM complaints WHERE created_at >= $1 AND created_at < $2) AS complaints,
      (SELECT COUNT(*) FROM complaints WHERE created_at >= $1 AND created_at < $2 AND status IN ('open','in_progress')) AS open_complaints`, params),
    query(`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_price),0) AS value FROM reservations WHERE created_at >= $1 AND created_at < $2 GROUP BY status ORDER BY count DESC`, params),
    query(`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS amount FROM payments WHERE created_at >= $1 AND created_at < $2 GROUP BY status ORDER BY count DESC`, params),
    query(`SELECT payment_method, COUNT(*)::int AS count, COALESCE(SUM(amount),0) AS amount FROM payments WHERE created_at >= $1 AND created_at < $2 GROUP BY payment_method ORDER BY amount DESC`, params),
    query(`SELECT TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS reservations, COALESCE(SUM(total_price),0) AS booking_value FROM reservations WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1`, params),
    query(`SELECT c.id, c.make, c.model, c.year, u.name AS supplier_name, COUNT(r.id)::int AS reservations, COALESCE(SUM(r.total_price),0) AS booking_value FROM reservations r JOIN cars c ON c.id=r.car_id LEFT JOIN users u ON u.id=c.supplier_id WHERE r.created_at >= $1 AND r.created_at < $2 GROUP BY c.id,c.make,c.model,c.year,u.name ORDER BY reservations DESC, booking_value DESC LIMIT 10`, params),
    query(`SELECT u.id, u.name, u.email, COUNT(r.id)::int AS reservations, COALESCE(SUM(r.total_price),0) AS booking_value FROM reservations r JOIN users u ON u.id=r.supplier_id WHERE r.created_at >= $1 AND r.created_at < $2 GROUP BY u.id,u.name,u.email ORDER BY booking_value DESC LIMIT 10`, params),
    query(`SELECT status, priority, COUNT(*)::int AS count FROM complaints WHERE created_at >= $1 AND created_at < $2 GROUP BY status,priority ORDER BY count DESC`, params),
    query(`SELECT COUNT(*)::int AS reviews, ROUND(AVG(car_rating)::numeric,2) AS car_rating, ROUND(AVG(supplier_rating)::numeric,2) AS supplier_rating FROM reviews WHERE created_at >= $1 AND created_at < $2`, params),
  ]);

  res.json({ success: true, data: {
    range: { start, end, days: Number(req.query.days) || 30 },
    kpis: kpis.rows[0],
    reservationStatuses: reservationStatuses.rows,
    paymentStatuses: paymentStatuses.rows,
    paymentMethods: paymentMethods.rows,
    monthly: monthly.rows,
    topCars: topCars.rows,
    topSuppliers: topSuppliers.rows,
    complaints: complaints.rows,
    ratings: ratings.rows[0],
  }});
}));

module.exports = router;
