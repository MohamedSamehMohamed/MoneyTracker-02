import React from 'react';
import type { Transaction } from '../../types/transaction';
import { formatAmount, getTypeLabel } from '../../utils/formatters';

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen || !transaction) return null;

  const affectedAccounts =
    transaction.type === 'transfer'
      ? [transaction.account.name, transaction.transferAccount?.name].filter(Boolean).join(' and ')
      : transaction.account.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Transaction?</h2>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">{getTypeLabel(transaction.type)}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatAmount(transaction.amount, transaction.account.currency)}{' '}
              {transaction.account.currency.replace('GOLD_GRAM', 'g')}
            </div>
            <div className="text-sm text-gray-600">
              {transaction.category && (
                <>
                  <span>{transaction.category.icon} {transaction.category.name}</span>
                  <span> • </span>
                </>
              )}
              <span>{new Date(transaction.date).toLocaleDateString('en-US')}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will affect the balance of{' '}
              <strong>{affectedAccounts}</strong>.
              {transaction.type === 'transfer' && (
                <> Both accounts will be updated.</>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
