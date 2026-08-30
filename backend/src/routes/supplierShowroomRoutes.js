const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('supplier'));

// Get all showrooms owned by the logged-in supplier
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT s.*, l.city AS location_city
    FROM supplier_showrooms s
    LEFT JOIN locations l ON l.id = s.location_id
    WHERE s.supplier_id = $1
    ORDER BY s.created_at DESC
  `, [req.user.id]);

  res.json({ success: true, data: result.rows });
}));

// Get one showroom owned by the logged-in supplier
router.get('/:id', asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT s.*, l.city AS location_city
    FROM supplier_showrooms s
    LEFT JOIN locations l ON l.id = s.location_id
    WHERE s.id = $1 AND s.supplier_id = $2
  `, [req.params.id, req.user.id]);

  if (!result.rows.length) return next(new AppError('المعرض غير موجود', 404));
  res.json({ success: true, data: result.rows[0] });
}));

// Create a showroom. The unique constraint also protects against duplicate names under concurrency.
router.post('/', asyncHandler(async (req, res, next) => {
  const { name, location_id, address, phone, latitude, longitude } = req.body;
  const cleanName = String(name || '').trim();

  if (!cleanName) return next(new AppError('اسم المعرض مطلوب', 400));
  if (cleanName.length > 150) return next(new AppError('اسم المعرض طويل جداً', 400));

  try {
    const result = await query(`
      INSERT INTO supplier_showrooms
        (supplier_id, name, location_id, address, phone, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      req.user.id,
      cleanName,
      location_id || null,
      address || null,
      phone || null,
      latitude ?? null,
      longitude ?? null,
    ]);

    res.status(201).json({ success: true, data: result.rows[0], message: 'تم إنشاء المعرض بنجاح' });
  } catch (error) {
    if (error.code === '23505') {
      return next(new AppError('اسم المعرض مستخدم مسبقاً، اختر اسماً آخر', 409));
    }
    throw error;
  }
}));

// Update a showroom owned by the logged-in supplier
router.put('/:id', asyncHandler(async (req, res, next) => {
  const { name, location_id, address, phone, latitude, longitude, is_active } = req.body;
  const cleanName = name === undefined ? undefined : String(name).trim();

  if (cleanName !== undefined && !cleanName) {
    return next(new AppError('اسم المعرض مطلوب', 400));
  }

  try {
    const result = await query(`
      UPDATE supplier_showrooms
      SET name = COALESCE($1, name),
          location_id = COALESCE($2, location_id),
          address = COALESCE($3, address),
          phone = COALESCE($4, phone),
          latitude = COALESCE($5, latitude),
          longitude = COALESCE($6, longitude),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
      WHERE id = $8 AND supplier_id = $9
      RETURNING *
    `, [cleanName, location_id, address, phone, latitude, longitude, is_active, req.params.id, req.user.id]);

    if (!result.rows.length) return next(new AppError('المعرض غير موجود', 404));
    res.json({ success: true, data: result.rows[0], message: 'تم تحديث المعرض بنجاح' });
  } catch (error) {
    if (error.code === '23505') {
      return next(new AppError('اسم المعرض مستخدم مسبقاً، اختر اسماً آخر', 409));
    }
    throw error;
  }
}));

// Soft-delete/disable a showroom. Cars are not deleted.
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const result = await query(`
    UPDATE supplier_showrooms
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = $1 AND supplier_id = $2
    RETURNING id
  `, [req.params.id, req.user.id]);

  if (!result.rows.length) return next(new AppError('المعرض غير موجود', 404));
  res.json({ success: true, message: 'تم تعطيل المعرض بنجاح' });
}));

module.exports = router;
