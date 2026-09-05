const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { query, getClient } = require('../config/database');
const { hashPassword } = require('../utils/hash');

const getAuthenticatedSupplierId = (reqUser) => {
  if (reqUser?.role !== 'supplier') return null;
  return String(reqUser.supplier_id || reqUser.id || '');
};

const ensureSupplierScope = (reqSupplierId, reqUser) => {
  const authenticatedSupplierId = getAuthenticatedSupplierId(reqUser);
  if (authenticatedSupplierId && authenticatedSupplierId !== String(reqSupplierId)) return false;
  return true;
};

const JOB_ROLES = {
  team_manager: 'مدير فريق',
  advertisements: 'موظف إدارة الإعلانات والأداء',
  reservations: 'موظف إدارة الحجوزات',
  finance: 'موظف الإدارة المالية',
  fleet: 'موظف إدارة أسطول السيارات',
  delivery: 'موظف توصيل واستلام السيارات',
};

const defaultPermissionNamesByJobRole = {
  team_manager: [
    'view_cars', 'manage_cars', 'view_fleet_performance',
    'view_reservations', 'manage_reservations', 'view_customers',
    'view_advertisements', 'manage_advertisements', 'view_ad_performance',
    'view_finance', 'manage_finance', 'manage_team', 'view_team_performance',
    'view_handover', 'manage_handover'
  ],
  advertisements: ['view_advertisements', 'manage_advertisements', 'view_ad_performance'],
  reservations: ['view_reservations', 'manage_reservations', 'view_customers'],
  finance: ['view_finance', 'manage_finance'],
  fleet: ['view_cars', 'manage_cars', 'view_fleet_performance'],
  delivery: ['view_reservations', 'view_customers', 'view_handover', 'manage_handover'],
};

const resetPermissionsForJobRole = async (employeeId, jobRole) => {
  const names = defaultPermissionNamesByJobRole[jobRole] || [];
  const permissions = await query('SELECT id FROM permissions WHERE name = ANY($1::text[])', [names]);
  await query('DELETE FROM employees_permissions WHERE employee_id = $1', [employeeId]);
  for (const permission of permissions.rows) {
    await query(
      'INSERT INTO employees_permissions (employee_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [employeeId, permission.id]
    );
  }
  return permissions.rows.map((permission) => permission.id);
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'البريد الإلكتروني وكلمة المرور مطلوبان' });

    const result = await query('SELECT * FROM employees WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    const employee = result.rows[0];
    const normalizedEmployeeStatus = String(employee.status || '').trim().toLowerCase();
    if (normalizedEmployeeStatus !== 'active') return res.status(403).json({ success: false, message: 'حساب الموظف موقوف حالياً' });

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    await query('UPDATE employees SET is_online = TRUE, last_active_at = NOW() WHERE id = $1', [employee.id]);

    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({
      id: employee.id,
      employee_id: employee.id,
      account_type: 'employee',
      role: 'employee',
      job_role: employee.job_role || 'fleet',
      supplier_id: employee.supplier_id
    }, secret, { expiresIn: '7d' });

    const jobRole = JOB_ROLES[employee.job_role] ? employee.job_role : 'fleet';
    res.json({
      success: true,
      token,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
        phone_number: employee.phone_number,
        role: employee.role,
        job_role: jobRole,
        job_role_label: JOB_ROLES[jobRole],
        supplier_id: employee.supplier_id,
        must_change_password: employee.must_change_password,
        is_online: true,
        is_accepting_orders: employee.is_accepting_orders,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.use(protect);

router.put('/change-password', async (req, res) => {
  try {
    if (req.user.account_type !== 'employee') return res.status(403).json({ success: false, message: 'غير مصرح' });
    const { current_password, new_password, confirm_password } = req.body;
    if (!new_password || !confirm_password) return res.status(400).json({ success: false, message: 'يرجى إدخال وتأكيد كلمة المرور الجديدة' });
    if (new_password.length < 8) return res.status(400).json({ success: false, message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
    if (new_password !== confirm_password) return res.status(400).json({ success: false, message: 'كلمات المرور الجديدة غير متطابقة' });

    const found = await query('SELECT * FROM employees WHERE id = $1', [req.user.id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const emp = found.rows[0];

    if (current_password && !emp.must_change_password) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(current_password, emp.password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const hashed = await hashPassword(new_password);
    const updated = await query(
      'UPDATE employees SET password = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, job_role, must_change_password',
      [hashed, req.user.id]
    );
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح', data: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.put('/status', async (req, res) => {
  try {
    if (req.user.account_type !== 'employee') return res.status(403).json({ success: false, message: 'غير مصرح' });
    const { is_accepting_orders } = req.body;
    const updated = await query(
      'UPDATE employees SET is_accepting_orders = $1, is_online = TRUE, last_active_at = NOW() WHERE id = $2 RETURNING id, is_online, is_accepting_orders',
      [!!is_accepting_orders, req.user.id]
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.use(authorize('supplier', 'admin'));

router.get('/', async (req, res) => {
  try {
    const supplier_id = req.user.role === 'supplier'
      ? getAuthenticatedSupplierId(req.user)
      : (req.query.supplier_id ? String(req.query.supplier_id) : null);
    if (!supplier_id) return res.status(400).json({ success: false, message: 'supplier_id مطلوب للأدمن عند اختيار المورد' });
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const result = await query(
      'SELECT id, full_name, phone_number, email, role, job_role, status, supplier_id, must_change_password, is_online, is_accepting_orders, last_active_at, created_at FROM employees WHERE supplier_id = $1 ORDER BY created_at DESC',
      [supplier_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.get('/permissions/list', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, description,
             CASE WHEN name LIKE 'manage_%' THEN 'manage' ELSE 'view' END AS access_level,
             CASE WHEN name LIKE 'manage_%' THEN 'إدارة وتنفيذ' ELSE 'عرض واطلاع' END AS access_label
      FROM permissions ORDER BY id
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await query('SELECT id, full_name, phone_number, email, role, job_role, status, supplier_id, must_change_password, is_online, is_accepting_orders, last_active_at, created_at FROM employees WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const emp = result.rows[0];
    if (!ensureSupplierScope(emp.supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });
    res.json({ success: true, data: emp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { full_name, phone_number, email, password, role, job_role, permission_ids } = req.body;
    const supplier_id = req.user.role === 'supplier'
      ? getAuthenticatedSupplierId(req.user)
      : (req.body.supplier_id ? String(req.body.supplier_id) : null);
    if (!full_name || !email || !password || !supplier_id) return res.status(400).json({ success: false, message: 'الاسم والبريد وكلمة المرور والمورد مطلوبة' });
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const exists = await query('SELECT id FROM employees WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ success: false, message: 'الإيميل مستخدم بالفعل' });

    const normalizedJobRole = Object.prototype.hasOwnProperty.call(JOB_ROLES, job_role) ? job_role : null;
    if (!normalizedJobRole) return res.status(400).json({ success: false, message: 'يجب اختيار الوظيفة التخصصية للموظف' });

    // Technical role is kept only for authentication/backward compatibility.
    const technicalRole = normalizedJobRole === 'team_manager' ? 'manager' : 'employee';
    const hashed = await hashPassword(password);

    const insert = await query(
      `INSERT INTO employees (full_name, phone_number, email, password, role, job_role, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, full_name, email, role, job_role, supplier_id, status, created_at`,
      [full_name, phone_number || null, email, hashed, technicalRole, normalizedJobRole, supplier_id]
    );

    const requestedPermissionIds = Array.isArray(permission_ids)
      ? [...new Set(permission_ids.filter((id) => Number.isInteger(Number(id))).map(Number))]
      : [];
    let selectedPermissionIds = requestedPermissionIds;

    if (selectedPermissionIds.length === 0) {
      const defaultNames = defaultPermissionNamesByJobRole[normalizedJobRole];
      const defaultPermissions = await query('SELECT id FROM permissions WHERE name = ANY($1::text[])', [defaultNames]);
      selectedPermissionIds = defaultPermissions.rows.map((permission) => permission.id);
    } else {
      const validPermissions = await query('SELECT id FROM permissions WHERE id = ANY($1::int[])', [selectedPermissionIds]);
      const validIds = new Set(validPermissions.rows.map((permission) => permission.id));
      if (selectedPermissionIds.some((permissionId) => !validIds.has(permissionId))) return res.status(400).json({ success: false, message: 'توجد صلاحية غير صالحة في الطلب' });
    }

    for (const permissionId of selectedPermissionIds) {
      await query('INSERT INTO employees_permissions (employee_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [insert.rows[0].id, permissionId]);
    }

    res.status(201).json({ success: true, data: insert.rows[0], permission_ids: selectedPermissionIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { full_name, phone_number, job_role, status } = req.body;
    if (job_role !== undefined && !Object.prototype.hasOwnProperty.call(JOB_ROLES, job_role)) return res.status(400).json({ success: false, message: 'الوظيفة التخصصية غير صالحة' });

    const normalizedStatus = status === undefined ? undefined : String(status).trim().toLowerCase();
    if (normalizedStatus !== undefined && !['active', 'inactive'].includes(normalizedStatus)) return res.status(400).json({ success: false, message: 'حالة الموظف غير صالحة' });

    const found = await query('SELECT supplier_id, job_role FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const sets = [];
    const vals = [];
    let idx = 1;
    if (full_name !== undefined) { sets.push(`full_name = $${idx++}`); vals.push(full_name); }
    if (phone_number !== undefined) { sets.push(`phone_number = $${idx++}`); vals.push(phone_number || null); }
    if (job_role !== undefined) { sets.push(`job_role = $${idx++}`); vals.push(job_role); }
    if (normalizedStatus !== undefined) { sets.push(`status = $${idx++}`); vals.push(normalizedStatus); }

    if (sets.length === 0) return res.status(400).json({ success: false, message: 'لا حقول للتحديث' });

    vals.push(id);
    const sql = `UPDATE employees SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, full_name, email, role, job_role, status, supplier_id, created_at`;
    const updated = await query(sql, vals);
    let permissionIds;
    if (job_role !== undefined && job_role !== found.rows[0].job_role) {
      permissionIds = await resetPermissionsForJobRole(id, job_role);
    }
    res.json({ success: true, data: updated.rows[0], permission_ids: permissionIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });
    if (req.user.id === id) return res.status(400).json({ success: false, message: 'لا يمكنك حذف نفسك' });
    await query('DELETE FROM employees WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

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

router.put('/:id/permissions', async (req, res) => {
  const client = await getClient();
  try {
    const id = req.params.id;
    const { permission_ids } = req.body;
    if (!Array.isArray(permission_ids) || permission_ids.some((permissionId) => !Number.isInteger(Number(permissionId)))) return res.status(400).json({ success: false, message: 'permission_ids يجب أن تكون مصفوفة من أرقام صحيحة' });
    const normalizedPermissionIds = [...new Set(permission_ids.map(Number))];

    const found = await query('SELECT supplier_id FROM employees WHERE id = $1', [id]);
    if (found.rows.length === 0) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    const supplier_id = found.rows[0].supplier_id;
    if (!ensureSupplierScope(supplier_id, req.user)) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const validPermissions = normalizedPermissionIds.length
      ? await query('SELECT id FROM permissions WHERE id = ANY($1::int[])', [normalizedPermissionIds])
      : { rows: [] };
    const validIds = new Set(validPermissions.rows.map((permission) => permission.id));
    if (normalizedPermissionIds.some((permissionId) => !validIds.has(permissionId))) return res.status(400).json({ success: false, message: 'توجد صلاحية غير صالحة في الطلب' });

    await client.query('BEGIN');
    await client.query('DELETE FROM employees_permissions WHERE employee_id = $1', [id]);
    for (const pid of normalizedPermissionIds) {
      await client.query('INSERT INTO employees_permissions (employee_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, pid]);
    }
    await client.query('COMMIT');
    res.json({ success: true, message: 'تم تحديث الصلاحيات' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  } finally {
    client.release();
  }
});

module.exports = router;
