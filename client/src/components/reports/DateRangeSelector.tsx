import { useState, useEffect } from 'react';

export interface DateRangeSelectorProps {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

type Preset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'allTime';

function getDateRange(preset: Preset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = today.toISOString().split('T')[0];

  switch (preset) {
    case 'thisMonth': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const dateFrom = lastMonth.toISOString().split('T')[0];
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      const dateToLastMonth = lastMonthEnd.toISOString().split('T')[0];
      return { dateFrom, dateTo: dateToLastMonth };
    }
    case 'last3Months': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'last6Months': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'thisYear': {
      const dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'allTime': {
      const dateFrom = '2020-01-01';
      return { dateFrom, dateTo };
    }
  }
}

export function DateRangeSelector({ dateFrom, dateTo, onChange }: DateRangeSelectorProps) {
  const [customDateFrom, setCustomDateFrom] = useState(dateFrom);
  const [customDateTo, setCustomDateTo] = useState(dateTo);

  useEffect(() => {
    setCustomDateFrom(dateFrom);
    setCustomDateTo(dateTo);
  }, [dateFrom, dateTo]);

  const handlePresetClick = (selectedPreset: Preset) => {
    const range = getDateRange(selectedPreset);
    onChange(range.dateFrom, range.dateTo);
  };

  const handleCustomApply = () => {
    onChange(customDateFrom, customDateTo);
  };

  const isPresetActive = (selectedPreset: Preset) => {
    const range = getDateRange(selectedPreset);
    return range.dateFrom === dateFrom && range.dateTo === dateTo;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handlePresetClick('thisMonth')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('thisMonth')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => handlePresetClick('lastMonth')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('lastMonth')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last Month
        </button>
        <button
          onClick={() => handlePresetClick('last3Months')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('last3Months')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 3 Months
        </button>
        <button
          onClick={() => handlePresetClick('last6Months')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('last6Months')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 6 Months
        </button>
        <button
          onClick={() => handlePresetClick('thisYear')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('thisYear')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Year
        </button>
        <button
          onClick={() => handlePresetClick('allTime')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            isPresetActive('allTime')
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Time
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={customDateFrom}
            onChange={(e) => {
              setCustomDateFrom(e.target.value);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={customDateTo}
            onChange={(e) => {
              setCustomDateTo(e.target.value);
            }}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleCustomApply}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
