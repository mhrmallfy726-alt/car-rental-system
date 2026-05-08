const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { sendTokenResponse } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ========================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ========================
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;

  // Basic Validation
  if (!name || !email || !password) {
    return next(new AppError('الرجاء إدخال الاسم، البريد الإلكتروني، وكلمة المرور', 400));
  }

  // Check if user exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    return next(new AppError('البريد الإلكتروني مسجل مسبقاً', 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Default role is customer unless specified
  const userRole = role === 'supplier' ? 'supplier' : 'customer';

  // Insert user
  const result = await query(
    `INSERT INTO users (name, email, password, role, phone) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, is_verified, created_at`,
    [name, email, hashedPassword, userRole, phone]
  );

  const user = result.rows[0];

  // إشعار للإدارة عند تسجيل مورد جديد
  if (userRole === 'supplier') {
    try {
      const admins = await query("SELECT id FROM users WHERE role = 'admin'");
      const io = req.app.get('io');
      
      for (const admin of admins.rows) {
        const notif = await query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [admin.id, 'مورد جديد', `سجل المورد ${name} للتو في النظام. يرجى مراجعة حسابه وتوثيقه.`, 'system', user.id, 'user']
        );
        if (io) io.to(`user_${admin.id}`).emit('new_notification', notif.rows[0]);
      }
    } catch (err) {
      console.error('Error sending admin notification:', err);
    }
  }

  sendTokenResponse(user, 201, res);
});

// ========================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ========================
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 400));
  }

  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    return next(new AppError('بيانات الدخول غير صحيحة', 401));
  }

  if (!user.is_active) {
    return next(new AppError('حسابك معطل. يرجى التواصل مع الإدارة', 403));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new AppError('بيانات الدخول غير صحيحة', 401));
  }

  sendTokenResponse(user, 200, res);
});

// ========================
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
// ========================
const getMe = asyncHandler(async (req, res, next) => {
   const result = await query(
    'SELECT id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified, is_active FROM users WHERE id = $1',
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    user: result.rows[0],
  });
});

// ========================
// @desc    Upload KYC Documents
// @route   POST /api/auth/upload-documents
// @access  Private
// ========================
const uploadDocs = asyncHandler(async (req, res, next) => {
  if (!req.files || (!req.files.id_card && !req.files.driver_license)) {
    return next(new AppError('الرجاء إرفاق المستندات المطلوبة', 400));
  }

  const userId = req.user.id;
  const docs = [];

  // Assuming local storage for now (returns path)
  if (req.files.id_card) {
    for (const file of req.files.id_card) {
      const result = await query(
        `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
        [userId, 'id_card', file.path]
      );
      docs.push(result.rows[0].id);
    }
  }

  if (req.files.driver_license) {
    for (const file of req.files.driver_license) {
      const result = await query(
        `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
        [userId, 'driver_license', file.path]
      );
      docs.push(result.rows[0].id);
    }
  }

  res.status(201).json({
    success: true,
    message: 'تم رفع المستندات بنجاح وجاري مراجعتها',
    docsUploaded: docs.length,
  });
});

// ========================
// @desc    Update user profile (name, phone)
// @route   PUT /api/auth/update-profile
// @access  Private
// ========================
const updateProfile = asyncHandler(async (req, res, next) => {
   const { name, phone, address, brand_description, iban, bank_name, auto_accept_bookings } = req.body;
  const userId = req.user.id;

  const result = await query(
    `UPDATE users SET 
      name = COALESCE(NULLIF($1,''), name), 
      phone = COALESCE(NULLIF($2,''), phone),
      address = COALESCE(NULLIF($3,''), address),
      brand_description = COALESCE(NULLIF($4,''), brand_description),
      iban = COALESCE(NULLIF($5,''), iban),
      bank_name = COALESCE(NULLIF($6,''), bank_name),
      auto_accept_bookings = COALESCE($7, auto_accept_bookings)
     WHERE id = $8 
     RETURNING id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified`,
    [name, phone, address, brand_description, iban, bank_name, auto_accept_bookings, userId]
  );

  if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));

  res.json({ success: true, user: result.rows[0] });
});

// ========================
// @desc    Upload brand logo (for suppliers)
// @route   POST /api/auth/upload-brand-logo
// @access  Private (Supplier)
// ========================
const uploadBrandLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('الرجاء إرفاق صورة الشعار', 400));

  const result = await query(
    'UPDATE users SET brand_logo = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, brand_logo',
    [req.file.path, req.user.id]
  );

  res.json({ success: true, data: result.rows[0], message: 'تم رفع الشعار بنجاح' });
});

module.exports = {
  register,
  login,
  getMe,
  uploadDocs,
  updateProfile,
  uploadBrandLogo,
};
