export const SUPPORTED_CURRENCIES = [
  { code: 'YER', name: 'الريال اليمني', symbol: 'ر.ي', rateToYER: 1 },
  { code: 'USD', name: 'الدولار الأمريكي', symbol: '$', rateToYER: 535 },
  { code: 'SAR', name: 'الريال السعودي', symbol: 'ر.س', rateToYER: 142 },
];

export const DEFAULT_CURRENCY = 'YER';

export const getCurrency = (code) => SUPPORTED_CURRENCIES.find((currency) => currency.code === code) || SUPPORTED_CURRENCIES[0];

export const convertFromYER = (amount, code = DEFAULT_CURRENCY) => {
  const currency = getCurrency(code);
  return Number((Number(amount || 0) / currency.rateToYER).toFixed(2));
};

export const formatCurrency = (amount, code = DEFAULT_CURRENCY) => {
  const currency = getCurrency(code);
  return `${Number(amount || 0).toLocaleString('ar-YE', { maximumFractionDigits: 2 })} ${currency.symbol}`;
};
