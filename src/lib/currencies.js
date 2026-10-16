// Supported international currencies with INR (India) as default base region
export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'INR (₹)', country: 'India (Default Base)', rate: 1, locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'USD ($)', country: 'United States', rate: 1 / 86, locale: 'en-US' },
  GBP: { code: 'GBP', symbol: '£', name: 'GBP (£)', country: 'United Kingdom', rate: 1 / 109, locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', name: 'EUR (€)', country: 'European Union', rate: 1 / 93, locale: 'de-DE' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'CAD (C$)', country: 'Canada', rate: 1 / 63, locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'AUD (A$)', country: 'Australia', rate: 1 / 56, locale: 'en-AU' },
  AED: { code: 'AED', symbol: 'AED ', name: 'AED', country: 'United Arab Emirates', rate: 1 / 23.4, locale: 'en-AE' },
};

/**
 * Format a base INR price according to the selected currency.
 */
export const formatPrice = (inrAmount, currencyCode = 'INR') => {
  if (inrAmount === undefined || inrAmount === null || inrAmount === '') return '';
  const num = Number(inrAmount);
  if (isNaN(num)) return inrAmount;

  const curr = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const converted = num * curr.rate;

  if (currencyCode === 'INR') {
    return `${curr.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  if (currencyCode === 'AED') {
    return `${Math.round(converted).toLocaleString()} ${curr.code.trim()}`;
  }
  return `${curr.symbol}${converted.toFixed(2)}`;
};

