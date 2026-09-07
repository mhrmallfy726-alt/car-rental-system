const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { query } = require('../config/database');

router.use(protect, authorize('admin'));

router.get('/settings', asyncHandler(async (req, res) => {
  const result = await query('SELECT monthly_price, annual_price, currency, enabled, updated_at FROM showroom_subscription_settings WHERE id=1');
  res.json({ success:true, data:result.rows[0] || {monthly_price:10,annual_price:100,currency:'YER',enabled:true} });
}));

router.put('/settings', asyncHandler(async (req, res, next) => {
  const monthly=Number(req.body.monthly_price), annual=Number(req.body.annual_price);
  const currency=String(req.body.currency||'YER').trim().toUpperCase();
  if(!Number.isFinite(monthly)||monthly<0) return next(new AppError('السعر الشهري غير صالح',400));
  if(!Number.isFinite(annual)||annual<0) return next(new AppError('السعر السنوي غير صالح',400));
  if(!/^[A-Z]{3,10}$/.test(currency)) return next(new AppError('العملة غير صالحة',400));
  const enabled=req.body.enabled===undefined?true:Boolean(req.body.enabled);
  const result=await query(`INSERT INTO showroom_subscription_settings(id,monthly_price,annual_price,currency,enabled,updated_by,updated_at)
    VALUES(1,$1,$2,$3,$4,$5,NOW()) ON CONFLICT(id) DO UPDATE SET monthly_price=EXCLUDED.monthly_price,annual_price=EXCLUDED.annual_price,currency=EXCLUDED.currency,enabled=EXCLUDED.enabled,updated_by=EXCLUDED.updated_by,updated_at=NOW()
    RETURNING monthly_price,annual_price,currency,enabled,updated_at`,[monthly,annual,currency,enabled,req.user.id]);
  res.json({success:true,data:result.rows[0],message:'تم تحديث أسعار اشتراكات المعارض'});
}));

router.get('/subscriptions', asyncHandler(async (req,res)=>{
  const result=await query(`SELECT ss.id,ss.plan,ss.amount,ss.currency,ss.status,ss.starts_at,ss.expires_at,ss.created_at,
    l.showroom_name,l.city,u.id AS supplier_id,u.name AS supplier_name,u.email AS supplier_email
    FROM showroom_subscriptions ss JOIN locations l ON l.id=ss.showroom_id JOIN users u ON u.id=ss.supplier_id
    ORDER BY ss.created_at DESC LIMIT 200`);
  res.json({success:true,data:result.rows});
}));

router.get('/requests', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT ss.id, ss.plan, ss.amount, ss.currency, ss.status, ss.approval_status,
           ss.starts_at, ss.expires_at, ss.created_at, ss.reviewed_at, ss.rejection_reason,
           l.id AS branch_id, l.showroom_name AS branch_name, l.city, l.country, l.address,
           l.latitude, l.longitude, l.is_active, l.subscription_status,
           u.id AS supplier_id, u.name AS supplier_name, u.email AS supplier_email,
           u.phone AS supplier_phone
    FROM showroom_subscriptions ss
    JOIN locations l ON l.id = ss.showroom_id
    JOIN users u ON u.id = ss.supplier_id
    ORDER BY CASE WHEN ss.approval_status = 'pending' THEN 0 ELSE 1 END, ss.created_at DESC
    LIMIT 300
  `);
  res.json({ success: true, data: result.rows });
}));

router.get('/requests/:id', asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT ss.*, l.id AS branch_id, l.showroom_name AS branch_name, l.city, l.country,
           l.address, l.latitude, l.longitude, l.is_active, l.subscription_status,
           u.id AS supplier_id, u.name AS supplier_name, u.email AS supplier_email,
           u.phone AS supplier_phone
    FROM showroom_subscriptions ss
    JOIN locations l ON l.id = ss.showroom_id
    JOIN users u ON u.id = ss.supplier_id
    WHERE ss.id = $1
  `, [req.params.id]);
  if (!result.rows[0]) return next(new AppError('طلب الفرع غير موجود', 404));
  res.json({ success: true, data: result.rows[0] });
}));

router.put('/requests/:id/approve', asyncHandler(async (req, res, next) => {
  const result = await query(`
    UPDATE showroom_subscriptions ss
    SET approval_status = 'approved', reviewed_by = $1, reviewed_at = NOW(),
        rejection_reason = NULL, updated_at = NOW()
    WHERE ss.id = $2 AND ss.approval_status = 'pending'
    RETURNING ss.id, ss.showroom_id, ss.supplier_id, ss.status
  `, [req.user.id, req.params.id]);
  const request = result.rows[0];
  if (!request) return next(new AppError('الطلب غير موجود أو تمت مراجعته مسبقاً', 409));
  const branch = await query(`
    UPDATE locations
    SET is_active = CASE WHEN $1 = 'paid' THEN TRUE ELSE FALSE END,
        subscription_status = CASE WHEN $1 = 'paid' THEN 'active' ELSE 'pending_payment' END,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, is_active, subscription_status
  `, [request.status, request.showroom_id]);
  await query(`
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تمت الموافقة على الفرع', 'تمت الموافقة على طلب الفرع ويمكنك استخدامه بعد إكمال الدفع إن لزم.', 'system', $2, 'showroom_subscription')
  `, [request.supplier_id, request.id]);
  res.json({ success: true, data: { request, branch: branch.rows[0] }, message: 'تمت الموافقة على الفرع' });
}));

router.put('/requests/:id/reject', asyncHandler(async (req, res, next) => {
  const reason = String(req.body.reason || '').trim();
  if (!reason) return next(new AppError('سبب رفض الفرع مطلوب', 400));
  const result = await query(`
    UPDATE showroom_subscriptions ss
    SET approval_status = 'rejected', reviewed_by = $1, reviewed_at = NOW(),
        rejection_reason = $2, updated_at = NOW()
    WHERE ss.id = $3 AND ss.approval_status = 'pending'
    RETURNING ss.id, ss.showroom_id, ss.supplier_id
  `, [req.user.id, reason, req.params.id]);
  const request = result.rows[0];
  if (!request) return next(new AppError('الطلب غير موجود أو تمت مراجعته مسبقاً', 409));
  await query(`UPDATE locations SET is_active = FALSE, subscription_status = 'suspended', updated_at = NOW() WHERE id = $1`, [request.showroom_id]);
  await query(`
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES ($1, 'تم رفض طلب الفرع', $2, 'system', $3, 'showroom_subscription')
  `, [request.supplier_id, `تم رفض طلب الفرع. السبب: ${reason}`, request.id]);
  res.json({ success: true, message: 'تم رفض طلب الفرع' });
}));

module.exports=router;
