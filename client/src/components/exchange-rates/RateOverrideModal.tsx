import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const overrideSchema = z.object({
  fromCurrency: z.string().min(3).max(4).regex(/^[A-Za-z]{3,4}$/).transform(s => s.toUpperCase()),
  toCurrency: z.string().min(3).max(4).regex(/^[A-Za-z]{3,4}$/).transform(s => s.toUpperCase()),
  rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Rate must be a positive number',
  }),
});

type OverrideFormData = z.infer<typeof overrideSchema>;

interface RateOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OverrideFormData) => Promise<void>;
  fromCurrency?: string;
  toCurrency?: string;
  isLoading?: boolean;
}

export function RateOverrideModal({
  isOpen,
  onClose,
  onSubmit,
  fromCurrency: initialFromCurrency = '',
  toCurrency: initialToCurrency = '',
  isLoading = false,
}: RateOverrideModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<OverrideFormData>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      fromCurrency: initialFromCurrency,
      toCurrency: initialToCurrency,
      rate: '',
    },
  });

  const fromCurrency = watch('fromCurrency');
  const toCurrency = watch('toCurrency');

  useEffect(() => {
    if (isOpen) {
      reset({
        fromCurrency: initialFromCurrency,
        toCurrency: initialToCurrency,
        rate: '',
      });
      setError(null);
    }
  }, [isOpen, initialFromCurrency, initialToCurrency, reset]);

  const handleFormSubmit = async (data: OverrideFormData) => {
    try {
      setError(null);
      await onSubmit(data);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set override');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Set Exchange Rate Override</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Currency
            </label>
            <input
              type="text"
              placeholder="e.g., USD"
              maxLength={10}
              disabled={isLoading}
              {...register('fromCurrency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {errors.fromCurrency && (
              <p className="text-xs text-red-600 mt-1">{errors.fromCurrency.message}</p>
            )}
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Currency
            </label>
            <input
              type="text"
              placeholder="e.g., EGP"
              maxLength={10}
              disabled={isLoading}
              {...register('toCurrency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            {errors.toCurrency && (
              <p className="text-xs text-red-600 mt-1">{errors.toCurrency.message}</p>
            )}
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exchange Rate
            </label>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">
                1 {fromCurrency || 'FROM'} =
              </span>
              <input
                type="number"
                placeholder="0.00"
                step="any"
                min="0"
                disabled={isLoading}
                {...register('rate')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-600 ml-2">
                {toCurrency || 'TO'}
              </span>
            </div>
            {errors.rate && <p className="text-xs text-red-600 mt-1">{errors.rate.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting...' : 'Set Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
