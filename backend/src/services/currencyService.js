const CURRENCIES = Object.freeze({
  YER: Object.freeze({ code: 'YER', name: 'الريال اليمني', symbol: 'ر.ي', rateToYER: 1 }),
  USD: Object.freeze({ code: 'USD', name: 'الدولار الأمريكي', symbol: '$', rateToYER: 535 }),
  SAR: Object.freeze({ code: 'SAR', name: 'الريال السعودي', symbol: 'ر.س', rateToYER: 142 }),
});

const DEFAULT_CURRENCY = 'YER';
const SUPPORTED_CURRENCIES = Object.freeze(Object.keys(CURRENCIES));

const assertCurrency = (currency = DEFAULT_CURRENCY) => {
  const normalized = String(currency).trim().toUpperCase();
  if (!CURRENCIES[normalized]) {
    throw new Error(`العملة غير مدعومة. العملات المتاحة: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }
  return normalized;
};

const convertFromYER = (amount, currency = DEFAULT_CURRENCY) => {
  const code = assertCurrency(currency);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('مبلغ الدفع غير صالح');
  }
  return Number((numericAmount / CURRENCIES[code].rateToYER).toFixed(2));
};

const convertToYER = (amount, currency = DEFAULT_CURRENCY) => {
  const code = assertCurrency(currency);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('مبلغ الدفع غير صالح');
  }
  return Number((numericAmount * CURRENCIES[code].rateToYER).toFixed(2));
};

const listCurrencies = () => SUPPORTED_CURRENCIES.map((code) => ({ ...CURRENCIES[code] }));

module.exports = {
  CURRENCIES,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  assertCurrency,
  convertFromYER,
  convertToYER,
  listCurrencies,
};
