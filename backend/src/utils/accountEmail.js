const normalizeAccountEmail = (value) => String(value || '').trim().toLowerCase();

const findEmailOwner = async (email, query) => {
  const normalizedEmail = normalizeAccountEmail(email);
  if (!normalizedEmail) return null;

  const [userResult, employeeResult] = await Promise.all([
    query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]),
    query('SELECT id FROM employees WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]),
  ]);

  if (userResult.rows.length) return { type: 'user', id: userResult.rows[0].id };
  if (employeeResult.rows.length) return { type: 'employee', id: employeeResult.rows[0].id };
  return null;
};

module.exports = { normalizeAccountEmail, findEmailOwner };
