import { useState, useEffect } from 'react';
import type { StockTransactionFilters } from '../../types/stock';

interface StockFiltersProps {
  filters: StockTransactionFilters;
  onFilterChange: (filters: StockTransactionFilters) => void;
}

export function StockFilters({
  filters,
  onFilterChange,
}: StockFiltersProps) {
  const [companyInput, setCompanyInput] = useState(filters.company || '');

  // Sync companyInput when filters.company changes from outside
  useEffect(() => {
    setCompanyInput(filters.company || '');
  }, [filters.company]);

  // Debounce company input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (companyInput !== filters.company) {
        onFilterChange({
          ...filters,
          company: companyInput || undefined,
          page: 1,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [companyInput]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyInput(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      type: (value === 'all' ? undefined : value) as 'buy' | 'sell' | undefined,
      page: 1,
    });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      dateFrom: e.target.value || undefined,
      page: 1,
    });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      dateTo: e.target.value || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters = filters.company || filters.type || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col gap-4">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              placeholder="Filter by company"
              value={companyInput}
              onChange={handleCompanyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type || 'all'}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={handleDateFromChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={handleDateToChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 self-start"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
