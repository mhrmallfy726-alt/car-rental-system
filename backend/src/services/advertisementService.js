
// const  = {
//   getAllAdvertisements: async (filter = {}) => {
//     return await Advertisement.find(filter).populate("supplier_id").populate("car_id");
//   },

//   getAdvertisementById: async (id) => {
//     return await Advertisement.findById(id).populate("supplier_id").populate("car_id");
//   },

//   createAdvertisement: async (adData) => {
//     const newAd = new Advertisement(adData);
//     return await newAd.save();
//   },

//   updateAdvertisement: async (id, updateData) => {
//     return await Advertisement.findByIdAndUpdate(id, updateData, { new: true });
//   },

//   deleteAdvertisement: async (id) => {
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
    c.price_per_day AS car_price_per_day
  FROM advertisement_requests r
  JOIN users supplier ON supplier.id = r.supplier_id
  JOIN cars c ON c.id = r.car_id
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
      'duration',
      'start_date',
      'end_date',
      'status',
      'featured',
      'is_pinned',
      'payment_status',
      'discount',
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

  getAdvertisementStats: async () => {
    const [ads, requests] = await Promise.all([
      query(`SELECT
        COUNT(*)::int AS total_ads,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_ads,
        COUNT(*) FILTER (WHERE status IN ('draft', 'pending'))::int AS pending_ads,
        COUNT(*) FILTER (WHERE status IN ('paused', 'expired', 'rejected'))::int AS inactive_ads,
        COALESCE(SUM(impressions), 0)::int AS impressions,
        COALESCE(SUM(clicks), 0)::int AS clicks,
        COALESCE(SUM(price), 0)::numeric AS total_budget
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
    const car = await query('SELECT id FROM cars WHERE id = $1 AND supplier_id = $2', [data.car_id, supplierId]);
    if (!car.rows.length) throw new Error('السيارة غير موجودة ضمن سيارات المورد');
    if (data.ad_type === 'discount') throw new Error('إعلانات الخصم غير متاحة في النظام');
    const placement = data.placement || 'cars';
    const image_url = data.image_url || null;
    const pricePerDay = Number(data.price_per_day ?? data.requested_budget ?? 0);
    const durationDays = Number(data.duration_days || 7);
    const totalPrice = pricePerDay * durationDays;

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
          requested_budget,
          price_per_day,
          total_price,
          duration_days,
          start_date,
          end_date
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        pricePerDay,
        totalPrice,
        durationDays,
        data.start_date || null,
        data.end_date || null,
      ]
    );
    
    return result.rows[0];
  },

  getMyAdvertisementRequests: async (supplierId) => {
    const result = await query(`${REQUEST_SELECT} WHERE r.supplier_id = $1 ORDER BY r.created_at DESC`, [supplierId]);
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

  approveAdvertisementRequest: async (requestId, reviewerId, note = '') => {
    const client = await getClient();
  
    try {
      await client.query('BEGIN');
  
      const requestResult = await client.query(
        `SELECT *
         FROM advertisement_requests
         WHERE id = $1
         FOR UPDATE`,
        [requestId]
      );
  
      if (!requestResult.rows.length) {
        throw new Error('طلب الإعلان غير موجود');
      }
  
      const request = requestResult.rows[0];
  
      if (request.status !== 'pending') {
        throw new Error(
          'لا يمكن اعتماد هذا الطلب في حالته الحالية'
        );
      }
  
      const duration = Number(request.duration_days || 7);
      const pricePerDay = Number(
        request.price_per_day ?? request.requested_budget ?? 0
      );
      const totalPrice = Number(
        request.total_price || pricePerDay * duration
      );
  
      const adResult = await client.query(
        `INSERT INTO advertisements
          (
            supplier_id,
            car_id,
            title,
            description,
            ad_type,
            placement,
            image_url,
            price,
            duration,
            price_per_day,
            total_price,
            start_date,
            end_date,
            status,
            featured,
            is_pinned,
            payment_status
          )
         VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8::numeric,
            $9::int,
            $10::numeric,
            $11::numeric,
            COALESCE($12::date, CURRENT_DATE),
            COALESCE(
              $13::date,
              (
                COALESCE($12::date, CURRENT_DATE)
                + (($9::int - 1) * INTERVAL '1 day')
              )::date
            ),
            'pending',
            $14::boolean,
            false,
            'pending'
          )
         RETURNING *`,
        [
          request.supplier_id,
          request.car_id,
          request.title,
          request.description,
          request.ad_type,
          request.placement || 'cars',
          request.image_url || null,
          totalPrice,
          duration,
          pricePerDay,
          totalPrice,
          request.start_date || null,
          request.end_date || null,
          request.ad_type === 'featured',
        ]
      );
      
      
  
      const payment = await financeService.createAdvertisementCharge(client, {
        advertisementId: adResult.rows[0].id,
        supplierId: request.supplier_id,
        amount: totalPrice,
        currency: 'YER',
        title: request.title,
      });

      await client.query(
        `UPDATE advertisements
         SET status = 'active',
             payment_status = 'paid',
             payment_id = $1,
             paid_at = NOW()
         WHERE id = $2`,
        [payment.id, adResult.rows[0].id],
      );

      await client.query(
        `UPDATE advertisement_requests
         SET status = $1,
             reviewer_id = $2,
             reviewer_note = $3,
             reviewed_at = NOW()
         WHERE id = $4`,
        [
          'approved',
          reviewerId,
          note || null,
          requestId,
        ]
      );

      await client.query(
        `INSERT INTO notifications
          (user_id, title, message, type, reference_id, reference_type)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          request.supplier_id,
          'تم اعتماد إعلانك',
          `تم اعتماد طلب الإعلان «${request.title}» ونشره بنجاح.`,
          'system',
          adResult.rows[0].id,
          'advertisement',
        ]
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
  

  rejectAdvertisementRequest: async (requestId, reviewerId, note = '') => {
    const result = await query(
      `UPDATE advertisement_requests
       SET status = 'rejected', reviewer_id = $1, reviewer_note = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [reviewerId, note || null, requestId],
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
