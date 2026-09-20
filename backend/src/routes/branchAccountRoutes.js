const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/hash');

const secret = () => process.env.JWT_SECRET || 'fallback_secret';

// Supplier creates one login account for an owned branch.
router.post('/account', protect, authorize('supplier'), async (req, res) => {
  try {
    const { branch_id, name, email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
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
      `SELECT 1 FROM users WHERE LOWER(email) = $1
       UNION ALL SELECT 1 FROM employees WHERE LOWER(email) = $1
       UNION ALL SELECT 1 FROM branch_accounts WHERE LOWER(email) = $1`,
      [normalizedEmail]
    );
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' });

    const created = await query(
      `INSERT INTO branch_accounts (supplier_id, branch_id, name, email, password)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, supplier_id, branch_id, name, email, status, must_change_password, created_at`,
      [req.user.id, branch_id, String(name).trim(), normalizedEmail, await hashPassword(password)]
    );
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'يوجد حساب لهذا الفرع أو البريد مسبقاً' });
    console.error('Create branch account error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
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
