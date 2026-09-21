const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'src/routes/branchAccountRoutes.js'), 'utf8');
const match = source.match(/const isStrongPassword = \(value\) => (\/.*?\/\.test\(String\(value \|\| ''\)\));/);
assert.ok(match, 'branch password policy must be defined');
const isStrongPassword = (value) => Function('value', `return ${match[1]}`)(String(value || ''));

assert.equal(isStrongPassword('Aa123456!x'), true);
assert.equal(isStrongPassword('Aa12345678'), false, 'a password without a symbol must be rejected');
assert.equal(isStrongPassword('aa123456!x'), false, 'a password without uppercase must be rejected');
assert.equal(isStrongPassword('AA123456!X'), false, 'a password without lowercase must be rejected');
assert.equal(isStrongPassword('Aaabcdef!x'), false, 'a password without a digit must be rejected');
assert.equal(isStrongPassword('Aa1!short'), false, 'a password shorter than 10 characters must be rejected');
assert.equal(isStrongPassword('Aa123456!x with space'), false, 'spaces must be rejected');
assert.match(source, /\(\?=\.\*\\d\)/, 'digit lookahead must use the digit class');
assert.doesNotMatch(source, /\(\?=\.\*\\\\d\)/, 'digit lookahead must not contain a double escape');
console.log('PASS branch first-login password policy accepts valid strong passwords and rejects invalid ones');
