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

    await query(`
      UPDATE users
      SET verification_status='approved',
          rejection_reason=NULL
      WHERE id=$1
    `,[req.params.id]);

    res.json({
      success:true
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

    await query(`
      UPDATE users
      SET verification_status='rejected',
          rejection_reason=$1
      WHERE id=$2
    `,[reason,req.params.id]);

    res.json({
      success:true
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