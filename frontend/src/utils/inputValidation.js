const ARABIC_DIGITS = '٠-٩';
const LATIN_DIGITS = '0-9';

const NAME_FIELDS = new Set([
  'name',
  'full_name',
  'first_name',
  'last_name',
  'company_name',
  'bank_name',
]);

const numericPattern = new RegExp(`^[${ARABIC_DIGITS}${LATIN_DIGITS}]+([.,][${ARABIC_DIGITS}${LATIN_DIGITS}]+)?$`);
const phonePattern = new RegExp(`^[+()\\- ${ARABIC_DIGITS}${LATIN_DIGITS}]{7,20}$`);
const namePattern = /^[\p{L}][\p{L}\s.'-]{1,79}$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function fieldKind(element) {
  const name = (element.name || '').toLowerCase();
  const type = (element.type || 'text').toLowerCase();

  if (type === 'number' || ['price_per_day', 'min_price', 'max_price', 'seats', 'doors', 'year', 'mileage', 'duration_days', 'discount_percentage'].includes(name)) return 'number';
  if (type === 'tel' || ['phone', 'mobile', 'telephone'].includes(name)) return 'phone';
  if (type === 'email' || name === 'email') return 'email';
  if (NAME_FIELDS.has(name)) return 'name';
  return type;
}

export function sanitizeFieldValue(element, value) {
  const kind = fieldKind(element);
  if (typeof value !== 'string') return value;

  if (kind === 'number') return value.replace(/[^0-9٠-٩.,-]/g, '').replace(/(?!^)-/g, '').replace(/([.,].*)[.,]/g, '$1');
  if (kind === 'phone') return value.replace(/[^0-9٠-٩+()\- ]/g, '').slice(0, 20);
  if (kind === 'name') return value.replace(/[^\p{L}\s.'-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 80);
  if (kind === 'email') return value.replace(/\s/g, '').slice(0, 160);
  return value;
}

export function validateField(element) {
  if (!element || element.disabled || element.type === 'hidden' || element.type === 'file' || element.type === 'checkbox' || element.type === 'radio') return '';

  const value = String(element.value || '').trim();
  if (element.required && !value) return 'هذا الحقل مطلوب';
  if (!value) return '';

  const kind = fieldKind(element);
  if (kind === 'number' && !numericPattern.test(value)) return 'أدخل رقمًا صالحًا فقط';
  if (kind === 'phone' && !phonePattern.test(value)) return 'أدخل رقم هاتف صالحًا';
  if (kind === 'name' && !namePattern.test(value)) return 'أدخل اسمًا نصيًا صحيحًا دون أرقام';
  if (kind === 'email' && !emailPattern.test(value)) return 'أدخل بريدًا إلكترونيًا صالحًا';

  if (element.type === 'date' && Number.isNaN(new Date(`${value}T00:00:00`).getTime())) return 'أدخل تاريخًا صالحًا';
  if (element.type === 'time' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return 'أدخل وقتًا صالحًا';
  return '';
}

export function validateForm(form) {
  const fields = [...form.querySelectorAll('input, textarea, select')];
  const invalid = fields.find((field) => validateField(field));
  if (invalid) {
    invalid.setCustomValidity(validateField(invalid));
    invalid.reportValidity?.();
    invalid.focus?.();
    return false;
  }
  fields.forEach((field) => field.setCustomValidity?.(''));
  return true;
}
