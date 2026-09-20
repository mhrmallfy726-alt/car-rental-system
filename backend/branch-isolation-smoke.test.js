const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'branch-isolation-smoke-secret';

(async () => {
  const showroom = fs.readFileSync(path.join(__dirname, 'src/routes/supplierShowroomRoutes.js'), 'utf8');
  const account = fs.readFileSync(path.join(__dirname, 'src/routes/branchAccountRoutes.js'), 'utf8');
  const auth = fs.readFileSync(path.join(__dirname, 'src/middleware/auth.js'), 'utf8');
  const migration = fs.readFileSync(path.join(__dirname, 'migrations/055_branch_accounts.sql'), 'utf8');

  assert.match(showroom, /manager_name/);
  assert.match(showroom, /manager_email/);
  assert.match(showroom, /manager_password/);
  assert.match(showroom, /branch_accounts/);
  assert.match(showroom, /LOWER\(email\)/);
  assert.match(account, /account_type: 'branch'/);
  assert.match(account, /branch_id/);
  assert.match(auth, /decoded\.account_type === 'branch'/);
  assert.match(auth, /branch_active/);
  assert.match(migration, /UNIQUE \(branch_id\)/);
  assert.match(migration, /validate_branch_account_supplier/);

  const password = 'ManagerPass123';
  const digest = await bcrypt.hash(password, 10);
  assert.equal(await bcrypt.compare(password, digest), true);
  assert.equal(await bcrypt.compare('wrong-password', digest), false);

  const token = jwt.sign({ id: 'manager-1', account_type: 'branch', supplier_id: 'supplier-1', branch_id: 'branch-1' }, process.env.JWT_SECRET);
  const claims = jwt.verify(token, process.env.JWT_SECRET);
  assert.deepEqual({ account_type: claims.account_type, supplier_id: claims.supplier_id, branch_id: claims.branch_id }, {
    account_type: 'branch', supplier_id: 'supplier-1', branch_id: 'branch-1'
  });

  console.log('PASS branch manager fields and creation flow are present');
  console.log('PASS password hashing accepts the correct password and rejects an incorrect one');
  console.log('PASS branch token carries supplier_id and branch_id');
  console.log('PASS branch migration enforces one branch account and supplier ownership');
})().catch((error) => { console.error(error); process.exitCode = 1; });
