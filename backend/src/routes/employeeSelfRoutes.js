const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(protect);

const requireEmployee = (req, res, next) => {
  if (req.user?.account_type !== 'employee' || !req.employeeId) {
    return res.status(403).json({
      success: false,
      message: 'هذا المسار مخصص للموظفين فقط',
    });
  }
  next();
};

router.use(requireEmployee);

router.get('/me', async (req, res) => {
  const result = await query(
    `SELECT id, supplier_id, full_name, phone_number, email,
            role, status, created_at
     FROM employees
     WHERE id = $1`,
    [req.employeeId]
  );

  res.json({ success: true, data: result.rows[0] || null });
});

router.get('/me/permissions', async (req, res) => {
  const result = await query(
    `SELECT p.id, p.name, p.description
     FROM employees_permissions ep
     JOIN permissions p ON p.id = ep.permission_id
     WHERE ep.employee_id = $1
     ORDER BY p.name`,
    [req.employeeId]
  );

  res.json({ success: true, data: result.rows });
});

module.exports = router;
