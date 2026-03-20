import { useEffect } from 'react';
import type { Account } from '../../types/account';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  account: Account | null;
  onConfirm: (account: Account) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteAccountDialog({
  isOpen,
  account,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteAccountDialogProps) {
  if (!isOpen || !account) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await onConfirm(account);
    } catch (error) {
      // Error is handled by parent
    }
  };

  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Account?</h2>

          <div className="space-y-4 mb-6">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>"{account.name}"</strong>?
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> This account has associated transactions that will also be deleted. This action cannot be undone.
              </p>
            </div>

            {account.balance !== '0' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  <strong>❌ Cannot Delete:</strong> This account has a non-zero balance. Please clear the balance before deleting.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || account.balance !== '0'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
