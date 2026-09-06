const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toWesternDigits(value) {
  return String(value || '')
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(EASTERN_ARABIC_DIGITS.indexOf(digit)));
}

function normalizePhoneNumber(value) {
  const input = toWesternDigits(value).trim();
  if (!input) return null;

  let digits = input.replace(/\D/g, '');
  if (!digits) return null;

  const defaultCountryCode = String(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '967')
    .replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && defaultCountryCode) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }

  return `+${digits}`;
}

module.exports = { normalizePhoneNumber };
