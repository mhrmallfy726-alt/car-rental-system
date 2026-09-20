const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { query, pool } = require('../config/database');
const { hashPassword } = require('../utils/hash');
const { sendEmail, generateOTP } = require('../services/emailService');

const secret = () => process.env.JWT_SECRET || 'fallback_secret';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// Start branch-account creation by sending an OTP to the branch email.
router.post('/account', protect, authorize('supplier'), async (req, res) => {
  try {
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

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashed = await hashPassword(password);
    const pendingData = {
      account_type: 'branch_account',
      supplier_id: req.user.id,
      branch_id,
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
    };

    await query(
      `DELETE FROM email_verifications WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );
    await query(
      `INSERT INTO email_verifications (email, otp, expires_at, user_data)
       VALUES ($1, $2, $3, $4)`,
      [normalizedEmail, otp, expiresAt, pendingData]
    );

    await sendEmail(
      normalizedEmail,
      'رمز التحقق من حساب المعرض',
      `<h2>رمز التحقق من حساب المعرض</h2><h1>${otp}</h1><p>الرمز صالح لمدة 5 دقائق فقط.</p>`
    );

    return res.status(202).json({
      success: true,
      requiresVerification: true,
      email: normalizedEmail,
      message: 'تم إرسال رمز التحقق إلى بريد المعرض',
    });
  } catch (error) {
    console.error('Branch account OTP sending error:', error);
    return res.status(502).json({ success: false, message: 'تعذر إرسال رمز التحقق إلى بريد المعرض' });
  }
});

// Verify the OTP and create the branch account only after successful verification.
router.post('/account/verify-otp', protect, authorize('supplier'), async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();
    if (!email || !otp) return res.status(400).json({ success: false, message: 'البريد ورمز التحقق مطلوبان' });

    const verification = await query(
      `SELECT id, otp, attempts, expires_at, user_data
       FROM email_verifications
       WHERE LOWER(email) = $1
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (!verification.rows.length) return res.status(400).json({ success: false, message: 'لا يوجد طلب تحقق لهذا البريد' });

    const pending = verification.rows[0];
    if ((pending.attempts || 0) >= 3) return res.status(400).json({ success: false, message: 'تم تجاوز عدد المحاولات، أرسل رمزًا جديدًا' });
    if (new Date() > new Date(pending.expires_at)) return res.status(400).json({ success: false, message: 'انتهت صلاحية رمز التحقق' });

    await query('UPDATE email_verifications SET attempts = COALESCE(attempts, 0) + 1 WHERE id = $1', [pending.id]);
    if (String(pending.otp) !== otp) return res.status(400).json({ success: false, message: 'رمز التحقق غير صحيح' });

    const data = typeof pending.user_data === 'string' ? JSON.parse(pending.user_data) : pending.user_data;
    if (String(data.supplier_id) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'طلب التحقق لا يخص هذا المورد' });

    const existing = await query(
      `SELECT 1 FROM users WHERE LOWER(TRIM(email)) = $1
       UNION ALL SELECT 1 FROM employees WHERE LOWER(TRIM(email)) = $1
       UNION ALL SELECT 1 FROM branch_accounts WHERE LOWER(TRIM(email)) = $1`,
      [email]
    );
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' });

    const created = await query(
      `INSERT INTO branch_accounts (supplier_id, branch_id, name, email, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, supplier_id, branch_id, name, email, status, must_change_password, created_at`,
      [data.supplier_id, data.branch_id, data.name, email, data.password]
    );
    await query('DELETE FROM email_verifications WHERE id = $1', [pending.id]);
    return res.status(201).json({ success: true, data: created.rows[0], message: 'تم التحقق وإنشاء حساب المعرض بنجاح' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'يوجد حساب لهذا الفرع أو البريد مسبقاً' });
    console.error('Verify branch account OTP error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق وإنشاء حساب المعرض' });
  }
});

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
    if (account.status !== 'active' || account.branch_active === false || ['suspended', 'expired'].includes(account.subscription_status)) {
      return res.status(403).json({ success: false, message: 'حساب الفرع أو اشتراكه غير فعال' });
    }

    await query('UPDATE branch_accounts SET last_login_at = NOW() WHERE id = $1', [account.id]);
    const token = jwt.sign({
      id: account.id,
      account_type: 'branch',
      role: 'supplier',
      supplier_id: account.supplier_id,
      branch_id: account.branch_id,
    }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: account.id, account_type: 'branch', role: 'supplier', supplier_id: account.supplier_id,
        branch_id: account.branch_id, name: account.name, email: account.email,
        must_change_password: account.must_change_password,
        branch_name: account.showroom_name || account.city,
      },
    });
  } catch (error) {
    console.error('Branch login error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
