const { query } = require('../config/database');

const getSupplierRequests = async (req, res) => {
  try {
    const result = await query(`
SELECT
    id,
    company_name,
    name,
    email,
    phone,
    city,
    address,
    late_fee_price_per_hour,
    grace_period_hours,
    avatar,
    brand_logo,
    commercial_register,
    owner_id,
    verification_status,
    created_at
FROM users
WHERE role='supplier'
AND verification_status='pending'
ORDER BY created_at DESC
`);

    res.json({
      success: true,
      requests: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الطلبات'
    });
  }
};

const approveSupplier = async (req, res) => {
  try {
    const result = await query(`
      UPDATE users
      SET verification_status='approved',
          is_verified=TRUE,
          rejection_reason=NULL
      WHERE id=$1 AND role='supplier'
      RETURNING id, name, email, verification_status
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'طلب المورد غير موجود' });

    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, 'system', $4, 'user')`,
      [req.params.id, 'تم اعتماد حساب المورد', 'تمت الموافقة على طلب تسجيلك ويمكنك الآن تسجيل الدخول.', req.params.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch(err){
    console.error(err);

    res.status(500).json({
      success:false
    });
  }
};

const rejectSupplier = async (req,res)=>{

  try{

    const {reason}=req.body;

    const result = await query(`
      UPDATE users
      SET verification_status='rejected',
          rejection_reason=$1
      WHERE id=$2 AND role='supplier'
      RETURNING id, name, email, verification_status, rejection_reason
    `, [reason, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'طلب المورد غير موجود' });

    await query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
       VALUES ($1, $2, $3, 'system', $4, 'user')`,
      [req.params.id, 'تم رفض طلب المورد', reason ? `تم رفض طلب تسجيلك. السبب: ${reason}` : 'تم رفض طلب تسجيلك. يرجى التواصل مع الإدارة.', req.params.id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      success:false
    });

  }

};

module.exports={
  getSupplierRequests,
  approveSupplier,
  rejectSupplier
};
