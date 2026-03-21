interface DeleteStockTransactionDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  transaction?: {
    company: string;
    type: string;
    shares: string;
    date: string;
  } | null;
}

export function DeleteStockTransactionDialog({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  transaction,
}: DeleteStockTransactionDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      // Error is handled by parent
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this stock transaction?
            {transaction && (
              <span className="block mt-2 text-sm font-medium">
                {transaction.type.toUpperCase()} {transaction.shares} shares of {transaction.company} on {transaction.date.split('T')[0]}
              </span>
            )}
            <span className="block mt-1 text-sm">This action cannot be undone.</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
