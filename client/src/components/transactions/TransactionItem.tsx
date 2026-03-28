import React from 'react';
import type { Transaction } from '../../types/transaction';
import { getTypeLabel } from '../../utils/formatters';
import { formatCurrency, fromSmallestUnit } from '../../utils/currency';
import { useAuth } from '../../contexts/AuthContext';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'income':
      return <span className="text-green-600 text-lg">↑</span>;
    case 'expense':
      return <span className="text-red-600 text-lg">↓</span>;
    case 'transfer':
      return <span className="text-blue-600 text-lg">⇄</span>;
    default:
      return null;
  }
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const baseCurrency = user?.baseCurrency || 'USD';

  const amountClass =
    transaction.type === 'income' ? 'text-green-600' : 'text-red-600';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center justify-center w-10 h-10">
          {getTypeIcon(transaction.type)}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {getTypeLabel(transaction.type)}
            </span>
            {transaction.category && (
              <span className="text-sm text-gray-600">
                {transaction.category.icon} {transaction.category.name}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            <span>{transaction.account.name}</span>
            {transaction.type === 'transfer' && transaction.transferAccount && (
              <span> → {transaction.transferAccount.name}</span>
            )}
            {transaction.note && <span> • {transaction.note.substring(0, 50)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className={`font-semibold ${amountClass}`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(fromSmallestUnit(transaction.amount, transaction.account.currency), transaction.account.currency)}
          </div>
          {transaction.convertedAmount && (
            <div className="text-sm text-gray-600 mt-1">
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.convertedAmount, baseCurrency)}
              {transaction.isApproximate && (
                <span className="ml-1 text-xs text-orange-600" title="Approximate rate used">
                  ≈
                </span>
              )}
            </div>
          )}
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(transaction.date)}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
