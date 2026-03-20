import React, { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TransactionFilters as TransactionFiltersType, Account, Category } from '../../types/transaction';

interface TransactionFiltersProps {
  filters: TransactionFiltersType;
  accounts: Account[];
  categories: Category[];
  onFilterChange: (filters: TransactionFiltersType) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  accounts,
  categories,
  onFilterChange,
}) => {
  const { control, watch, reset } = useForm<TransactionFiltersType>({
    defaultValues: filters,
  });

  const watchFilters = watch();

  // Use a stable reference to onFilterChange in effect
  useEffect(() => {
    onFilterChange(watchFilters);
  }, [
    watchFilters.page,
    watchFilters.limit,
    watchFilters.accountId,
    watchFilters.categoryId,
    watchFilters.type,
    watchFilters.dateFrom,
    watchFilters.dateTo,
    onFilterChange,
  ]);

  const handleReset = () => {
    const emptyFilters: TransactionFiltersType = {
      page: 1,
      limit: 20,
    };
    reset(emptyFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <Controller
            name="dateFrom"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            )}
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <Controller
            name="dateTo"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            )}
          />
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Category */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            )}
          />
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};
