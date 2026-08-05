// ملاحظة مهمة:
// هذه الوسيطة مفيدة إذا طبقت تسجيل دخول (login) خاص بالموظفين (employees) يعطي توكن
// يحتوي على employee_id. حالياً النظام الأصلي يستخدم users tokens.
// إن أردت تطبيق auth للموظفين، يمكنك إصدار JWT يحتوي employee_id ثم تستخدم الوسيطة التالية.

const { query } = require('../config/database');

const checkEmployeePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // نَفترض أن توكن الموظف مُفكوك وقد وضعنا employeeId في req.employeeId
      const employeeId = req.employeeId;
      if (!employeeId) return res.status(401).json({ success: false, message: 'Employee token missing' });

      const sql = `
        SELECT 1
        FROM employees_permissions ep
        JOIN permissions p ON ep.permission_id = p.id
        WHERE ep.employee_id = $1 AND p.name = $2
        LIMIT 1
      `;
      const result = await query(sql, [employeeId, permissionName]);
      if (result.rows.length === 0) return res.status(403).json({ success: false, message: 'لا تمتلك الصلاحية' });

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'خطأ في الخادم' });
    }
  };
};

module.exports = { checkEmployeePermission };