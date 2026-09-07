import assert from 'node:assert/strict';
import { fieldKind, sanitizeFieldValue, validateField, validateStrongPassword } from './src/utils/inputValidation.js';

const input = (type, name, value = '', required = false) => ({ type, name, value, required });

assert.equal(fieldKind(input('number', 'price_per_day')), 'number');
assert.equal(sanitizeFieldValue(input('number', 'price_per_day'), '250abc'), '250');
assert.equal(sanitizeFieldValue(input('text', 'name'), 'محمد123'), 'محمد');
assert.equal(sanitizeFieldValue(input('tel', 'phone'), '+96777123ABC'), '+96777123');
assert.equal(sanitizeFieldValue(input('email', 'email'), ' user @example.com '), 'user@example.com');
assert.equal(sanitizeFieldValue(input('text', 'license_plate'), 'ABC@123!'), 'ABC123');
assert.equal(validateField(input('number', 'price_per_day', 'abc')), 'أدخل رقمًا صالحًا فقط');
assert.equal(validateField(input('text', 'name', 'محمد123')), 'أدخل نصًا صحيحًا دون أرقام أو رموز خاصة');
assert.equal(validateField(input('text', 'license_plate', 'ABC@123')), 'رقم اللوحة يقبل الحروف والأرقام والمسافات والشرطة فقط');
assert.equal(validateField(input('email', 'email', 'user@')), 'أدخل بريدًا إلكترونيًا صالحًا');
assert.equal(validateField(input('text', 'name', '', true)), 'هذا الحقل مطلوب');
assert.equal(validateField(input('time', 'pickup_time', '09:30')), '');
assert.equal(validateStrongPassword('weak-password'), false);
assert.equal(validateStrongPassword('Strong#Pass123'), true);

console.log('PASS: input validation rules');
