// const jwt = require('jsonwebtoken');
// const { query } = require('../config/database');

// // ========================
// // Protect Route Middleware
// // ========================
// const protect = async (req, res, next) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1];
//   }

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: 'غير مصرح لك. يرجى تسجيل الدخول أولاً.',
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const result = await query(
//       'SELECT id, name, email, role, is_active, is_verified FROM users WHERE id = $1',
//       [decoded.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({ success: false, message: 'المستخدم غير موجود.' });
//     }

//     const user = result.rows[0];

//     if (!user.is_active) {
//       return res.status(403).json({ success: false, message: 'تم تعطيل حسابك. تواصل مع الإدارة.' });
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ success: false, message: 'الجلسة منتهية. يرجى تسجيل الدخول مجدداً.' });
//   }
// };

// // ========================
// // Role Authorization
// // ========================
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `هذا الإجراء غير مسموح لـ ${req.user.role}`,
//       });
//     }
//     next();
//   };
// };

// // ========================
// // Optional Auth (doesn't fail if no token)
// // ========================
// const optionalAuth = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1];
//   }
//   if (!token) return next();
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
//     if (result.rows.length > 0) req.user = result.rows[0];
//   } catch (_) {}
//   next();
// };

// module.exports = { protect, authorize, optionalAuth };



const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const getBearerToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

// حماية المسارات للمستخدمين والموظفين.
const protect = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك. يرجى تسجيل الدخول أولاً.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );

    if (decoded.account_type === 'employee') {
      const result = await query(
        `SELECT id, supplier_id, full_name, phone_number, email,
                role, status
         FROM employees
         WHERE id = $1
         LIMIT 1`,
        [decoded.employee_id || decoded.id]
      );

      const employee = result.rows[0];
      if (!employee) {
        return res.status(401).json({ success: false, message: 'الموظف غير موجود.' });
      }

      const normalizedEmployeeStatus = String(employee.status || '').trim().toLowerCase();
      if (normalizedEmployeeStatus !== 'active') {
        return res.status(403).json({ success: false, message: 'حساب الموظف غير فعال.' });
      }

      req.employeeId = String(employee.id);
      req.user = {
        id: String(employee.id),
        employee_id: String(employee.id),
        supplier_id: String(employee.supplier_id),
        name: employee.full_name,
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone_number,
        role: employee.role,
        account_type: 'employee',
        status: normalizedEmployeeStatus,
        is_active: true,
      };

      return next();
    }

    const result = await query(
      `SELECT id, name, email, role, is_active, is_verified
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [decoded.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'تم تعطيل حسابك. تواصل مع الإدارة.' });
    }

    req.user = { ...user, account_type: 'user' };
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'الجلسة منتهية. يرجى تسجيل الدخول مجدداً.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `هذا الإجراء غير مسموح لـ ${req.user?.role || 'هذا الحساب'}`,
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );

    if (decoded.account_type === 'employee') {
      const result = await query(
        `SELECT id, supplier_id, full_name, phone_number, email, role, status
         FROM employees WHERE id = $1 LIMIT 1`,
        [decoded.employee_id || decoded.id]
      );
      const employee = result.rows[0];
      if (employee?.status === 'active') {
        req.employeeId = String(employee.id);
        req.user = {
          id: String(employee.id),
          employee_id: String(employee.id),
          supplier_id: String(employee.supplier_id),
          name: employee.full_name,
          email: employee.email,
          role: employee.role,
          account_type: 'employee',
          is_active: true,
        };
      }
    } else {
      const result = await query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [decoded.id]
      );
      if (result.rows.length > 0) {
        req.user = { ...result.rows[0], account_type: 'user' };
      }
    }
  } catch (_) {
    // optionalAuth لا يرفض الطلب عند غياب أو انتهاء التوكن.
  }

  next();
};

module.exports = { protect, authorize, optionalAuth };
