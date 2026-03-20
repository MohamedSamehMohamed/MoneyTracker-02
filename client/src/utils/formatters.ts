export function formatAmount(amount: string, currency: string): string {
  const numAmount = parseFloat(amount);
  const divisor = currency === 'GOLD_GRAM' ? 1000 : 100;
  const displayAmount = (numAmount / divisor).toFixed(currency === 'GOLD_GRAM' ? 3 : 2);

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'GOLD_GRAM' ? 3 : 2,
    maximumFractionDigits: currency === 'GOLD_GRAM' ? 3 : 2,
  });

  return formatter.format(parseFloat(displayAmount));
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    case 'transfer':
      return 'Transfer';
    default:
      return type;
  }
}
