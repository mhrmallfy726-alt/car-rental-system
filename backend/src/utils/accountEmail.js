const normalizeAccountEmail = (value) => String(value || '').trim().toLowerCase();

const findEmailOwner = async (email, query) => {
  const normalizedEmail = normalizeAccountEmail(email);
  if (!normalizedEmail) return null;

  // The registry is the authoritative cross-account lookup after its migration is applied.
  // The fallback keeps older environments functional until the migration is deployed.
  try {
    const registryResult = await query(
      'SELECT account_type, account_id FROM account_emails WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );
    if (registryResult.rows.length) {
      const owner = registryResult.rows[0];
      return { type: owner.account_type, id: owner.account_id };
    }
  } catch (error) {
    if (error && error.code !== '42P01') throw error;
  }

  const [userResult, employeeResult, branchAccountResult] = await Promise.all([
    query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]),
    query('SELECT id FROM employees WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]),
    query('SELECT id FROM branch_accounts WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]),
  ]);

  if (userResult.rows.length) return { type: 'user', id: userResult.rows[0].id };
  if (employeeResult.rows.length) return { type: 'employee', id: employeeResult.rows[0].id };
  if (branchAccountResult.rows.length) return { type: 'branch_account', id: branchAccountResult.rows[0].id };
  return null;
};

module.exports = { normalizeAccountEmail, findEmailOwner };
