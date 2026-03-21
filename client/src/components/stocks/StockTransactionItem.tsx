import type { StockTransaction } from '../../types/stock';

interface StockTransactionItemProps {
  transaction: StockTransaction;
  onEdit?: (transaction: StockTransaction) => void;
  onDelete?: (transaction: StockTransaction) => void;
}

export function StockTransactionItem({
  transaction,
  onEdit,
  onDelete,
}: StockTransactionItemProps) {
  const isBuy = transaction.type === 'buy';
  const shares = parseFloat(transaction.shares);
  const price = parseFloat(transaction.pricePerShare);
  const totalValue = shares * price;
  const date = new Date(transaction.date).toLocaleDateString();

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const formatShares = (num: number) => {
    const formatted = num.toFixed(8);
    return formatted.replace(/\.?0+$/, '');
  };

  const realizedGain = transaction.realizedGain
    ? parseFloat(transaction.realizedGain)
    : null;

  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 hover:bg-gray-50 px-2 -mx-2 rounded transition">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {/* Type Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            isBuy
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isBuy ? 'BUY' : 'SELL'}
          </div>

          {/* Company & Details */}
          <div className="flex-1">
            <p className="font-medium text-gray-900">{transaction.company}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">
                {formatShares(shares)} @ {transaction.currency} {formatNumber(price)}
              </p>
              {transaction.accountId && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                  Linked account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="text-right mr-4">
        <p className="font-semibold text-gray-900">
          {transaction.currency} {formatNumber(totalValue)}
        </p>
        {realizedGain !== null && !isBuy && (
          <p className={`text-sm ${realizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Gain: {formatNumber(realizedGain)}
          </p>
        )}
        <p className="text-xs text-gray-500">{date}</p>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(transaction)}
              className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(transaction)}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
