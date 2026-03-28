import React, { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Transaction, CreateTransactionInput, Account, Category } from '../../types/transaction';
import { fromSmallestUnit } from '../../utils/currency';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionInput) => void;
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction;
  isLoading?: boolean;
}

const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account'),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  categoryId: z.string().uuid().optional(),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
  date: z.string().refine(
    (date) => {
      const selected = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return selected <= today;
    },
    { message: 'Date cannot be in the future' }
  ),
  transferToId: z.string().uuid().optional(),
});

type TransactionFormInput = z.infer<typeof createTransactionSchema>;

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  categories,
  initialData,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      accountId: initialData?.accountId || '',
      type: initialData?.type || 'income',
      amount: initialData ? fromSmallestUnit(initialData.amount, initialData.account.currency) : undefined,
      categoryId: initialData?.categoryId,
      note: initialData?.note || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      transferToId: initialData?.transferToId,
    },
  });

  const watchType = watch('type');
  const watchAccountId = watch('accountId');

  // Filter categories based on type
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const typeMap: Record<string, string> = {
      income: 'income',
      expense: 'expense',
      transfer: 'expense', // Transfers don't have categories
    };
    const categoryType = typeMap[watchType];
    return categories.filter((c) => c.type === categoryType);
  }, [categories, watchType]);

  // Filter destination accounts for transfer (exclude source)
  const transferDestinations = useMemo(() => {
    return accounts.filter((a) => a.id !== watchAccountId);
  }, [accounts, watchAccountId]);

  useEffect(() => {
    if (isOpen && !initialData) {
      reset({
        accountId: '',
        type: 'income',
        amount: undefined,
        categoryId: undefined,
        note: '',
        date: new Date().toISOString().split('T')[0],
        transferToId: undefined,
      });
    }
  }, [isOpen, initialData, reset]);

  // Reset form when switching between different transactions in edit mode
  useEffect(() => {
    if (initialData) {
      reset({
        accountId: initialData.accountId,
        type: initialData.type,
        amount: fromSmallestUnit(initialData.amount, initialData.account.currency),
        categoryId: initialData.categoryId,
        note: initialData.note || '',
        date: initialData.date,
        transferToId: initialData.transferToId,
      });
    }
  }, [initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data: TransactionFormInput) => {
    // Convert user-visible amount to smallest unit (multiply by 100 for currencies, 1000 for gold)
    const selectedAccount = accounts.find((a) => a.id === data.accountId);
    const multiplier = selectedAccount?.currency === 'GOLD_GRAM' ? 1000 : 100;
    const amountInSmallestUnit = Math.round(data.amount * multiplier);

    onSubmit({
      accountId: data.accountId,
      type: data.type,
      amount: amountInSmallestUnit,
      categoryId: data.type === 'transfer' ? undefined : data.categoryId,
      note: data.note,
      date: data.date,
      transferToId: data.type === 'transfer' ? data.transferToId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {initialData ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={!!initialData}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  } ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select type</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              )}
            />
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account *
            </label>
            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={!!initialData}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.accountId ? 'border-red-500' : 'border-gray-300'
                  } ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.accountId && (
              <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field: { value, onChange } }) => (
                <input
                  type="number"
                  step="0.01"
                  value={value || ''}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0.00"
                />
              )}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              )}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Category (hidden for transfers) */}
          {watchType !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.categoryId ? 'border-red-500' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">No category</option>
                    {/* Show matching type categories first */}
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && <span>{category.icon} </span>}
                        {category.name}
                      </option>
                    ))}
                    {/* Show remaining categories */}
                    {categories
                      .filter(
                        (c) => !filteredCategories.find((fc) => fc.id === c.id)
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon && <span>{category.icon} </span>}
                          {category.name}
                        </option>
                      ))}
                  </select>
                )}
              />
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
          )}

          {/* Transfer Destination */}
          {watchType === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer To *
              </label>
              <Controller
                name="transferToId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.transferToId ? 'border-red-500' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select destination account</option>
                    {transferDestinations.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.transferToId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.transferToId.message}
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.note ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  rows={3}
                  placeholder="Optional note"
                />
              )}
            />
            {errors.note && (
              <p className="text-red-500 text-sm mt-1">{errors.note.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
