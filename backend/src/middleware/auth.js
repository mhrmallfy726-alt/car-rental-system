const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// ========================
// Protect Route Middleware
// ========================
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك. يرجى تسجيل الدخول أولاً.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, name, email, role, is_active, is_verified FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'المستخدم غير موجود.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'تم تعطيل حسابك. تواصل مع الإدارة.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'الجلسة منتهية. يرجى تسجيل الدخول مجدداً.' });
  }
};

// ========================
// Role Authorization
// ========================
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `هذا الإجراء غير مسموح لـ ${req.user.role}`,
      });
    }
    next();
  };
};

// ========================
// Optional Auth (doesn't fail if no token)
// ========================
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length > 0) req.user = result.rows[0];
  } catch (_) {}
  next();
};

module.exports = { protect, authorize, optionalAuth };
