/**
 * Format a number as currency with specified decimal places
 */
export function formatCurrency(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format shares with up to 8 decimal places, stripping trailing zeros
 */
export function formatShares(value: number): string {
  const formatted = value.toFixed(8);
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Format price per share with 2 decimal places
 */
export function formatPrice(value: number): string {
  return value.toFixed(2);
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date in short format (YYYY-MM-DD)
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format currency value with currency code
 */
export function formatCurrencyValue(value: number, currencyCode: string, decimals = 2): string {
  return `${currencyCode} ${value.toFixed(decimals)}`;
}

/**
 * Format amount in cents to currency string
 */
export function formatAmount(amountInCents: number, decimals = 2): string {
  const dollars = amountInCents / 100;
  return dollars.toFixed(decimals);
}

/**
 * Get label for transaction type
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    buy: 'Buy',
    sell: 'Sell',
  };
  return labels[type] || type;
}
