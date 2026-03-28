/**
 * Currency formatting utility
 * Formats amounts with currency symbol and locale-appropriate separators
 */

interface CurrencySymbols {
  [key: string]: string;
}

const CURRENCY_SYMBOLS: CurrencySymbols = {
  EGP: 'E£',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: '﷼',
  AED: 'د.إ',
  KWD: 'د.ك',
  JPY: '¥',
  CHF: 'Fr',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  XAU: 'g', // Gold in grams
  GOLD_GRAM: 'g', // Gold in grams (account currency code)
};

// Decimal places configuration per currency
// Most currencies use 2, but some have special needs
const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,    // Japanese Yen typically has no decimal places
  KWD: 3,    // Kuwaiti Dinar uses 3 decimal places
  BHD: 3,    // Bahraini Dinar uses 3 decimal places
  OMR: 3,    // Omani Rial uses 3 decimal places
  TND: 3,    // Tunisian Dinar uses 3 decimal places
  XAU: 4,    // Gold needs higher precision for grams
  GOLD_GRAM: 3, // Gold in grams (account currency code)
  XAG: 4,    // Silver needs higher precision
  XPT: 4,    // Platinum needs higher precision
};

/**
 * Get the appropriate decimal places for a currency
 * @param currency The currency code
 * @returns Number of decimal places for this currency
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? 2;
}

/**
 * Format an amount with currency symbol and locale separators
 * @param amount The amount to format (as string or number)
 * @param currency The currency code (e.g., 'USD', 'EGP')
 * @param locale The locale for number formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: string | number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return `${num}`;
  }

  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const decimals = getCurrencyDecimals(currency);

  // Format the number with locale-specific separators
  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formatted} ${symbol}`;
}

/**
 * Format an amount without currency symbol
 * @param amount The amount to format
 * @param locale The locale for number formatting
 * @returns Formatted number string
 */
export function formatNumber(amount: string | number, locale: string = 'en-US'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return `${num}`;
  }

  return num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Get the symbol for a currency
 * @param currency The currency code
 * @returns The currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Parse a formatted currency string back to a number
 * @param formattedString The formatted string (e.g., "$1,234.56")
 * @returns The parsed number
 */
export function parseCurrency(formattedString: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = formattedString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Determine if a currency is a precious metal (special handling)
 * @param currency The currency code
 * @returns true if it's a precious metal
 */
/**
 * Get the divisor for converting stored smallest-unit amounts to display amounts
 * Gold uses 1000 (milligrams), regular currencies use 100 (cents)
 */
export function getAmountDivisor(currency: string): number {
  if (currency === 'GOLD_GRAM' || currency === 'XAU') return 1000;
  return 100;
}

/**
 * Convert a stored smallest-unit amount to a display amount
 */
export function fromSmallestUnit(amount: string | number, currency: string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num / getAmountDivisor(currency);
}

export function isPreciousMetal(currency: string): boolean {
  return currency === 'XAU' || currency === 'GOLD_GRAM' || currency === 'XAG' || currency === 'XPT';
}

/**
 * Get the display unit for a currency
 * For most currencies this is 'units', but for precious metals it's the unit of measurement
 * @param currency The currency code
 * @returns The display unit
 */
export function getCurrencyUnit(currency: string): string {
  if (currency === 'XAU' || currency === 'GOLD_GRAM') return 'grams';
  if (currency === 'XAG') return 'ounces';
  if (currency === 'XPT') return 'ounces';
  return 'units';
}
