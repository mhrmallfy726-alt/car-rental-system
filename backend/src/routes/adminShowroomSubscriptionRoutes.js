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

module.exports=router;
