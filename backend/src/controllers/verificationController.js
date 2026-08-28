const { sendEmail, generateOTP } = require("../services/emailService");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { query } = require("../config/database");


const sendOTP = async (req, res) => {
  try {
    const { email, userData } = req.body;

    // إنشاء رمز OTP
    const otp = generateOTP();

    // وقت انتهاء الرمز (5 دقائق)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // حفظ الرمز في قاعدة البيانات
    await pool.query(
      `
      INSERT INTO email_verifications 
      (email, otp, expires_at, user_data)
      VALUES ($1, $2, $3, $4)
      `,
      [email, otp, expiresAt,userData]
    );

    // إرسال الرمز للبريد
    await sendEmail(
      email,
      "رمز التحقق من الحساب",
      `
      <h2>رمز التحقق</h2>
      <h1>${otp}</h1>
      <p>الرمز صالح لمدة 5 دقائق فقط.</p>
      `
    );

    res.json({
      success: true,
      message: "تم إرسال رمز التحقق إلى البريد الإلكتروني"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال رمز التحقق"
    });
  }
};
const resendOTP = async (req,res)=>{
    try {
   
    const {email}=req.body;
   
    const newOTP = generateOTP();
   
    await query(
    `UPDATE email_verifications 
    SET otp=$1,
    attempts=0,
    last_sent_at=NOW()
    WHERE email=$2`,
    [
     newOTP,
     email
    ]
    );
   
   
    await sendEmail(
    email,
    "رمز التحقق الجديد",
    `<h2>${newOTP}</h2>`
    );
   
   
    res.json({
     success:true,
     message:"تم إرسال رمز جديد"
    });
   
   
    }catch(error){
    console.log(error);
   
    res.status(500).json({
    success:false,
    message:"فشل إعادة الإرسال"
    });
   
    }
   
   };
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    const verification = await query(
        "SELECT * FROM email_verifications WHERE email=$1",
        [email]
      );
      
      if (verification.rows.length === 0) {
        return res.status(400).json({
          success:false,
          message:"لا يوجد طلب تحقق"
        });
      }
      
      if (verification.rows[0].attempts >= 3) {
        return res.status(400).json({
          success:false,
          message:"تم تجاوز عدد المحاولات، أعد إرسال رمز جديد"
        });
      }
      await query(
        "UPDATE email_verifications SET attempts = attempts + 1 WHERE email=$1",
        [email]
      );
    try {
      const { email, otp } = req.body;
  
      const result = await pool.query(
        `
        SELECT * FROM email_verifications
        WHERE email = $1
        AND otp = $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [email, otp]
      );
  
      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "رمز التحقق غير صحيح"
        });
      }
  
      const verification = result.rows[0];
      const userData = verification.user_data;
      if (new Date() > new Date(verification.expires_at)) {
        return res.status(400).json({
          success: false,
          message: "انتهت صلاحية رمز التحقق"
        });
      }
    // تشفير كلمة المرور
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(userData.password, salt);

// تحديد نوع المستخدم
const userRole = userData.role === "supplier"
  ? "supplier"
  : "customer";

const newUser = await query(
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
 userData.name,
 userData.email,
 hashedPassword,
 userRole,
 userData.phone,
 userData.company_name,
 userData.city,
 userData.address,
 userData.avatar,
 userData.commercial_register,
 userData.owner_id,
 userData.late_fee_price_per_hour,
 userData.grace_period_hours
]
);
await query(
    "DELETE FROM email_verifications WHERE id = $1",
    [verification.id]
  );
  
  return res.json({
    success: true,
    message: "تم إنشاء الحساب بنجاح",
    user: newUser.rows[0]
  });
    } catch (error) {
      console.error(error);
  
      res.status(500).json({
        success: false,
        message: "حدث خطأ أثناء التحقق"
      });
    }
  };
module.exports = {
    sendOTP,
    verifyOTP,
     resendOTP
  };