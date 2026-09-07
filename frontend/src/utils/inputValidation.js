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
const VEHICLE_TEXT_FIELDS = new Set(['make', 'model', 'color']);
const NON_NEGATIVE_NUMERIC_FIELDS = new Set([
  'price_per_day',
  'min_price',
  'max_price',
  'seats',
  'doors',
  'year',
  'mileage',
  'duration_days',
  'discount_percentage',
]);
const INTEGER_FIELDS = new Set(['seats', 'doors', 'year', 'mileage', 'duration_days', 'discount_percentage']);

const numericPattern = new RegExp(`^[${ARABIC_DIGITS}${LATIN_DIGITS}]+([.,][${ARABIC_DIGITS}${LATIN_DIGITS}]+)?$`);
const integerPattern = new RegExp(`^[${ARABIC_DIGITS}${LATIN_DIGITS}]+$`);
const phonePattern = new RegExp(`^[+()\\- ${ARABIC_DIGITS}${LATIN_DIGITS}]{7,20}$`);
const namePattern = /^[\p{L}][\p{L}\s]{1,79}$/u;
const vehicleTextPattern = /^[\p{L}\p{N}][\p{L}\p{N}\s-]{1,79}$/u;
const licensePlatePattern = /^[\p{L}\p{N}][\p{L}\p{N}\s-]{1,19}$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[\x21-\x7E]{10,72}$/;

export function fieldKind(element) {
  const name = (element.name || '').toLowerCase();
  const type = (element.type || 'text').toLowerCase();

  if (type === 'password' || name.includes('password')) return 'password';
  if (type === 'number' || NON_NEGATIVE_NUMERIC_FIELDS.has(name)) return 'number';
  if (type === 'tel' || ['phone', 'mobile', 'telephone'].includes(name)) return 'phone';
  if (type === 'email' || name === 'email') return 'email';
  if (name === 'license_plate' || name === 'plate_number') return 'license_plate';
  if (NAME_FIELDS.has(name)) return 'name';
  if (VEHICLE_TEXT_FIELDS.has(name)) return 'vehicle_text';
  return type;
}

export function sanitizeFieldValue(element, value) {
  const kind = fieldKind(element);
  if (typeof value !== 'string') return value;

  if (kind === 'number') {
    const allowNegative = ['min_price', 'max_price'].includes((element.name || '').toLowerCase());
    const sign = allowNegative ? '-?' : '';
    return value
      .replace(new RegExp(`[^0-9٠-٩.,${allowNegative ? '-' : ''}]`, 'g'), '')
      .replace(new RegExp(`(?!^${sign})-`, 'g'), '')
      .replace(/([.,].*)[.,]/g, '$1');
  }
  if (kind === 'phone') return value.replace(/[^0-9٠-٩+()\- ]/g, '').slice(0, 20);
  if (kind === 'name') return value.replace(/[^\p{L}\s]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 80);
  if (kind === 'vehicle_text') return value.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 80);
  if (kind === 'license_plate') return value.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 20);
  if (kind === 'email') return value.replace(/\s/g, '').slice(0, 160);
  if (kind === 'password') return value.slice(0, 72);
  return value;
}

export function validateStrongPassword(value) {
  return strongPasswordPattern.test(String(value || ''));
}

export function validateField(element) {
  if (!element || element.disabled || element.type === 'hidden' || element.type === 'file' || element.type === 'checkbox' || element.type === 'radio') return '';

  const value = String(element.value || '').trim();
  if (element.required && !value) return 'هذا الحقل مطلوب';
  if (!value) return '';

  const kind = fieldKind(element);
  if (kind === 'number') {
    if (INTEGER_FIELDS.has((element.name || '').toLowerCase()) && !integerPattern.test(value)) return 'أدخل رقمًا صحيحًا دون كسور';
    if (!numericPattern.test(value)) return 'أدخل رقمًا صالحًا فقط';
    if (!['min_price', 'max_price'].includes((element.name || '').toLowerCase()) && value.startsWith('-')) return 'لا يمكن إدخال قيمة سالبة';
  }
  if (kind === 'phone' && !phonePattern.test(value)) return 'أدخل رقم هاتف صالحًا';
  if (kind === 'name' && !namePattern.test(value)) return 'أدخل نصًا صحيحًا دون أرقام أو رموز خاصة';
  if (kind === 'vehicle_text' && !vehicleTextPattern.test(value)) return 'استخدم حروفًا وأرقامًا ومسافات وشرطة فقط';
  if (kind === 'license_plate' && !licensePlatePattern.test(value)) return 'رقم اللوحة يقبل الحروف والأرقام والمسافات والشرطة فقط';
  if (kind === 'password' && element.dataset?.passwordPolicy === 'strong' && !validateStrongPassword(value)) return 'كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا خاصًا';
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
