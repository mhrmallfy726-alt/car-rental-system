const { sendEmail, generateOTP } = require("../services/emailService");
const bcrypt = require("bcryptjs");
const { query, pool }  = require("../config/database");

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();



const sendOTP = async (req, res) => {
  try {
    const { userData } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مطلوب" });
    }
    if (userData) userData.email = email;

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
      [email, otp, expiresAt, userData]
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
    console.error('OTP email sending failed:', error);
    if (res.internalCall) throw error;
    return res.status(502).json({
      success: false,
      message: "تعذر إرسال رمز التحقق عبر البريد الإلكتروني"
    });
  }
};
const resendOTP = async (req,res)=>{
    try {
    const { email, newEmail } = req.body;
    const targetEmail = normalizeEmail(newEmail || email);
    const sourceEmail = normalizeEmail(email);
    if (!sourceEmail || !targetEmail) {
      return res.status(400).json({ success: false, message: "البريد الإلكتروني مطلوب" });
    }
    if (newEmail && sourceEmail !== targetEmail) {
      const duplicate = await query(
        'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [targetEmail]
      );
      if (duplicate.rows.length > 0) {
        return res.status(409).json({ success: false, message: "البريد الإلكتروني مستخدم مسبقاً" });
      }
    }
   
    const newOTP = generateOTP();
   
    const updateResult = await query(
    `UPDATE email_verifications 
    SET otp=$1,
    attempts=0,
    expires_at=NOW() + INTERVAL '5 minutes',
    email=$2,
    user_data = CASE WHEN $3 <> email THEN jsonb_set(user_data::jsonb, '{email}', to_jsonb($2::text), true) ELSE user_data::jsonb END
    WHERE email=$4`,
    [
     newOTP,
     targetEmail,
     targetEmail,
     sourceEmail
    ]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "لا يوجد طلب تحقق لإعادة الإرسال" });
    }
   
   
    await sendEmail(
    targetEmail,
    "رمز التحقق الجديد",
    `<h2>${newOTP}</h2>`
    );
   
   
    res.json({
     success:true,
     message:"تم إرسال رمز جديد",
     email: targetEmail
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
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "البريد ورمز التحقق مطلوبان" });
    }
    try {
      const pendingVerification = await query(
        "SELECT attempts FROM email_verifications WHERE LOWER(email)=LOWER($1) ORDER BY created_at DESC LIMIT 1",
        [email]
      );
      if (pendingVerification.rows.length === 0) {
        return res.status(400).json({ success: false, message: "لا يوجد طلب تحقق" });
      }
      if (pendingVerification.rows[0].attempts >= 3) {
        return res.status(400).json({ success: false, message: "تم تجاوز عدد المحاولات، أعد إرسال رمز جديد" });
      }
      await query("UPDATE email_verifications SET attempts = attempts + 1 WHERE LOWER(email)=LOWER($1)", [email]);

      const result = await pool.query(
        `
        SELECT * FROM email_verifications
        WHERE LOWER(email) = LOWER($1)
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
      const userData = typeof verification.user_data === 'string'
        ? JSON.parse(verification.user_data)
        : verification.user_data;
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
 grace_period_hours,
 verification_status
)
VALUES (
 $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
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
 userData.commercial_register || userData.commercialRegister,
 userData.owner_id || userData.ownerId,
 userData.late_fee_price_per_hour,
 userData.grace_period_hours,
 userRole === 'supplier' ? 'pending' : 'approved'
]
);

// لا يحصل المورد على صلاحية الدخول قبل مراجعة الأدمن، ويُنشأ طلب ظاهر في لوحة الإدارة.
if (userRole === 'supplier') {
  try {
    const admins = await query("SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE");
    const io = req.app.get('io');
    for (const admin of admins.rows) {
      const notification = await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, action_url)
         VALUES ($1, $2, $3, 'system', $4, 'user', '/admin/supplier-requests')
         RETURNING *`,
        [admin.id, 'طلب تسجيل مورد جديد', `تم تسجيل المورد ${userData.name} ويحتاج إلى مراجعة واعتماد.`, newUser.rows[0].id]
      );
      if (io) io.to(`user_${admin.id}`).emit('new_notification', notification.rows[0]);
    }
  } catch (notificationError) {
    console.error('Failed to notify admins about supplier request:', notificationError);
  }
}
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
