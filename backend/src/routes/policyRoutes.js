const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.get('/current', asyncHandler(async (req, res) => {
  const result = await query(`SELECT pv.id, pv.version, pv.title, pv.language, pv.body, pv.status, pv.effective_at, ps.response_hours, ps.appeal_hours, ps.return_damage_report_hours, ps.evidence_retention_days, ps.grace_period_minutes FROM policy_versions pv LEFT JOIN policy_settings ps ON ps.policy_version = pv.version WHERE pv.status = 'effective' ORDER BY pv.effective_at DESC LIMIT 1`);
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'لا توجد سياسة فعالة' });
  const policy = result.rows[0];
  res.json({ success: true, data: policy, deadlines: { response_hours: policy.response_hours, appeal_hours: policy.appeal_hours, return_damage_hours: policy.return_damage_report_hours, evidence_retention_days: policy.evidence_retention_days, grace_period_minutes: policy.grace_period_minutes } });
}));

router.post('/accept', protect, asyncHandler(async (req, res, next) => {
  const { version, context_type = 'account', context_id = null } = req.body;
  if (!version || !['account', 'reservation', 'payment'].includes(context_type)) return next(new AppError('نسخة السياسة وسياق الموافقة مطلوبان', 400));
  const policy = await query(`SELECT id, version FROM policy_versions WHERE version = $1 AND status = 'effective'`, [version]);
  if (!policy.rows.length) return next(new AppError('نسخة السياسة غير متاحة للموافقة', 400));
  const result = await query(`INSERT INTO policy_acceptances (policy_version_id, user_id, account_type, context_type, context_id, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, accepted_at, context_type, context_id`, [policy.rows[0].id, req.user.id, req.user.role || req.user.account_type || 'user', context_type, context_id, req.ip || null, req.get('user-agent') || null]);
  res.status(201).json({ success: true, data: { ...result.rows[0], version } });
}));

router.get('/reservations/:reservationId', protect, asyncHandler(async (req, res, next) => {
  const access = await query(`SELECT customer_id, supplier_id FROM reservations WHERE id = $1`, [req.params.reservationId]);
  if (!access.rows.length) return next(new AppError('الحجز غير موجود', 404));
  const row = access.rows[0];
  if (req.user.role !== 'admin' && req.user.id !== row.customer_id && req.user.id !== row.supplier_id) return next(new AppError('غير مصرح لك', 403));
  const result = await query(`SELECT pa.id, pv.version, pv.title, pa.account_type, pa.context_type, pa.context_id, pa.accepted_at FROM policy_acceptances pa JOIN policy_versions pv ON pv.id = pa.policy_version_id WHERE pa.context_type = 'reservation' AND pa.context_id = $1 ORDER BY pa.accepted_at DESC`, [req.params.reservationId]);
  res.json({ success: true, data: result.rows });
}));

module.exports = router;
