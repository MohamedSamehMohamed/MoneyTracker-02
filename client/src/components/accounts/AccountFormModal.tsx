import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Account } from '../../types/account';

const accountFormSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: z.enum(['cash', 'bank', 'wallet', 'gold']).refine(
    (val) => val,
    'Please select a valid account type'
  ),
  currency: z.string().min(1, 'Currency is required').max(10),
  icon: z.string().max(50).optional().or(z.literal('')),
});

type AccountFormData = z.infer<typeof accountFormSchema>;

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  initialData?: Account;
}

export function AccountFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AccountFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          currency: initialData.currency,
          icon: initialData.icon || '',
        }
      : {
          name: '',
          type: 'cash',
          currency: 'EGP',
          icon: '',
        },
  });

  const selectedType = watch('type');
  const currentCurrency = watch('currency');

  // Reset form when initialData changes (fixes editing different accounts)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        type: initialData.type,
        currency: initialData.currency,
        icon: initialData.icon || '',
      });
    }
  }, [initialData, reset]);

  // Auto-switch currency to GOLD_GRAM when gold is selected, and reset to EGP when switching away
  useEffect(() => {
    if (selectedType === 'gold' && currentCurrency !== 'GOLD_GRAM') {
      setValue('currency', 'GOLD_GRAM');
    } else if (selectedType !== 'gold' && currentCurrency === 'GOLD_GRAM') {
      setValue('currency', 'EGP');
    }
  }, [selectedType, currentCurrency, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: AccountFormData) => {
    try {
      await onSubmit({
        ...data,
        icon: data.icon || undefined,
      });
      handleClose();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {initialData ? 'Edit Account' : 'Create New Account'}
          </h2>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="My Savings"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                {...register('type')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="wallet">Wallet</option>
                <option value="gold">Gold</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                {...register('currency')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EGP">EGP (Egyptian Pound)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                {selectedType === 'gold' && <option value="GOLD_GRAM">GOLD_GRAM</option>}
              </select>
              {errors.currency && (
                <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
              )}
            </div>

            {/* Icon (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Icon (Optional)
              </label>
              <input
                {...register('icon')}
                type="text"
                placeholder="💰"
                maxLength={50}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.icon && (
                <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
