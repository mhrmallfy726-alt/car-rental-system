
// const  = {
//   getAllAdvertisements: async (filter = {}) => {
//     return await Advertisement.find(filter).populate("supplier_id").populate("car_id");
//   },

//   getAdvertisementById: async (id) => {
//     return await Advertisement.findById(id).populate("supplier_id").populate("car_id");
//   },

//   createAdvertisement: async (adData) => {
    const {
      supplier_id = null, car_id = null, title, description = null,
      ad_type = 'featured', placement = 'cars', image_url = null, link_url = null,
      start_date = null, end_date = null, start_time = null, end_time = null,
      duration_days = 7, status = 'draft', featured = false, is_pinned = false,
      payment_status = 'unpaid',
    } = adData;

    if (ad_type === 'discount') throw new Error('إعلانات الخصم غير متاحة في النظام');
    if (!title || !String(title).trim()) throw new Error('عنوان الإعلان مطلوب');

    const pricing = await financeService.getAdvertisementPricing();
    const basePricePerDay = Number(pricing?.advertisement_price_per_day || 0);
    const placementPrices = {
      home: Number(pricing?.advertisement_price_home_per_day ?? basePricePerDay * 2),
      cars: Number(pricing?.advertisement_price_cars_per_day ?? basePricePerDay),
      car_detail: Number(pricing?.advertisement_price_car_detail_per_day ?? basePricePerDay * 1.5),
      all_public: Number(pricing?.advertisement_price_all_public_per_day ?? basePricePerDay * 2.5),
    };
    const normalizedPlacement = placement || 'cars';
    const pricePerDay = Number(placementPrices[normalizedPlacement] || basePricePerDay);
    const duration = Number(duration_days || 7);
    if (!Number.isInteger(duration) || duration < 1 || duration > 365) throw new Error('مدة الإعلان يجب أن تكون بين يوم و365 يومًا');
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) throw new Error('سعر الإعلان اليومي غير صالح');

    const totalPrice = pricePerDay * duration;
    const result = await query(
      `INSERT INTO advertisements
        (supplier_id, car_id, title, description, ad_type, placement, image_url, link_url,
         price, price_per_day, total_price, duration_days, start_date, end_date,
         start_time, end_time, status, featured, is_pinned, payment_status)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        supplier_id, car_id, title, description, ad_type, normalizedPlacement, image_url, link_url,
        basePricePerDay, pricePerDay, totalPrice, duration,
        start_date || null, end_date || null, start_time || null, end_time || null,
        status, Boolean(featured), Boolean(is_pinned), payment_status || 'unpaid',
      ]
    );
    return result.rows[0];
  },

  updateAdvertisement: async (id, updateData) => {
    const allowed = [
      'title', 'description', 'ad_type', 'placement', 'image_url', 'link_url',
      'price', 'price_per_day', 'total_price', 'duration_days',
      'start_date', 'end_date', 'start_time', 'end_time',
      'status', 'featured', 'is_pinned', 'payment_status',
    ];

    const fields = [];
    const params = [];
    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        params.push(updateData[field]);
        fields.push(`${field} = $${params.length}`);
      }
    });

    // السعر الفعلي والإجمالي لا يأتيان من الواجهة؛ يعاد حسابهما من مكان الظهور والمدة.
    if (Object.prototype.hasOwnProperty.call(updateData, 'placement') || Object.prototype.hasOwnProperty.call(updateData, 'duration_days')) {
      const current = await query('SELECT placement, duration_days FROM advertisements WHERE id = $1', [id]);
      if (!current.rows.length) return null;
      const placement = updateData.placement || current.rows[0].placement || 'cars';
      const duration = Number(updateData.duration_days || current.rows[0].duration_days || 1);
      if (!Number.isInteger(duration) || duration < 1 || duration > 365) throw new Error('مدة الإعلان يجب أن تكون بين يوم و365 يومًا');

      const pricing = await financeService.getAdvertisementPricing();
      const base = Number(pricing?.advertisement_price_per_day || 0);
      const placementPrices = {
        home: Number(pricing?.advertisement_price_home_per_day ?? base * 2),
        cars: Number(pricing?.advertisement_price_cars_per_day ?? base),
        car_detail: Number(pricing?.advertisement_price_car_detail_per_day ?? base * 1.5),
        all_public: Number(pricing?.advertisement_price_all_public_per_day ?? base * 2.5),
      };
      const pricePerDay = Number(placementPrices[placement] || base);
      params.push(base, pricePerDay, pricePerDay * duration, duration);
      fields.push(`price = $${params.length - 3}`, `price_per_day = $${params.length - 2}`, `total_price = $${params.length - 1}`, `duration_days = $${params.length}`);
    }

    if (!fields.length) return advertisementService.getAdvertisementById(id);

    params.push(id);
    const result = await query(
      `UPDATE advertisements SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  deleteAdvertisement: async (id) => {
//     return await Advertisement.findByIdAndDelete(id);
//   },

//   getSuppliers: async (query) => {
//     // This would typically query a Supplier model/service
//     // For now, returning dummy data or integrating with an existing Supplier service
//     console.log(`Searching suppliers with query: ${query}`);
//     return [
//       { _id: "60d0fe4f3a6a3d0015a1a1a1", name: "ظ…ط­ظ…ط¯ ط§ظ„ط¹ظ„ظپظٹ", email: "mohamed@gmail.com", cars_count: 7 },
//       { _id: "60d0fe4f3a6a3d0015a1a1a2", name: "ط£ط­ظ…ط¯ ط³ط¹ظٹط¯", email: "ahmed@example.com", cars_count: 3 },
//     ];
//   },

//   getSupplierCars: async (supplierId) => {
//     // This would typically query a Car model/service based on supplierId
//     // For now, returning dummy data
//     console.log(`Fetching cars for supplier: ${supplierId}`);
//     return [
//       { _id: "60d0fe4f3a6a3d0015a1a1a3", make: "Toyota", model: "Camry", year: 2024, price: 120, status: "available" },
//       { _id: "60d0fe4f3a6a3d0015a1a1a4", make: "Hyundai", model: "Elantra", year: 2023, price: 90, status: "available" },
//       { _id: "60d0fe4f3a6a3d0015a1a1a5", make: "Honda", model: "Civic", year: 2022, price: 100, status: "rented" },
//     ];
//   },
// };

// module.exports = ;


const { query, getClient } = require('../config/database');
const financeService = require('./financeService');

const AD_SELECT = `
  SELECT
    a.*,
    supplier.name AS supplier_name,
    supplier.email AS supplier_email,
    c.make AS car_make,
    c.model AS car_model,
    c.year AS car_year,
    (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.is_primary DESC, ci.created_at ASC LIMIT 1) AS car_primary_image,
    c.price_per_day AS car_price_per_day
  FROM advertisements a
  LEFT JOIN users supplier ON supplier.id = a.supplier_id
  LEFT JOIN cars c ON c.id = a.car_id
`;

const REQUEST_SELECT = `
  SELECT
    r.*,
    supplier.name AS supplier_name,
    supplier.email AS supplier_email,
    c.make AS car_make,
    c.model AS car_model,
    c.year AS car_year,
    (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.is_primary DESC, ci.created_at ASC LIMIT 1) AS car_primary_image,
    c.price_per_day AS car_price_per_day,
    a.id AS advertisement_id,
    a.status AS advertisement_status,
    a.payment_status AS advertisement_payment_status
  FROM advertisement_requests r
  LEFT JOIN users supplier ON supplier.id = r.supplier_id
  LEFT JOIN cars c ON c.id = r.car_id
  LEFT JOIN advertisements a ON a.request_id = r.id
`;

const addDateFilter = (params, dateColumn, operator, value) => {
  if (!value) return '';
  params.push(value);
  return ` AND ${dateColumn} ${operator} $${params.length}`;
};

const advertisementService  = {
  getAllAdvertisements: async (filter = {}) => {
    const params = [];
    const where = [];
    if (filter.status && filter.status !== 'all') {
      params.push(filter.status);
      where.push(`a.status = $${params.length}`);
    }
    if (filter.placement && filter.placement !== 'all') {
      params.push(filter.placement);
      where.push(`a.placement = $${params.length}`);
    }
    if (filter.supplier_id) {
      params.push(filter.supplier_id);
      where.push(`a.supplier_id = $${params.length}`);
    }
    const result = await query(
      `${AD_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.is_pinned DESC, a.created_at DESC`,
      params,
    );
    return result.rows;
  },

  getAdvertisementById: async (id) => {
    const result = await query(`${AD_SELECT} WHERE a.id = $1`, [id]);
    return result.rows[0] || null;
  },

  getActiveAdvertisements: async ({ placement, carId } = {}) => {
    const params = ['active'];
  
    const where = [
      `a.status = $1`,
      `(a.start_date IS NULL OR a.start_date <= CURRENT_DATE)`,
      `(a.end_date IS NULL OR a.end_date >= CURRENT_DATE)`,
      `(a.start_time IS NULL OR a.end_time IS NULL OR (CURRENT_TIME >= a.start_time AND CURRENT_TIME < a.end_time))`,
    ];
  
    if (placement) {
      params.push(placement);
      where.push(
        `(a.placement = $${params.length}
          OR a.placement = 'all_public')`
      );
    }
  
    if (carId) {
      const normalizedCarId = String(carId).trim();
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      // car_id is UUID in the database; never coerce it with Number().
      if (!uuidPattern.test(normalizedCarId)) {
        return [];
      }

      params.push(normalizedCarId);
      where.push(
        `(a.car_id IS NULL OR a.car_id = $${params.length})`
      );
    }
  
    const result = await query(
      `${AD_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY
         a.is_pinned DESC,
         a.featured DESC,
         a.created_at DESC`,
      params
    );
  
    return result.rows;
  },
  
  

  createAdvertisement: async (adData) => {
    const {
      supplier_id = null,
      car_id = null,
      title,
      description = null,
      ad_type = 'featured',
      placement = 'cars',
      image_url = null,
      link_url = null,
      price = 0,
      duration = 7,
      start_date = null,
      end_date = null,
      status = 'draft',
      featured = false,
      is_pinned = false,
      discount = 0,
      payment_status = 'pending',
    } = adData;
    if (ad_type === 'discount') throw new Error('إعلانات الخصم غير متاحة في النظام');
    console.log({
      supplier_id,
      car_id,
      title,
      description,
      ad_type,
      placement,
      image_url,
    });
    
    const result = await query(
      `INSERT INTO advertisements
        (
          supplier_id,
          car_id,
          title,
          description,
          ad_type,
          placement,
          image_url,
          link_url,
          price,
          duration,
          start_date,
          end_date,
          status,
          featured,
          is_pinned,
          discount,
          payment_status
        )
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        supplier_id,
        car_id,
        title,
        description,
        ad_type,
        placement,
        image_url,
        link_url,
        Number(price || 0),
        Number(duration || 7),
        start_date || null,
        end_date || null,
        status,
        featured,
        is_pinned,
        Number(discount || 0),
        payment_status,
      ]
    );
  
    return result.rows[0];
  },
  

  updateAdvertisement: async (id, updateData) => {
    const allowed = [
      'title',
      'description',
      'ad_type',
      'placement',
      'image_url',
      'link_url',
      'price',
      'price_per_day',
      'total_price',
      'duration_days',
      'start_date',
      'end_date',
      'status',
      'featured',
      'is_pinned',
      'payment_status',
    ];
  
    const fields = [];
    const params = [];
  
    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        params.push(updateData[field]);
        fields.push(`${field} = $${params.length}`);
      }
    });
  
    if (!fields.length) {
      return advertisementService.getAdvertisementById(id);
    }
  
    params.push(id);
  
    const result = await query(
      `UPDATE advertisements
       SET ${fields.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );
  
    return result.rows[0] || null;
  },
  

  deleteAdvertisement: async (id) => {
    const result = await query('DELETE FROM advertisements WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  getAdvertisementPricing: async () => financeService.getAdvertisementPricing(),

  getAdvertisementStats: async () => {
    const [ads, requests] = await Promise.all([
      query(`SELECT
        COUNT(*)::int AS total_ads,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_ads,
        COUNT(*) FILTER (WHERE status IN ('draft', 'pending'))::int AS pending_ads,
        COUNT(*) FILTER (WHERE status IN ('paused', 'expired', 'rejected'))::int AS inactive_ads,
        COALESCE(SUM(impressions), 0)::int AS impressions,
        COALESCE(SUM(clicks), 0)::int AS clicks,
        COALESCE(SUM(total_price), 0)::numeric AS total_ad_value
        FROM advertisements`),
      query(`SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected_requests
        FROM advertisement_requests`),
    ]);
    return { ...ads.rows[0], ...requests.rows[0] };
  },

  recordImpression: async (id) => {
    await query('UPDATE advertisements SET impressions = impressions + 1 WHERE id = $1 AND status = $2', [id, 'active']);
  },

  recordClick: async (id) => {
    await query('UPDATE advertisements SET clicks = clicks + 1 WHERE id = $1 AND status = $2', [id, 'active']);
  },

  getSuppliers: async (search = '') => {
    const result = await query(
      `SELECT u.id, u.name, u.email, COUNT(c.id)::int AS cars_count
       FROM users u
       LEFT JOIN cars c ON c.supplier_id = u.id
       WHERE u.role = 'supplier' AND (u.name ILIKE $1 OR u.email ILIKE $1)
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name ASC LIMIT 25`,
      [`%${search}%`],
    );
    return result.rows;
  },

  getSupplierCars: async (supplierId) => {
    const result = await query(
      `SELECT c.id, c.make, c.model, c.year, c.price_per_day, c.status,
              (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id ORDER BY ci.is_primary DESC, ci.created_at ASC LIMIT 1) AS primary_image
       FROM cars c
       WHERE c.supplier_id = $1 AND c.status <> 'inactive'
       ORDER BY c.created_at DESC`,
      [supplierId],
    );
    return result.rows;
  },

  createAdvertisementRequest: async (supplierId, data) => {
    const branchId = data.branch_id || null;
    const car = await query(
      `SELECT id FROM cars WHERE id = $1 AND supplier_id = $2${branchId ? ' AND location_id = $3' : ''}`,
      branchId ? [data.car_id, supplierId, branchId] : [data.car_id, supplierId]
    );
    if (!car.rows.length) throw new Error('السيارة غير موجودة ضمن سيارات المورد');
    if (data.ad_type === 'discount') throw new Error('إعلانات الخصم غير متاحة في النظام');
    const placement = data.placement || 'cars';
    const image_url = data.image_url || null;
    const pricing = await financeService.getAdvertisementPricing();
    const basePricePerDay = Number(pricing.advertisement_price_per_day || 0);
    const placementPrices = {
      home: Number(pricing.advertisement_price_home_per_day ?? basePricePerDay * 2),
      cars: Number(pricing.advertisement_price_cars_per_day ?? basePricePerDay),
      car_detail: Number(pricing.advertisement_price_car_detail_per_day ?? basePricePerDay * 1.5),
      all_public: Number(pricing.advertisement_price_all_public_per_day ?? basePricePerDay * 2.5),
    };
    const durationDays = Number(data.duration_days || 7);
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) throw new Error('مدة الإعلان يجب أن تكون بين يوم و365 يومًا');
    const pricePerDay = Number(placementPrices[placement] || basePricePerDay);
    const totalPrice = pricePerDay * durationDays;
    const startTime = data.start_time || pricing.advertisement_start_time;
    const endTime = data.end_time || pricing.advertisement_end_time;

    const result = await query(
      `INSERT INTO advertisement_requests
        (
          supplier_id,
          car_id,
          title,
          description,
          ad_type,
          placement,
          image_url,
          price_per_day,
          total_price,
          duration_days,
          start_date,
          end_date,
          start_time,
          end_time,
          payment_status
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'unpaid')
       RETURNING *`,
      [
        supplierId,
        data.car_id,
        data.title,
        data.description || null,
        data.ad_type || 'featured',
        placement,
        image_url,
        pricePerDay,
        totalPrice,
        durationDays,
        data.start_date || null,
        data.end_date || null,
        startTime,
        endTime,
      ]
    );
    
    const request = result.rows[0];

    // Notify every active admin after the request has been stored successfully.
    // The request itself must not depend on a particular admin account existing.
    await query(
      `INSERT INTO notifications
        (user_id, title, message, type, reference_id, reference_type)
       SELECT id, $1, $2, 'system', $3, 'advertisement_request'
       FROM users
       WHERE role = 'admin' AND is_active = TRUE`,
      [
        'طلب إعلان جديد',
        `ورد طلب إعلان جديد من المورد «${supplierId}» بعنوان «${data.title}». يرجى مراجعته من مركز الإعلانات.`,
        request.id,
      ]
    );

    return request;
  },

  getMyAdvertisementRequests: async (supplierId, branchId = null) => {
    const result = await query(
      `${REQUEST_SELECT} WHERE r.supplier_id = $1${branchId ? ' AND c.location_id = $2' : ''} ORDER BY r.created_at DESC`,
      branchId ? [supplierId, branchId] : [supplierId]
    );
    return result.rows;
  },

  getAdvertisementRequests: async (status = 'all') => {
    const params = [];
    const where = [];
    if (status && status !== 'all') {
      params.push(status);
      where.push(`r.status = $${params.length}`);
    }
    const result = await query(`${REQUEST_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY r.created_at DESC`, params);
    return result.rows;
  },

  approveAdvertisementRequest: async (requestId, reviewerId, note = '', reviewerEmployeeId = null) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const requestResult = await client.query(`SELECT * FROM advertisement_requests WHERE id = $1 FOR UPDATE`, [requestId]);
      if (!requestResult.rows.length) throw new Error('طلب الإعلان غير موجود');
      const request = requestResult.rows[0];
      if (request.status !== 'pending') throw new Error('لا يمكن اعتماد هذا الطلب في حالته الحالية');

      const duration = Number(request.duration_days || 7);
      const pricePerDay = Number(request.price_per_day || 0);
      const totalPrice = Number(request.total_price || pricePerDay * duration);
      if (!Number.isFinite(totalPrice) || totalPrice <= 0) throw new Error('لا يمكن اعتماد إعلان بدون قيمة مالية');

      const pricing = await financeService.getAdvertisementPricing();
      const basePricePerDay = Number(pricing?.advertisement_price_per_day || pricePerDay);

      const adResult = await client.query(`
        INSERT INTO advertisements
          (request_id, supplier_id, car_id, title, description, ad_type, placement, image_url,
           price, price_per_day, total_price, duration_days, start_date, end_date,
           start_time, end_time, status, featured, is_pinned, payment_status)
        VALUES (
          $1::uuid,$2::uuid,$3::uuid,$4::varchar,$5::text,$6::varchar,$7::varchar,$8::text,
          $9::numeric,$10::numeric,$11::numeric,$12::integer,
          $13::date,$14::date,$15::time,$16::time,
          'pending',$17::boolean,false,'unpaid'
        )
        RETURNING *`,
        [
          request.id, request.supplier_id, request.car_id, request.title, request.description,
          request.ad_type, request.placement || 'cars', request.image_url || null,
          basePricePerDay, pricePerDay, totalPrice, duration,
          request.start_date || null, request.end_date || null,
          request.start_time, request.end_time, request.ad_type === 'featured',
        ]
      );

      await client.query(
        `UPDATE advertisement_requests
         SET status='approved', reviewer_id=$1, reviewer_employee_id=$2,
             reviewer_note=$3, reviewed_at=NOW()
         WHERE id=$4`,
        [reviewerId, reviewerEmployeeId, note || null, requestId]
      );
      await client.query(
        `INSERT INTO notifications (user_id,title,message,type,reference_id,reference_type)
         VALUES ($1,$2,$3,'system',$4,'advertisement')`,
        [request.supplier_id, 'تم اعتماد طلب الإعلان', `تم اعتماد طلب «${request.title}». أكمل الدفع ليبدأ النشر.`, adResult.rows[0].id]
      );
      await client.query('COMMIT');
      return adResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  rejectAdvertisementRequest: async (requestId, reviewerId, note = '', reviewerEmployeeId = null) => {
    const result = await query(
      `UPDATE advertisement_requests
       SET status = 'rejected', reviewer_id = $1, reviewer_employee_id = $2, reviewer_note = $3, reviewed_at = NOW()
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [reviewerId, reviewerEmployeeId, note || null, requestId],
    );

    if (!result.rows.length) {
      throw new Error('طلب الإعلان غير موجود أو تمت مراجعته سابقاً');
    }

    await query(
      `INSERT INTO notifications
        (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        result.rows[0].supplier_id,
        'تم رفض طلب الإعلان',
        `تم رفض طلب الإعلان «${result.rows[0].title}». ${note ? `السبب: ${note}` : ''}`.trim(),
        'system',
        result.rows[0].id,
        'advertisement_request',
      ]
    );

    return result.rows[0];
  },
};

module.exports = advertisementService;
