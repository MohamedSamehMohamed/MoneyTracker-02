import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateStockTransactionInput, StockTransaction } from '../../types/stock';
import type { Account } from '../../types/account';

const formSchema = z.object({
  type: z.enum(['buy', 'sell']),
  company: z.string().min(1, 'Company is required').max(100),
  shares: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: 'Shares must be a positive number',
  }),
  pricePerShare: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: 'Price must be a positive number',
  }),
  currency: z.string().min(1, 'Currency is required'),
  date: z.string().refine(
    (v) => {
      const selected = new Date(v + 'T00:00:00Z');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected <= today;
    },
    { message: 'Date cannot be in the future' }
  ),
  note: z.string().optional(),
  accountId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface StockTransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStockTransactionInput) => Promise<void>;
  accounts: Account[];
  editingTransaction?: StockTransaction | null;
  isLoading?: boolean;
  error?: string;
}

export function StockTransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  editingTransaction,
  isLoading = false,
  error: serverError,
}: StockTransactionFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'buy',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedCurrency = watch('currency');

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        company: editingTransaction.company,
        shares: editingTransaction.shares,
        pricePerShare: editingTransaction.pricePerShare,
        currency: editingTransaction.currency,
        date: editingTransaction.date,
        note: editingTransaction.note,
        accountId: editingTransaction.accountId || '',
      });
    } else {
      reset({
        type: 'buy',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingTransaction, reset, isOpen]);

  const filteredAccounts = accounts.filter((acc) => acc.currency === selectedCurrency || !selectedCurrency);

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        type: data.type,
        company: data.company,
        shares: data.shares,
        pricePerShare: data.pricePerShare,
        currency: data.currency,
        date: data.date,
        note: data.note || undefined,
        accountId: data.accountId || undefined,
      } as CreateStockTransactionInput);
      reset();
      onClose();
    } catch (err) {
      // Error is handled by parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingTransaction ? 'Edit' : 'New'} Stock Transaction
          </h2>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                {...register('type')}
                disabled={!!editingTransaction}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                {...register('company')}
                type="text"
                disabled={!!editingTransaction}
                placeholder="e.g., Apple, AAPL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>

            {/* Shares */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shares
              </label>
              <input
                {...register('shares')}
                type="number"
                step="0.00000001"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
              {errors.shares && (
                <p className="mt-1 text-sm text-red-600">{errors.shares.message}</p>
              )}
            </div>

            {/* Price Per Share */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Per Share
              </label>
              <input
                {...register('pricePerShare')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
              {errors.pricePerShare && (
                <p className="mt-1 text-sm text-red-600">{errors.pricePerShare.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                {...register('currency')}
                type="text"
                placeholder="USD"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                {...register('date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                {...register('note')}
                placeholder="Optional note"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Account (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Account (Optional)
              </label>
              <select
                {...register('accountId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No linked account</option>
                {filteredAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting || isLoading ? 'Saving...' : editingTransaction ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
