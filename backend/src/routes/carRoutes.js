const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadCarImages } = require('../middleware/upload');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

// ========================
// @desc    Get all cars (with filters)
// @route   GET /api/cars
// @access  Public
// ========================
router.get('/', asyncHandler(async (req, res) => {
  const {
    category, location, min_price, max_price,
    transmission, fuel_type, seats, status,
    search, sort_by, page = 1, limit = 12
  } = req.query;

  let sql = `
    SELECT c.*, 
           u.name as supplier_name, u.brand_logo,
           cat.name as category_name,
           loc.city as location_city,
           (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as primary_image
    FROM cars c
    LEFT JOIN users u ON c.supplier_id = u.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN locations loc ON c.location_id = loc.id
    WHERE c.is_approved = true AND c.status = 'available'
  `;
  const params = [];
  let paramIndex = 1;

  if (category) { sql += ` AND c.category_id = $${paramIndex++}`; params.push(category); }
  if (location) { sql += ` AND c.location_id = $${paramIndex++}`; params.push(location); }
  if (min_price) { sql += ` AND c.price_per_day >= $${paramIndex++}`; params.push(min_price); }
  if (max_price) { sql += ` AND c.price_per_day <= $${paramIndex++}`; params.push(max_price); }
  if (transmission) { sql += ` AND c.transmission = $${paramIndex++}`; params.push(transmission); }
  if (fuel_type) { sql += ` AND c.fuel_type = $${paramIndex++}`; params.push(fuel_type); }
  if (seats) { sql += ` AND c.seats >= $${paramIndex++}`; params.push(seats); }
  if (search) { sql += ` AND (c.make ILIKE $${paramIndex} OR c.model ILIKE $${paramIndex})`; params.push(`%${search}%`); paramIndex++; }

  // Sorting
  const sortOptions = {
    price_asc: 'c.price_per_day ASC',
    price_desc: 'c.price_per_day DESC',
    rating: 'c.average_rating DESC',
    newest: 'c.created_at DESC',
  };
  sql += ` ORDER BY ${sortOptions[sort_by] || 'c.created_at DESC'}`;

  // Pagination
  const offset = (page - 1) * limit;
  sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  // Count total
  let countSql = `SELECT COUNT(*) FROM cars c WHERE c.is_approved = true AND c.status = 'available'`;
  const countResult = await query(countSql);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// ========================
// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
// ========================
router.get('/:id', asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const carResult = await query(`
    SELECT c.*, u.name as supplier_name, u.avatar as supplier_avatar, u.phone as supplier_phone,
           u.brand_logo, u.brand_description,
           cat.name as category_name, loc.city as location_city
    FROM cars c
    LEFT JOIN users u ON c.supplier_id = u.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN locations loc ON c.location_id = loc.id
    WHERE c.id = $1
  `, [id]);

  if (carResult.rows.length === 0) {
    return next(new AppError('السيارة غير موجودة', 404));
  }

  // Get images
  const images = await query('SELECT * FROM car_images WHERE car_id = $1 ORDER BY is_primary DESC', [id]);

  // Get features
  const features = await query('SELECT feature FROM car_features WHERE car_id = $1', [id]);

  // Get reviews
  const reviews = await query(`
    SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r JOIN users u ON r.reviewer_id = u.id
    WHERE r.car_id = $1 AND r.is_visible = true ORDER BY r.created_at DESC LIMIT 10
  `, [id]);

  res.json({
    success: true,
    data: {
      ...carResult.rows[0],
      images: images.rows,
      features: features.rows.map(f => f.feature),
      reviews: reviews.rows,
    },
  });
}));

// ========================
// @desc    Create a car
// @route   POST /api/cars
// @access  Supplier
// ========================
router.post('/', protect, authorize('supplier'), asyncHandler(async (req, res) => {
  const {
    category_id, location_id, make, model, year, color,
    license_plate, seats, doors, transmission, fuel_type,
    price_per_day, discount_percentage, description, mileage, features
  } = req.body;

  const result = await query(`
    INSERT INTO cars (supplier_id, category_id, location_id, make, model, year, color,
      license_plate, seats, doors, transmission, fuel_type, price_per_day, discount_percentage, description, mileage)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *
  `, [req.user.id, category_id, location_id, make, model, year, color,
      license_plate, seats || 5, doors || 4, transmission || 'automatic',
      fuel_type || 'petrol', price_per_day, discount_percentage || 0, description, mileage || 0]);

  const car = result.rows[0];

  // Add features
  if (features && Array.isArray(features)) {
    for (const feature of features) {
      await query('INSERT INTO car_features (car_id, feature) VALUES ($1, $2) ON CONFLICT DO NOTHING', [car.id, feature]);
    }
  }

  // Notify Admins about the new car pending approval
  try {
    const admins = await query("SELECT id FROM users WHERE role = 'admin'");
    const io = req.app.get('io');
    for (const admin of admins.rows) {
      const notif = await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [admin.id, 'سيارة جديدة بانتظار الموافقة', `تمت إضافة سيارة جديدة (${make} ${model}) بانتظار مراجعتك.`, 'car', car.id, 'car']
      );
      if (io) io.to(`user_${admin.id}`).emit('new_notification', notif.rows[0]);
    }
  } catch (err) {
    console.error('Error sending admin notification for new car:', err);
  }

  res.status(201).json({ success: true, data: car });
}));

// ========================
// @desc    Upload car images
// @route   POST /api/cars/:id/images
// @access  Supplier (owner)
// ========================
router.post('/:id/images', protect, authorize('supplier'), uploadCarImages, asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Check ownership
  const car = await query('SELECT supplier_id FROM cars WHERE id = $1', [id]);
  if (car.rows.length === 0) return next(new AppError('السيارة غير موجودة', 404));
  if (car.rows[0].supplier_id !== req.user.id) return next(new AppError('غير مصرح لك', 403));

  if (!req.files || req.files.length === 0) return next(new AppError('الرجاء إرفاق صور', 400));

  const images = [];
  for (let i = 0; i < req.files.length; i++) {
    const isPrimary = i === 0;
    const result = await query(
      'INSERT INTO car_images (car_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
      [id, req.files[i].path, isPrimary]
    );
    images.push(result.rows[0]);
  }

  res.status(201).json({ success: true, data: images });
}));

// ========================
// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Supplier (owner)
// ========================
router.put('/:id', protect, authorize('supplier'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const car = await query('SELECT supplier_id FROM cars WHERE id = $1', [id]);
  if (car.rows.length === 0) return next(new AppError('السيارة غير موجودة', 404));
  if (car.rows[0].supplier_id !== req.user.id) return next(new AppError('غير مصرح لك', 403));

  const { make, model, year, color, seats, doors, transmission, fuel_type, price_per_day, discount_percentage, description, mileage, status } = req.body;

  const result = await query(`
    UPDATE cars SET make = COALESCE($1, make), model = COALESCE($2, model), year = COALESCE($3, year),
      color = COALESCE($4, color), seats = COALESCE($5, seats), doors = COALESCE($6, doors),
      transmission = COALESCE($7, transmission), fuel_type = COALESCE($8, fuel_type),
      price_per_day = COALESCE($9, price_per_day), discount_percentage = COALESCE($10, discount_percentage), description = COALESCE($11, description),
      mileage = COALESCE($12, mileage), status = COALESCE($13, status)
    WHERE id = $14 RETURNING *
  `, [make, model, year, color, seats, doors, transmission, fuel_type, price_per_day, discount_percentage, description, mileage, status, id]);

  res.json({ success: true, data: result.rows[0] });
}));

// ========================
// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Supplier (owner) / Admin
// ========================
router.delete('/:id', protect, authorize('supplier', 'admin'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const car = await query('SELECT supplier_id FROM cars WHERE id = $1', [id]);
  if (car.rows.length === 0) return next(new AppError('السيارة غير موجودة', 404));
  if (req.user.role !== 'admin' && car.rows[0].supplier_id !== req.user.id) return next(new AppError('غير مصرح لك', 403));

  await query('DELETE FROM cars WHERE id = $1', [id]);
  res.json({ success: true, message: 'تم حذف السيارة بنجاح' });
}));

// ========================
// @desc    Get supplier's cars
// @route   GET /api/cars/my/list
// @access  Supplier
// ========================
router.get('/my/list', protect, authorize('supplier'), asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT c.*, cat.name as category_name, loc.city as location_city,
           (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as primary_image
    FROM cars c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN locations loc ON c.location_id = loc.id
    WHERE c.supplier_id = $1 ORDER BY c.created_at DESC
  `, [req.user.id]);

  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Get categories
// @route   GET /api/cars/categories/list
// @access  Public
// ========================
router.get('/categories/list', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM categories WHERE is_active = true ORDER BY name');
  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Get locations
// @route   GET /api/cars/locations/list
// @access  Public
// ========================
router.get('/locations/list', asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM locations WHERE is_active = true ORDER BY city');
  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Get favorite cars
// @route   GET /api/cars/my/favorites
// @access  Customer
// ========================
router.get('/my/favorites', protect, authorize('customer'), asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT c.*, cat.name as category_name, loc.city as location_city,
           (SELECT image_url FROM car_images WHERE car_id = c.id AND is_primary = true LIMIT 1) as primary_image
    FROM favorite_cars fc
    JOIN cars c ON fc.car_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN locations loc ON c.location_id = loc.id
    WHERE fc.user_id = $1 ORDER BY fc.created_at DESC
  `, [req.user.id]);
  res.json({ success: true, data: result.rows });
}));

// ========================
// @desc    Toggle favorite car
// @route   POST /api/cars/:id/favorite
// @access  Customer
// ========================
router.post('/:id/favorite', protect, authorize('customer'), asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const existing = await query('SELECT * FROM favorite_cars WHERE user_id = $1 AND car_id = $2', [req.user.id, id]);
  
  if (existing.rows.length > 0) {
    await query('DELETE FROM favorite_cars WHERE user_id = $1 AND car_id = $2', [req.user.id, id]);
    res.json({ success: true, message: 'تم الإزالة من المفضلة', isFavorite: false });
  } else {
    await query('INSERT INTO favorite_cars (user_id, car_id) VALUES ($1, $2)', [req.user.id, id]);
    res.json({ success: true, message: 'تم الإضافة إلى المفضلة', isFavorite: true });
  }
}));

module.exports = router;
