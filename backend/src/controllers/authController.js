// const bcrypt = require('bcryptjs');
// const { query } = require('../config/database');
// const { sendTokenResponse } = require('../utils/jwt');
// const { asyncHandler, AppError } = require('../middleware/errorHandler');

// // ========================
// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
// // ========================
// const register = asyncHandler(async (req, res, next) => {
//   const { name, email, password, role, phone } = req.body;

//   // Basic Validation
//   if (!name || !email || !password) {
//     return next(new AppError('الرجاء إدخال الاسم، البريد الإلكتروني، وكلمة المرور', 400));
//   }

//   // Check if user exists
//   const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
//   if (existingUser.rows.length > 0) {
//     return next(new AppError('البريد الإلكتروني مسجل مسبقاً', 400));
//   }

//   // Hash password
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // Default role is customer unless specified
//   const userRole = role === 'supplier' ? 'supplier' : 'customer';

//   // Insert user
//   const result = await query(
//     `INSERT INTO users (name, email, password, role, phone) 
//      VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, is_verified, created_at`,
//     [name, email, hashedPassword, userRole, phone]
//   );

//   const user = result.rows[0];

//   // إشعار للإدارة عند تسجيل مورد جديد
//   if (userRole === 'supplier') {
//     try {
//       const admins = await query("SELECT id FROM users WHERE role = 'admin'");
//       const io = req.app.get('io');
      
//       for (const admin of admins.rows) {
//         const notif = await query(
//           `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
//            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
//           [admin.id, 'مورد جديد', `سجل المورد ${name} للتو في النظام. يرجى مراجعة حسابه وتوثيقه.`, 'system', user.id, 'user']
//         );
//         if (io) io.to(`user_${admin.id}`).emit('new_notification', notif.rows[0]);
//       }
//     } catch (err) {
//       console.error('Error sending admin notification:', err);
//     }
//   }

//   sendTokenResponse(user, 201, res);
// });

// // ========================
// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// // ========================
// const login = asyncHandler(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return next(new AppError('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 400));
//   }

//   const result = await query('SELECT * FROM users WHERE email = $1', [email]);
//   const user = result.rows[0];

//   if (!user) {
//     return next(new AppError('بيانات الدخول غير صحيحة', 401));
//   }

//   if (!user.is_active) {
//     return next(new AppError('حسابك معطل. يرجى التواصل مع الإدارة', 403));
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (!isMatch) {
//     return next(new AppError('بيانات الدخول غير صحيحة', 401));
//   }

//   sendTokenResponse(user, 200, res);
// });

// // ========================
// // @desc    Get current logged in user
// // @route   GET /api/auth/me
// // @access  Private
// // ========================
// const getMe = asyncHandler(async (req, res, next) => {
//    const result = await query(
//     'SELECT id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified, is_active FROM users WHERE id = $1',
//     [req.user.id]
//   );

//   res.status(200).json({
//     success: true,
//     user: result.rows[0],
//   });
// });

// // ========================
// // @desc    Upload KYC Documents
// // @route   POST /api/auth/upload-documents
// // @access  Private
// // ========================
// const uploadDocs = asyncHandler(async (req, res, next) => {
//   if (!req.files || (!req.files.id_card && !req.files.driver_license)) {
//     return next(new AppError('الرجاء إرفاق المستندات المطلوبة', 400));
//   }

//   const userId = req.user.id;
//   const docs = [];

//   // Assuming local storage for now (returns path)
//   if (req.files.id_card) {
//     for (const file of req.files.id_card) {
//       const result = await query(
//         `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
//         [userId, 'id_card', file.path]
//       );
//       docs.push(result.rows[0].id);
//     }
//   }

//   if (req.files.driver_license) {
//     for (const file of req.files.driver_license) {
//       const result = await query(
//         `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
//         [userId, 'driver_license', file.path]
//       );
//       docs.push(result.rows[0].id);
//     }
//   }

//   res.status(201).json({
//     success: true,
//     message: 'تم رفع المستندات بنجاح وجاري مراجعتها',
//     docsUploaded: docs.length,
//   });
// });

// // ========================
// // @desc    Update user profile (name, phone)
// // @route   PUT /api/auth/update-profile
// // @access  Private
// // ========================
// const updateProfile = asyncHandler(async (req, res, next) => {
//    const { name, phone, address, brand_description, iban, bank_name, auto_accept_bookings } = req.body;
//   const userId = req.user.id;

//   const result = await query(
//     `UPDATE users SET 
//       name = COALESCE(NULLIF($1,''), name), 
//       phone = COALESCE(NULLIF($2,''), phone),
//       address = COALESCE(NULLIF($3,''), address),
//       brand_description = COALESCE(NULLIF($4,''), brand_description),
//       iban = COALESCE(NULLIF($5,''), iban),
//       bank_name = COALESCE(NULLIF($6,''), bank_name),
//       auto_accept_bookings = COALESCE($7, auto_accept_bookings)
//      WHERE id = $8 
//      RETURNING id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified`,
//     [name, phone, address, brand_description, iban, bank_name, auto_accept_bookings, userId]
//   );

//   if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));

//   res.json({ success: true, user: result.rows[0] });
// });

// // ========================
// // @desc    Upload brand logo (for suppliers)
// // @route   POST /api/auth/upload-brand-logo
// // @access  Private (Supplier)
// // ========================
// const uploadBrandLogo = asyncHandler(async (req, res, next) => {
//   if (!req.file) return next(new AppError('الرجاء إرفاق صورة الشعار', 400));

//   const result = await query(
//     'UPDATE users SET brand_logo = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, brand_logo',
//     [req.file.path, req.user.id]
//   );

//   res.json({ success: true, data: result.rows[0], message: 'تم رفع الشعار بنجاح' });
// });

// module.exports = {
//   register,
//   login,
//   getMe,
//   uploadDocs,
//   updateProfile,
//   uploadBrandLogo,
// };

// const bcrypt = require('bcryptjs');
// const { query } = require('../config/database');
// const { sendTokenResponse } = require('../utils/jwt');
// const { asyncHandler, AppError } = require('../middleware/errorHandler');

// // ========================
// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
// // ========================
// const register = asyncHandler(async (req, res, next) => {
//   const { name, email, password, role, phone } = req.body;

//   // Basic Validation
//   if (!name || !email || !password) {
//     return next(new AppError('الرجاء إدخال الاسم، البريد الإلكتروني، وكلمة المرور', 400));
//   }

//   // Check if user exists
//   const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
//   if (existingUser.rows.length > 0) {
//     return next(new AppError('البريد الإلكتروني مسجل مسبقاً', 400));
//   }

//   // Hash password
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // Default role is customer unless specified
//   const userRole = role === 'supplier' ? 'supplier' : 'customer';

//   // Insert user
//   const result = await query(
//     `INSERT INTO users (name, email, password, role, phone) 
//      VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, is_verified, created_at`,
//     [name, email, hashedPassword, userRole, phone]
//   );

//   const user = result.rows[0];

//   // إشعار للإدارة عند تسجيل مورد جديد
//   if (userRole === 'supplier') {
//     try {
//       const admins = await query("SELECT id FROM users WHERE role = 'admin'");
//       const io = req.app.get('io');
      
//       for (const admin of admins.rows) {
//         const notif = await query(
//           `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
//            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
//           [admin.id, 'مورد جديد', `سجل المورد ${name} للتو في النظام. يرجى مراجعة حسابه وتوثيقه.`, 'system', user.id, 'user']
//         );
//         if (io) io.to(`user_${admin.id}`).emit('new_notification', notif.rows[0]);
//       }
//     } catch (err) {
//       console.error('Error sending admin notification:', err);
//     }
//   }

//   sendTokenResponse(user, 201, res);
// });

// // ========================
// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// // ========================
// const login = asyncHandler(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return next(new AppError('الرجاء إدخال البريد الإلكتروني وكلمة المرور', 400));
//   }

//   const result = await query('SELECT * FROM users WHERE email = $1', [email]);
//   const user = result.rows[0];

//   if (!user) {
//     return next(new AppError('بيانات الدخول غير صحيحة', 401));
//   }

//   if (!user.is_active) {
//     return next(new AppError('حسابك معطل. يرجى التواصل مع الإدارة', 403));
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (!isMatch) {
//     return next(new AppError('بيانات الدخول غير صحيحة', 401));
//   }

//   sendTokenResponse(user, 200, res);
// });

// // ========================
// // @desc    Get current logged in user
// // @route   GET /api/auth/me
// // @access  Private
// // ========================
// const getMe = asyncHandler(async (req, res, next) => {
//    const result = await query(
//     'SELECT id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified, is_active FROM users WHERE id = $1',
//     [req.user.id]
//   );

//   res.status(200).json({
//     success: true,
//     user: result.rows[0],
//   });
// });

// // ========================
// // @desc    Upload KYC Documents
// // @route   POST /api/auth/upload-documents
// // @access  Private
// // ========================
// const uploadDocs = asyncHandler(async (req, res, next) => {
//   if (!req.files || (!req.files.id_card && !req.files.driver_license)) {
//     return next(new AppError('الرجاء إرفاق المستندات المطلوبة', 400));
//   }

//   const userId = req.user.id;
//   const docs = [];

//   // Assuming local storage for now (returns path)
//   if (req.files.id_card) {
//     for (const file of req.files.id_card) {
//       const result = await query(
//         `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
//         [userId, 'id_card', file.path]
//       );
//       docs.push(result.rows[0].id);
//     }
//   }

//   if (req.files.driver_license) {
//     for (const file of req.files.driver_license) {
//       const result = await query(
//         `INSERT INTO documents (user_id, type, file_url) VALUES ($1, $2, $3) RETURNING id`,
//         [userId, 'driver_license', file.path]
//       );
//       docs.push(result.rows[0].id);
//     }
//   }

//   res.status(201).json({
//     success: true,
//     message: 'تم رفع المستندات بنجاح وجاري مراجعتها',
//     docsUploaded: docs.length,
//   });
// });

// // ========================
// // @desc    Update user profile (name, phone)
// // @route   PUT /api/auth/update-profile
// // @access  Private
// // ========================
// const updateProfile = asyncHandler(async (req, res, next) => {
//    const { name, phone, address, brand_description, iban, bank_name, auto_accept_bookings } = req.body;
//   const userId = req.user.id;

//   const result = await query(
//     `UPDATE users SET 
//       name = COALESCE(NULLIF($1,''), name), 
//       phone = COALESCE(NULLIF($2,''), phone),
//       address = COALESCE(NULLIF($3,''), address),
//       brand_description = COALESCE(NULLIF($4,''), brand_description),
//       iban = COALESCE(NULLIF($5,''), iban),
//       bank_name = COALESCE(NULLIF($6,''), bank_name),
//       auto_accept_bookings = COALESCE($7, auto_accept_bookings)
//      WHERE id = $8 
//      RETURNING id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified`,
//     [name, phone, address, brand_description, iban, bank_name, auto_accept_bookings, userId]
//   );

//   if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));

//   res.json({ success: true, user: result.rows[0] });
// });

// // ========================
// // @desc    Upload brand logo (for suppliers)
// // @route   POST /api/auth/upload-brand-logo
// // @access  Private (Supplier)
// // ========================
// const uploadBrandLogo = asyncHandler(async (req, res, next) => {
//   if (!req.file) return next(new AppError('الرجاء إرفاق صورة الشعار', 400));

//   const result = await query(
//     'UPDATE users SET brand_logo = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, brand_logo',
//     [req.file.path, req.user.id]
//   );

//   res.json({ success: true, data: result.rows[0], message: 'تم رفع الشعار بنجاح' });
// });

// module.exports = {
//   register,
//   login,
//   getMe,
//   uploadDocs,
//   updateProfile,
//   uploadBrandLogo,
// };

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { sendTokenResponse } = require('../utils/jwt');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { sendOTP } = require("./verificationController");
const crypto = require('crypto');
const { sendEmail, generateOTP } = require('../services/emailService');
const { normalizePhoneNumber } = require('../utils/phone');
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[\x21-\x7E]{10,72}$/.test(String(value || ''));
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
//ايميل
// ========================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ========================
const register = asyncHandler(async (req, res, next) => {
  const {
    name, email, password, role, phone, company_name, city, address,
    late_fee_price_per_hour, grace_period_hours, latitude, longitude
  } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('الرجاء إدخال الاسم، البريد الإلكتروني، وكلمة المرور', 400));
  }
  if (!isStrongPassword(password)) {
    return next(new AppError('كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا خاصًا', 400));
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhoneNumber(phone);
  const isSupplier = role === 'supplier';
  if (isSupplier && (
    !req.files?.avatar?.[0] ||
    !req.files?.commercial_register?.[0] ||
    !req.files?.owner_id?.[0]
  )) {
    return next(new AppError('شعار الشركة والسجل التجاري وهوية المالك مطلوبة', 400));
  }
  if (!normalizedPhone) {
    return next(new AppError('الرجاء إدخال رقم هاتف صحيح', 400));
  }


  const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
  if (existingUser.rows.length > 0) {
    return next(new AppError('البريد الإلكتروني مسجل مسبقاً', 400));
  }


  // const userData = {
  //   name: name.trim(), email: email.trim(), password, role: role === 'supplier' ? 'supplier' : 'customer',
  // }
  const existingPhone = await query(
    'SELECT id FROM users WHERE phone_normalized = $1 LIMIT 1',
    [normalizedPhone]
  );
  if (existingPhone.rows.length > 0) {
    return next(new AppError('رقم الهاتف مستخدم مسبقاً', 409));
  }

  const userData = {
    name: name.trim(), email: normalizedEmail, password, role: role === 'supplier' ? 'supplier' : 'customer',
    phone: normalizedPhone, company_name, city, address, latitude, longitude,

    late_fee_price_per_hour, grace_period_hours,
    avatar: req.files?.avatar?.[0]?.filename || null,
    commercial_register: req.files?.commercial_register?.[0]?.filename || null,
    owner_id: req.files?.owner_id?.[0]?.filename || null
  };

  await sendOTP(
    { body: { email: userData.email, userData } },
    { internalCall: true, status: () => ({ json: () => {} }), json: () => {} }
  );

  return res.status(200).json({
    success: true,
    message: 'تم إرسال رمز التحقق إلى البريد الإلكتروني'
  });
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
 // الموظف له جدول مستقل، لذلك نفحص employees أولاً.
 const employeeResult = await query(
  `SELECT id, supplier_id, full_name, phone_number, email,
          password, role, status, created_at
   FROM employees
   WHERE LOWER(email) = LOWER($1)
   LIMIT 1`,
  [email]
);
const employee = employeeResult.rows[0];

if (employee) {
  const normalizedEmployeeStatus = String(employee.status || '').trim().toLowerCase();
  if (normalizedEmployeeStatus !== 'active') {
    return next(new AppError('حساب الموظف غير فعال. تواصل مع المورد', 403));
  }

  const employeePasswordMatches = await bcrypt.compare(
    password,
    employee.password
  );

  if (!employeePasswordMatches) {
    return next(new AppError('بيانات الدخول غير صحيحة', 401));
  }

  return sendTokenResponse(
    {
      id: String(employee.id),
      name: employee.full_name,
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone_number,
      phone_number: employee.phone_number,
      role: employee.role,
      status: normalizedEmployeeStatus,
      supplier_id: String(employee.supplier_id),
      employee_id: String(employee.id),
    },
    200,
    res,
    {
      account_type: 'employee',
      employee_id: String(employee.id),
      supplier_id: String(employee.supplier_id),
    }
  );
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
  if (user.role === "supplier") {

    if (user.verification_status === "pending") {
      return res.status(200).json({
        success: false,
        verification_status: "pending",
        message: "حسابك قيد المراجعة",
        phone: "777777777",
        email: "support@yourdomain.com"
      });
    }
  
    if (user.verification_status === "rejected") {
      return res.status(200).json({
        success: false,
        verification_status: "rejected",
        message: "تم رفض طلبك",
        reason: user.rejection_reason,
        phone: "777777777",
        email: "support@yourdomain.com"
      });
    }
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
    'SELECT id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified, verification_status, rejection_reason, is_active FROM users WHERE id = $1',
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

const resubmitSupplierDocuments = asyncHandler(async (req, res, next) => {
  let supplierId = req.user?.id;
  if (!supplierId) {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!email || !password) return next(new AppError('البريد الإلكتروني وكلمة المرور مطلوبان', 400));
    const supplierResult = await query(
      'SELECT id, password, role, verification_status FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );
    const supplier = supplierResult.rows[0];
    if (!supplier || supplier.role !== 'supplier' || !(await bcrypt.compare(password, supplier.password))) {
      return next(new AppError('بيانات المورد غير صحيحة', 401));
    }
    supplierId = supplier.id;
    if (supplier.verification_status !== 'rejected') {
      return next(new AppError('إعادة الإرسال متاحة فقط للطلبات المرفوضة', 409));
    }
  } else if (req.user.role !== 'supplier') {
    return next(new AppError('هذا الإجراء متاح للموردين فقط', 403));
  }
  if (!req.files || !Object.values(req.files).some((files) => files?.length)) {
    return next(new AppError('اختر ملفًا واحدًا على الأقل لإعادة الإرسال', 400));
  }

  const files = req.files;
  const result = await query(
    `UPDATE users SET
      avatar = COALESCE($1, avatar),
      commercial_register = COALESCE($2, commercial_register),
      owner_id = COALESCE($3, owner_id),
      verification_status = 'pending',
      is_verified = FALSE,
      rejection_reason = NULL
     WHERE id = $4 AND role = 'supplier' AND verification_status = 'rejected'
     RETURNING id, verification_status, rejection_reason`,
    [files.avatar?.[0]?.filename || null, files.commercial_register?.[0]?.filename || null, files.owner_id?.[0]?.filename || null, supplierId]
  );

  if (!result.rows.length) return next(new AppError('حساب المورد غير موجود', 404));
  try {
    const admins = await query("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE");
    for (const admin of admins.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, action_url)
         VALUES ($1, $2, $3, 'system', $4, 'user', '/admin/supplier-requests')`,
        [admin.id, 'إعادة إرسال مستندات مورد', 'أعاد مورد مرفوض إرسال مستندات للتدقيق.', supplierId]
      );
    }
  } catch (notificationError) {
    console.error('Failed to notify admins about supplier resubmission:', notificationError);
  }
  res.json({ success: true, message: 'تمت إعادة إرسال المستندات للمراجعة', data: result.rows[0] });
});

// ========================
// @desc    Update user profile (name, phone)
// @route   PUT /api/auth/update-profile
// @access  Private
// ========================
const updateProfile = asyncHandler(async (req, res, next) => {
   const { name, phone, address, brand_description, iban, bank_name, auto_accept_bookings } = req.body;
  const userId = req.user.id;
  const normalizedPhone = phone === undefined ? null : normalizePhoneNumber(phone);
  if (phone !== undefined && !normalizedPhone) {
    return next(new AppError('الرجاء إدخال رقم هاتف صحيح', 400));
  }
  if (normalizedPhone) {
    const duplicatePhone = await query(
      'SELECT id FROM users WHERE phone_normalized = $1 AND id <> $2 LIMIT 1',
      [normalizedPhone, userId]
    );
    if (duplicatePhone.rows.length > 0) {
      return next(new AppError('رقم الهاتف مستخدم مسبقاً', 409));
    }
  }
  const result = await query(
    `UPDATE users SET 
      name = COALESCE(NULLIF($1,''), name), 
      phone = COALESCE(NULLIF($2,''), phone),
      phone_normalized = COALESCE(NULLIF($9,''), phone_normalized),
      address = COALESCE(NULLIF($3,''), address),
      brand_description = COALESCE(NULLIF($4,''), brand_description),
      iban = COALESCE(NULLIF($5,''), iban),
      bank_name = COALESCE(NULLIF($6,''), bank_name),
      auto_accept_bookings = COALESCE($7, auto_accept_bookings)
     WHERE id = $8 
     RETURNING id, name, email, role, phone, avatar, brand_logo, brand_description, address, iban, bank_name, auto_accept_bookings, is_verified`,
    [name, phone, address, brand_description, iban, bank_name, auto_accept_bookings, userId, normalizedPhone]
  );

  if (result.rows.length === 0) return next(new AppError('المستخدم غير موجود', 404));

  res.json({ success: true, user: result.rows[0] });
});

const requestPasswordChangeOTP = asyncHandler(async (req, res, next) => {
  const userResult = await query('SELECT id, email, name FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
  const user = userResult.rows[0];
  if (!user?.email) return next(new AppError('لا يوجد بريد إلكتروني مرتبط بالحساب', 400));

  const otp = generateOTP();
  const tokenHash = crypto.createHash('sha256').update(`${user.email.toLowerCase()}:${otp}`).digest('hex');
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [user.id]);
  await query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`, [user.id, tokenHash]);
  await sendEmail(user.email, 'رمز تأكيد تغيير كلمة المرور', `<h2>تأكيد تغيير كلمة المرور</h2><p>مرحباً ${user.name || ''}، استخدم الرمز التالي لإكمال العملية:</p><h1>${otp}</h1><p>الرمز صالح لمدة 10 دقائق.</p>`);
  res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { current_password, new_password, confirm_password, otp } = req.body;
  if (!current_password || !new_password || !confirm_password || !otp) {
    return next(new AppError('يرجى إدخال كلمة المرور الحالية والرمز وكلمة المرور الجديدة وتأكيدها', 400));
  }
  if (!/^\d{6}$/.test(String(otp))) return next(new AppError('رمز التحقق يجب أن يتكون من 6 أرقام', 400));
  if (!isStrongPassword(new_password)) return next(new AppError('كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا خاصًا', 400));
  if (new_password !== confirm_password) return next(new AppError('كلمات المرور الجديدة غير متطابقة', 400));

  const client = await require('../config/database').getClient();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT password, email FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    if (!current.rows.length || !(await bcrypt.compare(current_password, current.rows[0].password))) {
      await client.query('ROLLBACK');
      return next(new AppError('كلمة المرور الحالية غير صحيحة', 400));
    }
    const tokenHash = crypto.createHash('sha256').update(`${current.rows[0].email.toLowerCase()}:${otp}`).digest('hex');
    const token = await client.query('SELECT id FROM password_reset_tokens WHERE user_id = $1 AND token_hash = $2 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE', [req.user.id, tokenHash]);
    if (!token.rows.length) {
      await client.query('ROLLBACK');
      return next(new AppError('رمز التحقق غير صحيح أو منتهي الصلاحية', 400));
    }
    const hashedPassword = await bcrypt.hash(new_password, 12);
    await client.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [token.rows[0].id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

const requestPasswordReset = asyncHandler(async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return next(new AppError('البريد الإلكتروني مطلوب', 400));
  const user = await query('SELECT id, name FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
  if (user.rows.length) {
    const otp = generateOTP();
    const tokenHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
    await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [user.rows[0].id]);
    await query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`, [user.rows[0].id, tokenHash]);
    await sendEmail(email, 'رمز إعادة تعيين كلمة المرور', `<h2>رمز إعادة تعيين كلمة المرور</h2><h1>${otp}</h1><p>الرمز صالح لمدة 10 دقائق.</p>`);
  }
  res.json({ success: true, message: 'إذا كان البريد مسجلاً، فسيصلك رمز الاستعادة.' });
});

const verifyPasswordReset = asyncHandler(async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  if (!email || !/^\d{6}$/.test(otp)) return next(new AppError('البريد والرمز المكون من 6 أرقام مطلوبان', 400));
  const tokenHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
  const result = await query(`SELECT t.id FROM password_reset_tokens t JOIN users u ON u.id = t.user_id WHERE LOWER(u.email) = $1 AND t.token_hash = $2 AND t.used_at IS NULL AND t.expires_at > NOW() LIMIT 1`, [email, tokenHash]);
  if (!result.rows.length) return next(new AppError('الرمز غير صحيح أو منتهي الصلاحية', 400));
  res.json({ success: true, message: 'الرمز صحيح' });
});

const resetPassword = asyncHandler(async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const password = String(req.body.password || '');
  if (!email || !/^\d{6}$/.test(otp) || !isStrongPassword(password)) return next(new AppError('أدخل البريد والرمز وكلمة مرور قوية من 10 أحرف على الأقل', 400));
  const tokenHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
  const client = await require('../config/database').getClient();
  try {
    await client.query('BEGIN');
    const token = await client.query(`SELECT t.id, t.user_id FROM password_reset_tokens t JOIN users u ON u.id = t.user_id WHERE LOWER(u.email) = $1 AND t.token_hash = $2 AND t.used_at IS NULL AND t.expires_at > NOW() FOR UPDATE`, [email, tokenHash]);
    if (!token.rows.length) { await client.query('ROLLBACK'); return next(new AppError('الرمز غير صحيح أو منتهي الصلاحية', 400)); }
    const hashed = await bcrypt.hash(password, 12);
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, token.rows[0].user_id]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [token.rows[0].id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
});

module.exports = {
  register,
  login,
  getMe,
  uploadDocs,
  resubmitSupplierDocuments,
  updateProfile,
  requestPasswordChangeOTP,
  changePassword,
  uploadBrandLogo,
  requestPasswordReset,
  verifyPasswordReset,
  resetPassword,
};
