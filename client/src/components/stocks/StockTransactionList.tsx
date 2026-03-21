import type { StockTransaction, StockTransactionListResponse } from '../../types/stock';
import { StockTransactionItem } from './StockTransactionItem';

interface StockTransactionListProps {
  data: StockTransactionListResponse | null;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onEdit?: (transaction: StockTransaction) => void;
  onDelete?: (id: string) => void;
}

export function StockTransactionList({
  data,
  isLoading = false,
  onPageChange,
  onEdit,
  onDelete,
}: StockTransactionListProps) {
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Transaction Items */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {data.items.map((transaction) => (
            <StockTransactionItem
              key={transaction.id}
              transaction={transaction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Showing {(data.page - 1) * data.limit + 1} to{' '}
            {Math.min(data.page * data.limit, data.total)} of {data.total} transactions
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(data.page - 1)}
              disabled={data.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    page === data.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
