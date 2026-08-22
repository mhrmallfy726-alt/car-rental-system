const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(protect);

const requireEmployee = (req, res, next) => {
  if (req.user?.account_type !== 'employee' || !req.employeeId || !req.user.supplier_id) {
    return res.status(403).json({ success: false, message: 'هذا المسار مخصص للموظفين فقط' });
  }
  next();
};

const hasPermission = async (employeeId, names) => {
  const result = await query(
    `SELECT 1
       FROM employees_permissions ep
       JOIN permissions p ON p.id = ep.permission_id
      WHERE ep.employee_id = $1 AND p.name = ANY($2::text[])
      LIMIT 1`,
    [employeeId, names]
  );
  return result.rows.length > 0;
};

const requirePermission = (...names) => async (req, res, next) => {
  try {
    if (!(await hasPermission(req.employeeId, names))) {
      return res.status(403).json({ success: false, message: 'لا تملك صلاحية تنفيذ هذا الإجراء' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.use(requireEmployee);

router.get('/me', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT e.id, e.supplier_id, e.full_name, e.phone_number, e.email,
              e.role, e.status, e.is_online, e.is_accepting_orders,
              e.must_change_password, e.last_active_at, e.created_at,
              u.name AS supplier_name, u.brand_logo AS supplier_logo
         FROM employees e
         LEFT JOIN users u ON u.id = e.supplier_id
        WHERE e.id = $1`,
      [req.employeeId]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (error) {
    next(error);
  }
});

router.get('/me/permissions', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description
         FROM employees_permissions ep
         JOIN permissions p ON p.id = ep.permission_id
        WHERE ep.employee_id = $1
        ORDER BY p.id`,
      [req.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/overview', async (req, res, next) => {
  try {
    const supplierId = req.user.supplier_id;
    const [supplier, carStats, reservationStats, recent] = await Promise.all([
      query(`SELECT id, name, brand_logo, phone, email FROM users WHERE id = $1`, [supplierId]),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'available')::int AS available,
                COUNT(*) FILTER (WHERE status <> 'available')::int AS unavailable
           FROM cars WHERE supplier_id = $1`,
        [supplierId]
      ),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status IN ('pending','confirmed','active'))::int AS open,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COALESCE(SUM(total_price) FILTER (WHERE status IN ('completed','active')), 0)::numeric AS revenue
           FROM reservations WHERE supplier_id = $1`,
        [supplierId]
      ),
      query(
        `SELECT r.id, r.status, r.start_date, r.end_date, r.total_price,
                c.make, c.model, u.name AS customer_name
           FROM reservations r
           JOIN cars c ON c.id = r.car_id
           LEFT JOIN users u ON u.id = r.customer_id
          WHERE r.supplier_id = $1
          ORDER BY r.created_at DESC
          LIMIT 8`,
        [supplierId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        supplier: supplier.rows[0] || null,
        cars: carStats.rows[0] || { total: 0, available: 0, unavailable: 0 },
        reservations: reservationStats.rows[0] || { total: 0, open: 0, completed: 0, revenue: 0 },
        recentReservations: recent.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/cars', requirePermission('view_cars', 'manage_cars'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.id, c.make, c.model, c.year, c.status, c.price_per_day,
              c.discount_percentage, c.is_approved,
              (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) AS primary_image
         FROM cars c
        WHERE c.supplier_id = $1
        ORDER BY c.created_at DESC`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/reservations', requirePermission('view_reservations', 'manage_reservations'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, c.make, c.model, u.name AS customer_name, u.phone AS customer_phone
         FROM reservations r
         JOIN cars c ON c.id = r.car_id
         LEFT JOIN users u ON u.id = r.customer_id
        WHERE r.supplier_id = $1
        ORDER BY r.created_at DESC
        LIMIT 100`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.put('/status', async (req, res, next) => {
  try {
    const isAccepting = Boolean(req.body?.is_accepting_orders);
    const result = await query(
      `UPDATE employees
          SET is_accepting_orders = $1, is_online = TRUE, last_active_at = NOW(), updated_at = NOW()
        WHERE id = $2
        RETURNING id, is_online, is_accepting_orders, last_active_at`,
      [isAccepting, req.employeeId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
