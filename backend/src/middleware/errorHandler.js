// ========================
// Global Error Handler
// ========================
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'خطأ في الخادم الداخلي';

  // PostgreSQL Errors
  if (err.code === '23505') {
    statusCode = 400;
    message = 'هذه البيانات موجودة مسبقاً';
    if (err.detail && err.detail.includes('email')) {
      message = 'البريد الإلكتروني مستخدم مسبقاً';
    }
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'بيانات مرتبطة غير موجودة';
  }

  if (err.code === '23502') {
    statusCode = 400;
    message = 'حقل مطلوب مفقود';
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'رمز التحقق غير صالح';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'انتهت صلاحية الجلسة';
  }

  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'حجم الملف كبير جداً (الحد الأقصى 5MB)';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'نوع الملف غير مدعوم';
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ========================
// Async Error Wrapper
// ========================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ========================
// Custom Error Class
// ========================
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, asyncHandler, AppError };
