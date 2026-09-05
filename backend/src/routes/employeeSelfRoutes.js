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
// =====================================================
// CREATE CAR - إضافة سيارة
// يحتاج صلاحية manage_cars
// =====================================================
router.post('/me/cars', requirePermission('manage_cars'), async (req, res, next) => {
  try {
    const {
      make,
      model,
      year,
      color,
      license_plate,
      seats,
      doors,
      transmission,
      fuel_type,
      price_per_day,
      description,
      mileage,
      status,
      category_id,
      location_id
    } = req.body;

    if (!make || !model || !year || price_per_day === undefined) {
      return res.status(400).json({
        success: false,
        message: 'الماركة والموديل والسنة والسعر اليومي مطلوبة'
      });
    }

    const result = await query(
      `INSERT INTO cars (
        supplier_id,
        category_id,
        location_id,
        make,
        model,
        year,
        color,
        license_plate,
        seats,
        doors,
        transmission,
        fuel_type,
        price_per_day,
        description,
        mileage,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
      RETURNING *`,
      [
        req.user.supplier_id,
        category_id || null,
        location_id || null,
        make,
        model,
        Number(year),
        color || null,
        license_plate || null,
        seats ? Number(seats) : 5,
        doors ? Number(doors) : 4,
        transmission || 'automatic',
        fuel_type || 'petrol',
        Number(price_per_day),
        description || null,
        mileage ? Number(mileage) : 0,
        status || 'available'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تمت إضافة السيارة بنجاح',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// UPDATE CAR - تعديل سيارة
// يحتاج صلاحية manage_cars
// =====================================================
router.put('/me/cars/:id', requirePermission('manage_cars'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      make,
      model,
      year,
      color,
      license_plate,
      seats,
      doors,
      transmission,
      fuel_type,
      price_per_day,
      description,
      mileage,
      status,
      category_id,
      location_id
    } = req.body;

    const result = await query(
      `UPDATE cars
       SET
         make = COALESCE($1, make),
         model = COALESCE($2, model),
         year = COALESCE($3, year),
         color = COALESCE($4, color),
         license_plate = COALESCE($5, license_plate),
         seats = COALESCE($6, seats),
         doors = COALESCE($7, doors),
         transmission = COALESCE($8, transmission),
         fuel_type = COALESCE($9, fuel_type),
         price_per_day = COALESCE($10, price_per_day),
         description = COALESCE($11, description),
         mileage = COALESCE($12, mileage),
         status = COALESCE($13, status),
         category_id = COALESCE($14, category_id),
         location_id = COALESCE($15, location_id),
         updated_at = NOW()
       WHERE id = $16
         AND supplier_id = $17
       RETURNING *`,
      [
        make ?? null,
        model ?? null,
        year !== undefined ? Number(year) : null,
        color ?? null,
        license_plate ?? null,
        seats !== undefined ? Number(seats) : null,
        doors !== undefined ? Number(doors) : null,
        transmission ?? null,
        fuel_type ?? null,
        price_per_day !== undefined ? Number(price_per_day) : null,
        description ?? null,
        mileage !== undefined ? Number(mileage) : null,
        status ?? null,
        category_id ?? null,
        location_id ?? null,
        id,
        req.user.supplier_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'السيارة غير موجودة أو لا تتبع لمؤسستك'
      });
    }

    res.json({
      success: true,
      message: 'تم تعديل السيارة بنجاح',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// DELETE CAR - حذف سيارة
// يحتاج صلاحية manage_cars
// =====================================================
router.delete('/me/cars/:id', requirePermission('manage_cars'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM cars
       WHERE id = $1
         AND supplier_id = $2
       RETURNING id`,
      [id, req.user.supplier_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'السيارة غير موجودة أو لا تتبع لمؤسستك'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف السيارة بنجاح'
    });
  } catch (error) {
    // بسبب ارتباط السيارة بحجوزات
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'لا يمكن حذف هذه السيارة لأنها مرتبطة بحجوزات سابقة'
      });
    }

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
router.get('/me/delivery', requirePermission('view_handover', 'manage_handover'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, c.make, c.model, u.name AS customer_name, u.phone AS customer_phone,
              h_before.id AS before_report_id, h_after.id AS after_report_id
         FROM reservations r
         JOIN cars c ON c.id = r.car_id
         LEFT JOIN users u ON u.id = r.customer_id
         LEFT JOIN handover_logs h_before ON h_before.reservation_id = r.id AND h_before.type = 'before'
         LEFT JOIN handover_logs h_after ON h_after.reservation_id = r.id AND h_after.type = 'after'
        WHERE r.supplier_id = $1 AND r.with_driver = TRUE
          AND r.status IN ('approved','awaiting_pickup','active','returned','disputed')
        ORDER BY r.pickup_at ASC NULLS LAST, r.created_at DESC LIMIT 100`,
      [req.user.supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});
// =====================================================
// UPDATE RESERVATION - تعديل حالة الحجز
// يحتاج صلاحية manage_reservations
// =====================================================
router.put(
  '/me/reservations/:id',
  requirePermission('manage_reservations'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const {
        status,
        pickup_location,
        dropoff_location,
        supplier_notes,
        cancellation_reason
      } = req.body;

      const allowedStatuses = [
        'pending',
        'approved',
        'rejected',
        'cancelled',
        'active',
        'completed',
        'disputed'
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الحجز غير صحيحة'
        });
      }

      const result = await query(
        `UPDATE reservations
         SET
           status = COALESCE($1, status),
           pickup_location = COALESCE($2, pickup_location),
           dropoff_location = COALESCE($3, dropoff_location),
           supplier_notes = COALESCE($4, supplier_notes),
           cancellation_reason = COALESCE($5, cancellation_reason),
           updated_at = NOW()
         WHERE id = $6
           AND supplier_id = $7
         RETURNING *`,
        [
          status ?? null,
          pickup_location ?? null,
          dropoff_location ?? null,
          supplier_notes ?? null,
          cancellation_reason ?? null,
          id,
          req.user.supplier_id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الحجز غير موجود أو لا يتبع لمؤسستك'
        });
      }

      res.json({
        success: true,
        message: 'تم تعديل الحجز بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);
router.get('/me/customers', requirePermission('view_customers'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.phone, u.avatar, u.created_at AS customer_since,
              COUNT(r.id)::int AS reservations_count,
              MAX(r.created_at) AS last_reservation_at,
              COALESCE(SUM(r.total_price) FILTER (WHERE r.status IN ('paid','active','completed')), 0)::numeric AS total_booking_value,
              COALESCE(json_agg(json_build_object(
                'id', r.id, 'status', r.status, 'start_date', r.start_date, 'end_date', r.end_date,
                'total_days', r.total_days, 'total_price', r.total_price, 'with_driver', r.with_driver,
                'pickup_location', r.pickup_location, 'dropoff_location', r.dropoff_location,
                'customer_notes', r.customer_notes, 'created_at', r.created_at,
                'car', json_build_object('make', c.make, 'model', c.model, 'year', c.year)
              ) ORDER BY r.created_at DESC) FILTER (WHERE r.id IS NOT NULL), '[]'::json) AS reservations,
              json_build_object(
                'preferred_service', CASE WHEN COUNT(r.id) FILTER (WHERE r.with_driver = TRUE) > COUNT(r.id) FILTER (WHERE r.with_driver = FALSE) THEN 'مع سائق' ELSE 'بدون سائق' END,
                'favorite_cars', COALESCE((SELECT json_agg(json_build_object('make', fc_car.make, 'model', fc_car.model, 'year', fc_car.year) ORDER BY fc.created_at DESC) FROM favorite_cars fc JOIN cars fc_car ON fc_car.id = fc.car_id WHERE fc.user_id = u.id AND fc_car.supplier_id = $1), '[]'::json),
                'last_pickup_location', (SELECT rr.pickup_location FROM reservations rr WHERE rr.customer_id = u.id AND rr.supplier_id = $1 AND rr.pickup_location IS NOT NULL ORDER BY rr.created_at DESC LIMIT 1),
                'last_dropoff_location', (SELECT rr.dropoff_location FROM reservations rr WHERE rr.customer_id = u.id AND rr.supplier_id = $1 AND rr.dropoff_location IS NOT NULL ORDER BY rr.created_at DESC LIMIT 1)
              ) AS preferences
         FROM users u
         LEFT JOIN reservations r ON r.customer_id = u.id AND r.supplier_id = $1
         LEFT JOIN cars c ON c.id = r.car_id
        WHERE u.role = 'customer' AND EXISTS (SELECT 1 FROM reservations er WHERE er.customer_id = u.id AND er.supplier_id = $1)
        GROUP BY u.id, u.name, u.phone, u.avatar, u.created_at
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
