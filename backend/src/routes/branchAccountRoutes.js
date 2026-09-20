const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/hash');
const { sendEmail, generateOTP } = require('../services/emailService');

const secret = () => process.env.JWT_SECRET || 'fallback_secret';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const createBranchToken = (account, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => jwt.sign({
  id: account.id,
  account_type: 'branch',
  role: 'supplier',
  supplier_id: account.supplier_id,
  branch_id: account.branch_id,
}, secret(), { expiresIn });

const createPendingToken = (account, purpose = 'branch-onboarding-verification') => jwt.sign({
  id: account.id,
  account_type: 'branch',
  purpose,
}, secret(), { expiresIn: '15m' });

const readPendingToken = (req, purpose) => {
  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret());
    if (payload.account_type !== 'branch' || payload.purpose !== purpose) return null;
    return payload;
  } catch (_) {
    return null;
  }
};

// The supplier creates the branch account immediately. No OTP is sent here.
router.post('/account', protect, authorize('supplier'), async (req, res) => {
  try {
    // إنشاء حسابات المعارض مسموح فقط للمورد الذي وافق عليه الأدمن.
    if (req.user.is_verified !== true) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك إنشاء حساب للمعرض قبل موافقة الأدمن على حساب المورد',
      });
    }

    const { branch_id, name, email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!branch_id || !name || !normalizedEmail || !password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'بيانات الفرع والبريد وكلمة المرور (8 أحرف على الأقل) مطلوبة' });
    }

    const branch = await query(
      `SELECT id FROM locations
       WHERE id = $1 AND supplier_id = $2
         AND COALESCE(is_active, TRUE) = TRUE
         AND COALESCE(subscription_status, 'active') = 'active'`,
      [branch_id, req.user.id]
    );
    if (!branch.rows.length) return res.status(403).json({ success: false, message: 'الفرع غير تابع للمورد أو غير نشط' });

    const existing = await query(
      `SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1
       UNION ALL SELECT 1 FROM employees WHERE LOWER(TRIM(email)) = $1
       UNION ALL SELECT 1 FROM branch_accounts WHERE LOWER(TRIM(email)) = $1`,
      [normalizedEmail]
    );
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' });

    const hashed = await hashPassword(password);
    const created = await query(
      `INSERT INTO branch_accounts
         (supplier_id, branch_id, name, email, password, status, must_change_password)
       VALUES ($1, $2, $3, $4, $5, 'pending', TRUE)
       RETURNING id, supplier_id, branch_id, name, email, status, must_change_password, created_at`,
      [req.user.id, branch_id, String(name).trim(), normalizedEmail, hashed]
    );

    return res.status(201).json({
      success: true,
      data: created.rows[0],
      message: 'تم إنشاء حساب المعرض. سيُطلب التحقق عند أول تسجيل دخول.',
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً أو الحساب موجود بالفعل' });
    console.error('Branch account creation error:', error);
    return res.status(500).json({ success: false, message: 'تعذر إنشاء حساب المعرض' });
  }
});

// First login for a pending branch account returns a short-lived verification token.
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });

    const result = await query(
      `SELECT ba.*, l.showroom_name, l.city, l.subscription_status, l.is_active AS branch_active
       FROM branch_accounts ba JOIN locations l ON l.id = ba.branch_id
       WHERE LOWER(ba.email) = $1 LIMIT 1`,
      [email]
    );
    const account = result.rows[0];
    if (!account || !(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }
    if (account.branch_active === false || ['suspended', 'expired'].includes(account.subscription_status)) {
      return res.status(403).json({ success: false, message: 'حساب الفرع أو اشتراكه غير فعال' });
    }

    // الحساب pending يحتاج تحقق البريد. أما الحساب active الذي ما زال
    // يفرض تغيير كلمة المرور فينتقل مباشرة إلى مرحلة كلمة المرور دون OTP جديد.
    if (account.status !== 'active') {
      return res.status(200).json({
        success: false,
        requiresVerification: true,
        verificationToken: createPendingToken(account, 'branch-email-verification'),
        user: { id: account.id, account_type: 'branch', name: account.name, email: account.email, branch_id: account.branch_id },
        onboarding_stage: 'email_verification',
        message: 'يرجى إكمال التحقق من البريد لإتمام تفعيل الحساب',
      });
    }

    if (account.must_change_password) {
      return res.status(200).json({
        success: false,
        requiresPasswordChange: true,
        passwordChangeToken: createPendingToken(account, 'branch-password-change'),
        user: { id: account.id, account_type: 'branch', name: account.name, email: account.email, branch_id: account.branch_id },
        onboarding_stage: 'password_change',
        message: 'تم التحقق من البريد. يرجى تعيين كلمة مرور جديدة',
      });
    }

    await query('UPDATE branch_accounts SET last_login_at = NOW() WHERE id = $1', [account.id]);
    return res.json({
      success: true,
      token: createBranchToken(account),
      user: {
        id: account.id, account_type: 'branch', role: 'supplier', supplier_id: account.supplier_id,
        branch_id: account.branch_id, name: account.name, email: account.email,
        must_change_password: account.must_change_password,
        branch_name: account.showroom_name || account.city,
      },
    });
  } catch (error) {
    console.error('Branch login error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// Send OTP only after the pending account has successfully logged in.
router.post('/verification/send-otp', async (req, res) => {
  try {
    const pending = readPendingToken(req, 'branch-email-verification');
    if (!pending) return res.status(401).json({ success: false, message: 'جلسة التحقق غير صالحة أو منتهية' });

    const result = await query(`SELECT id, email, name, status FROM branch_accounts WHERE id = $1 LIMIT 1`, [pending.id]);
    const account = result.rows[0];
    if (!account) return res.status(404).json({ success: false, message: 'حساب المعرض غير موجود' });
    if (account.status === 'active') return res.status(400).json({ success: false, message: 'الحساب مفعّل بالفعل' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await query('DELETE FROM email_verifications WHERE LOWER(email) = $1', [account.email]);
    await query(`INSERT INTO email_verifications (email, otp, expires_at, user_data) VALUES ($1, $2, $3, $4)`, [account.email, otp, expiresAt, { account_type: 'branch_account', account_id: account.id }]);
    await sendEmail(account.email, 'رمز التحقق لتفعيل حساب المعرض', `<h2>مرحباً ${account.name || ''}</h2><p>رمز التحقق الخاص بتفعيل حساب المعرض هو:</p><h1>${otp}</h1><p>الرمز صالح لمدة 5 دقائق فقط.</p>`);
    return res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
  } catch (error) {
    console.error('Branch verification OTP sending error:', error);
    return res.status(502).json({ success: false, message: 'تعذر إرسال رمز التحقق' });
  }
});

// Verify OTP, activate the account, and issue the normal branch session.
router.post('/verification/verify-otp', async (req, res) => {
  try {
    const pending = readPendingToken(req);
    const otp = String(req.body?.otp || '').trim();
    if (!pending || !otp) return res.status(400).json({ success: false, message: 'جلسة التحقق ورمز OTP مطلوبان' });

    const verification = await query(`SELECT id, otp, attempts, expires_at, user_data FROM email_verifications WHERE LOWER(email) = (SELECT LOWER(email) FROM branch_accounts WHERE id = $1) ORDER BY created_at DESC LIMIT 1`, [pending.id]);
    if (!verification.rows.length) return res.status(400).json({ success: false, message: 'لا يوجد رمز تحقق. اطلب رمزاً جديداً' });
    const item = verification.rows[0];
    if ((item.attempts || 0) >= 3) return res.status(400).json({ success: false, message: 'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً' });
    if (new Date() > new Date(item.expires_at)) return res.status(400).json({ success: false, message: 'انتهت صلاحية رمز التحقق' });

    await query('UPDATE email_verifications SET attempts = COALESCE(attempts, 0) + 1 WHERE id = $1', [item.id]);
    if (String(item.otp) !== otp) return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });

    const updated = await query(`UPDATE branch_accounts SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id, supplier_id, branch_id, name, email, status, must_change_password`, [pending.id]);
    if (!updated.rows.length) return res.status(404).json({ success: false, message: 'حساب الفرع غير موجود' });
    await query('DELETE FROM email_verifications WHERE id = $1', [item.id]);

    const account = updated.rows[0];
    return res.json({ success: true, requiresPasswordChange: true, passwordChangeToken: createPendingToken(account, 'branch-password-change'), user: { ...account, account_type: 'branch', role: 'supplier', onboarding_stage: 'password_change' }, message: 'تم التحقق من البريد. أنشئ كلمة مرور جديدة للمتابعة.' });
  } catch (error) {
    console.error('Branch verification OTP error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق من الرمز' });
  }
});

module.exports = router;


// Complete first-login onboarding: only the short-lived password-change token can call this route.
router.post('/password/change-first-login', async (req, res) => {
  try {
    const pending = readPendingToken(req, 'branch-password-change');
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s])[\\x21-\\x7E]{10,72}$/.test(String(value || ''));
    if (!pending) return res.status(401).json({ success: false, message: 'جلسة تغيير كلمة المرور غير صالحة أو منتهية' });
    if (!isStrongPassword(password)) return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'كلمتا المرور غير متطابقتين' });
    const accountResult = await query('SELECT ba.*, l.showroom_name, l.city, l.subscription_status, l.is_active AS branch_active FROM branch_accounts ba JOIN locations l ON l.id = ba.branch_id WHERE ba.id = $1 LIMIT 1', [pending.id]);
    const account = accountResult.rows[0];
    if (!account) return res.status(404).json({ success: false, message: 'حساب الفرع غير موجود' });
    if (account.status !== 'active') return res.status(403).json({ success: false, message: 'يجب التحقق من البريد الإلكتروني أولاً' });
    if (!account.must_change_password) return res.status(400).json({ success: false, message: 'لا يوجد تغيير أولي لكلمة المرور مطلوب لهذا الحساب' });
    if (account.branch_active === false || ['suspended', 'expired'].includes(account.subscription_status)) return res.status(403).json({ success: false, message: 'حساب الفرع أو اشتراكه غير فعال' });
    const hashed = await hashPassword(password);
    const updated = await query('UPDATE branch_accounts SET password = $1, must_change_password = FALSE, last_login_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING id, supplier_id, branch_id, name, email, status, must_change_password', [hashed, account.id]);
    const finalAccount = { ...updated.rows[0], showroom_name: account.showroom_name, city: account.city };
    return res.json({ success: true, token: createBranchToken(finalAccount), user: { ...finalAccount, account_type: 'branch', role: 'supplier', onboarding_stage: 'complete' }, message: 'تم تفعيل حساب الفرع وتعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Branch first-login password change error:', error);
    return res.status(500).json({ success: false, message: 'تعذر تعيين كلمة المرور الجديدة' });
  }
});
