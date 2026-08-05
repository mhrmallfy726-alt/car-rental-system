const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { query, getClient } = require('../config/database');
const { hashPassword } = require('../utils/hash');
const employeeRoutes =require('../controllers/employeeController');
const { app } = require('../../server');
// const employeeRoutes = require('../../src/routes/');

// app.use('/api/employees', employeeRoutes);
// ========================
// Helpers
// ========================
const ensureSupplierScope = (reqSupplierId, reqUser) => {
  // عندما يكون المستخدم موردًا، تأكد أنه يتعامل فقط مع المورد الخاص به
  if (reqUser.role === 'supplier' && reqUser.id !== String(reqSupplierId)) {
    return false;
  }
  return true;
};

// حماية الراوتات: جميعها تتطلب تسجيل دخول ودور supplier أو admin
router.use(protect);
router.use(authorize('supplier', 'admin'));

// GET /api/employees?supplier_id=...
router.get('/', async (req, res) => {
  try {
    const supplier_id = req.query.supplier_id;
    if (!supplier_id) return res.status(400).json({ success: false, message: 'supplier_id مطلوب' });

    if (!ensureSupplierScope(supplier_id, req.user)) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const result = await query(
      'SELECT id, full_name, phone_number, email, role, status, supplier_id, created_at FROM employees WHERE supplier_id = $1 ORDER BY created_at DESC',
      [supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});
// GET /api/employees/permissions/list
router.get('/permissions/list', async (req, res) => {
  try {
    const result = await query('SELECT id, name, description FROM permissions ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});
// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query('SELECT id, full_name, phone_number, email, role, status, supplier_id, created_at FROM employees WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const emp = result.rows[0];
    if (!ensureSupplierScope(emp.supplier_id, req.user)) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    res.json({ success: true, data: emp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// POST /api/employees
// body: { full_name, phone_number, email, password, role, supplier_id }
router.post('/', async (req, res) => {
  try {
    const { full_name, phone_number, email, password, role, supplier_id } = req.body;
    if (!full_name || !email || !password || !supplier_id) {
      return res.status(400).json({ success: false, message: 'الحقول المطلوبة ناقصة' });
    }

    if (!ensureSupplierScope(supplier_id, req.user)) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const exists = await query('SELECT id FROM employees WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'الإيميل مستخدم بالفعل' });
    }

    const hashed = await hashPassword(password);
    const insert = await query(
      `INSERT INTO employees (full_name, phone_number, email, password, role, supplier_id) 
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, full_name, email, role, supplier_id, status, created_at`,
      [full_name, phone_number || null, email, hashed, role || 'staff', supplier_id]
    );

    res.status(201).json({ success: true, data: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/employees/:id
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { full_name, phone_number, role, status } = req.body;

    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const sets = [];
    const vals = [];
    let idx = 1;
    if (full_name) { sets.push(`full_name = $${idx++}`); vals.push(full_name); }
    if (phone_number) { sets.push(`phone_number = $${idx++}`); vals.push(phone_number); }
    if (role) { sets.push(`role = $${idx++}`); vals.push(role); }
    if (status) { sets.push(`status = $${idx++}`); vals.push(status); }

    if (sets.length === 0) return res.status(400).json({ success: false, message: 'لا حقول للتحديث' });

    vals.push(id);
    const sql = `UPDATE employees SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, full_name, email, role, status, supplier_id, created_at`;
    const updated = await query(sql, vals);
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });
    if (req.user.id === id) {
      return res.status(400).json({
          success:false,
          message:"لا يمكنك حذف نفسك"
      });
  }
    await query('DELETE FROM employees WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/employees/:id/permissions
router.get('/:id/permissions', async (req, res) => {
  try {
    const id = req.params.id;
    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const result = await query(
      `SELECT p.id, p.name, p.description
       FROM employees_permissions ep
       JOIN permissions p ON ep.permission_id = p.id
       WHERE ep.employee_id = $1`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// PUT /api/employees/:id/permissions    body: { permission_ids: [1,2,3] }
router.put('/:id/permissions', async (req, res) => {
  const client = await getClient();
  try {
    const id = req.params.id;
    const { permission_ids } = req.body;
    if (!Array.isArray(permission_ids)) return res.status(400).json({ success: false, message: 'permission_ids يجب أن تكون مصفوفة' });

    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    await client.query('BEGIN');
    await client.query('DELETE FROM employees_permissions WHERE employee_id = $1', [id]);

    for (const pid of permission_ids) {
      await client.query('INSERT INTO employees_permissions (employee_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, pid]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تحديث الصلاحيات' });
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});



module.exports = router;