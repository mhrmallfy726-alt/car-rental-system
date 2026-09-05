const { query } = require('../config/database');

/**
 * Registers a violation for a customer or supplier.
 * The first violation warns the account; the second and later violations ban it.
 */
async function registerViolation({ userId, reportedBy = null, reason, description = null, severity = 'warning', io = null }) {
  if (!userId || !reason) throw new Error('userId and reason are required');

  const userResult = await query(
    `SELECT id, name, role, is_active FROM users WHERE id = $1 FOR UPDATE`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) {
    const error = new Error('المستخدم غير موجود');
    error.statusCode = 404;
    throw error;
  }
  if (!['customer', 'supplier'].includes(user.role)) {
    const error = new Error('يمكن تسجيل المخالفات للعملاء والموردين فقط');
    error.statusCode = 400;
    throw error;
  }
  if (!user.is_active) {
    const error = new Error('لا يمكن تسجيل مخالفة جديدة لحساب محظور أو معطل');
    error.statusCode = 400;
    throw error;
  }

  const countResult = await query(
    'SELECT COUNT(*)::int AS count FROM user_violations WHERE user_id = $1',
    [userId]
  );
  const violationNumber = countResult.rows[0].count + 1;
  const banned = violationNumber >= 2;
  const actionTaken = banned ? 'banned' : 'warning';

  const violationResult = await query(
    `INSERT INTO user_violations
      (user_id, reported_by, reason, description, severity, violation_number, action_taken)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, reportedBy, reason.trim(), description?.trim() || null, severity, violationNumber, actionTaken]
  );

  if (banned && user.is_active) {
    await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [userId]);
  }

  const title = banned ? 'تم حظر حسابك بسبب تكرار المخالفات' : 'تنبيه مخالفة على حسابك';
  const message = banned
    ? `تم تسجيل المخالفة رقم ${violationNumber}: ${reason}. بسبب تكرار المخالفات تم حظر حسابك. يرجى التواصل مع الإدارة.`
    : `تم تسجيل مخالفة على حسابك: ${reason}. هذا تنبيه أول، وفي حال تكرار المخالفة سيتم حظر الحساب.`;
  const notificationResult = await query(
    `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
     VALUES ($1, $2, $3, 'violation', $4, 'user_violation') RETURNING *`,
    [userId, title, message, violationResult.rows[0].id]
  );

  const notification = notificationResult.rows[0];
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
    io.to(`user_${userId}`).emit('account_status_changed', { is_active: !banned });
  }

  return {
    violation: violationResult.rows[0],
    notification,
    banned,
    violationNumber,
    user: { ...user, is_active: banned ? false : user.is_active },
  };
}

module.exports = { registerViolation };
