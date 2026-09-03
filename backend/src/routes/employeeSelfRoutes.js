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
    `SELECT 1 FROM employees_permissions ep
      JOIN permissions p ON p.id = ep.permission_id
     WHERE ep.employee_id = $1 AND p.name = ANY($2::text[])
     LIMIT 1`,
    [employeeId, names]
  );
  return result.rows.length > 0;
};

const getPermissionSet = async (employeeId) => {
  const result = await query(
    `SELECT p.name FROM employees_permissions ep
      JOIN permissions p ON p.id = ep.permission_id
     WHERE ep.employee_id = $1 ORDER BY p.id`,
    [employeeId]
  );
  return new Set(result.rows.map((row) => row.name));
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
              e.role, e.job_role, e.status, e.is_online, e.is_accepting_orders,
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
        WHERE ep.employee_id = $1 ORDER BY p.id`,
      [req.employeeId]
    );
    res.json({ success: true, data: result.rows || [] });
  } catch (error) {
    next(error);
  }
});

// Permission-aware overview: a department only receives the metrics it is allowed to see.
router.get('/me/overview', async (req, res, next) => {
  try {
    const supplierId = req.user.supplier_id;
    const permissions = await getPermissionSet(req.employeeId);
    const data = { cars: {}, reservations: {}, advertisements: {}, finance: {}, team: {}, recentReservations: [] };

    if (permissions.has('view_cars') || permissions.has('manage_cars')) {
      const carStats = await query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'available')::int AS available,
                COUNT(*) FILTER (WHERE status <> 'available')::int AS unavailable
           FROM cars WHERE supplier_id = $1`, [supplierId]
      );
      data.cars = carStats.rows[0] || {};
    }

    if (permissions.has('view_fleet_performance')) {
      const fleet = await query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_approved = TRUE)::int AS approved,
                COUNT(*) FILTER (WHERE status = 'available')::int AS available
           FROM cars WHERE supplier_id = $1`, [supplierId]
      );
      data.cars = { ...data.cars, performance: fleet.rows[0] || {} };
    }

    if (permissions.has('view_reservations') || permissions.has('manage_reservations')) {
      const reservationStats = await query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status IN ('pending','confirmed','active'))::int AS open,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
           FROM reservations WHERE supplier_id = $1`, [supplierId]
      );
      data.reservations = reservationStats.rows[0] || {};

      if (permissions.has('view_customers')) {
        const recent = await query(
          `SELECT r.id, r.status, r.start_date, r.end_date, r.total_price,
                  c.make, c.model, u.name AS customer_name
             FROM reservations r
             JOIN cars c ON c.id = r.car_id
             LEFT JOIN users u ON u.id = r.customer_id
            WHERE r.supplier_id = $1
            ORDER BY r.created_at DESC LIMIT 8`, [supplierId]
        );
        data.recentReservations = recent.rows;
      }
    }

    if (permissions.has('view_finance')) {
      const finance = await query(
        `SELECT COUNT(*)::int AS reservations_count,
                COALESCE(SUM(total_price) FILTER (WHERE status IN ('completed','active')),0)::numeric AS reservation_revenue
           FROM reservations WHERE supplier_id = $1`, [supplierId]
      );
      data.finance = finance.rows[0] || {};
    }

    if (permissions.has('view_advertisements') || permissions.has('manage_advertisements') || permissions.has('view_ad_performance')) {
      const ads = await query(
        `SELECT COUNT(*)::int AS requests_total,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS requests_pending,
                COUNT(*) FILTER (WHERE status = 'approved')::int AS requests_approved
           FROM advertisement_requests WHERE supplier_id = $1`, [supplierId]
      );
      data.advertisements = ads.rows[0] || {};
    }

    if (permissions.has('view_ad_performance')) {
      const adPerformance = await query(
        `SELECT COUNT(*)::int AS active_ads,
                COALESCE(SUM(impressions),0)::int AS impressions,
                COALESCE(SUM(clicks),0)::int AS clicks
           FROM advertisements WHERE supplier_id = $1 AND status = 'active'`, [supplierId]
      );
      data.advertisements = { ...data.advertisements, performance: adPerformance.rows[0] || {} };
    }

    if (permissions.has('manage_team') || permissions.has('view_team_performance')) {
      const team = await query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'active')::int AS active,
                COUNT(*) FILTER (WHERE is_online = TRUE)::int AS online
           FROM employees WHERE supplier_id = $1`, [supplierId]
      );
      data.team = team.rows[0] || {};
    }

    res.json({ success: true, data });
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
         FROM cars c WHERE c.supplier_id = $1 ORDER BY c.created_at DESC`,
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
         FROM reservations r JOIN cars c ON c.id = r.car_id
         LEFT JOIN users u ON u.id = r.customer_id
        WHERE r.supplier_id = $1 ORDER BY r.created_at DESC LIMIT 100`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/customers', requirePermission('view_customers'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone,
              COUNT(r.id)::int AS reservations_count,
              MAX(r.created_at) AS last_reservation_at
         FROM reservations r JOIN users u ON u.id = r.customer_id
        WHERE r.supplier_id = $1
        GROUP BY u.id, u.name, u.email, u.phone
        ORDER BY last_reservation_at DESC`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/advertisements', requirePermission('view_advertisements', 'manage_advertisements', 'view_ad_performance'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, ad_type, placement, requested_budget, duration_days,
              start_date, end_date, status, reviewer_note, created_at
         FROM advertisement_requests WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/advertisements/performance', requirePermission('view_ad_performance'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, placement, status, impressions, clicks,
              CASE WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions::numeric) * 100, 2) ELSE 0 END AS ctr,
              start_date, end_date
         FROM advertisements WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/me/finance', requirePermission('view_finance'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*)::int AS reservations_count,
              COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'),0)::numeric AS completed_revenue,
              COALESCE(SUM(total_price) FILTER (WHERE status = 'active'),0)::numeric AS active_value
         FROM reservations WHERE supplier_id = $1`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows[0] || {} });
  } catch (error) {
    next(error);
  }
});

router.get('/me/team', requirePermission('manage_team', 'view_team_performance'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, role, job_role, status, is_online,
              is_accepting_orders, last_active_at, created_at
         FROM employees WHERE supplier_id = $1 ORDER BY created_at DESC`,
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
      `UPDATE employees SET is_accepting_orders = $1, is_online = TRUE,
              last_active_at = NOW(), updated_at = NOW()
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
