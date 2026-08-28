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
//ايميل
// ========================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ========================
const register = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    company_name,
    city,
    address,
    late_fee_price_per_hour,
    grace_period_hours
  } = req.body;
  
  // Basic Validation
  if (!name || !email || !password) {
    return next(new AppError('الرجاء إدخال الاسم، البريد الإلكتروني، وكلمة المرور', 400));
  }
  const avatar =
  req.files?.avatar?.[0]?.filename || null;

const commercialRegister =
  req.files?.commercial_register?.[0]?.filename || null;

const ownerId =
  req.files?.owner_id?.[0]?.filename || null;
  await sendOTP(
    {
      body: {
        email,
        userData: {
          name,
          email,
          password,
          role,
          phone,
          company_name,
          city,
          address,
          late_fee_price_per_hour,
          grace_period_hours,
          avatar,
         commercialRegister,
         ownerId
        }
      }
    },
    {
      status: () => ({ json: () => {} }),
      json: () => {}
    }
  );
  
  return res.status(200).json({
    success: true,
    message: "تم إرسال رمز التحقق إلى البريد الإلكتروني"
  });
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
    `
    INSERT INTO users (
        name,
        email,
        password,
        role,
        phone,
        company_name,
        city,
        address,
        avatar,
        commercial_register,
        owner_id,
        late_fee_price_per_hour,
        grace_period_hours
    )
    VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    )
    RETURNING *
    `,
    [
        name,
        email,
        hashedPassword,
        userRole,
        phone,
        company_name,
        city,
        address,
        avatar,
        commercialRegister,
        ownerId,
        late_fee_price_per_hour,
        grace_period_hours
    ]
    );
  const user = result.rows[0];
  if (req.files) {
    console.log(req.files);
  }

  // إشعار للإدارة عند تسجيل مورد جديد
  if (userRole === 'supplier') {
    try {
      const admins = await query("SELECT id FROM users WHERE role = 'admin'");
      const io = req.app.get('io');
      
      for (const admin of admins.rows) {
        const notif = await query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type,verification_status,rejection_reason) 
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
