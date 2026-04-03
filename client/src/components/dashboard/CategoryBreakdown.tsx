import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import type { CategorySummaryResponse } from '../../types/dashboard';

type Preset = 'current' | 'last3' | 'last6' | 'last12' | 'custom';

function getDateRange(preset: Preset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = today.toISOString().split('T')[0];

  switch (preset) {
    case 'current': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'last3': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'last6': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'last12': {
      const dateFrom = new Date(today.getFullYear(), today.getMonth() - 11, 1).toISOString().split('T')[0];
      return { dateFrom, dateTo };
    }
    case 'custom':
      return { dateFrom: '', dateTo: '' };
  }
}

export function CategoryBreakdown() {
  const [data, setData] = useState<CategorySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>('current');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  useEffect(() => {
    if (preset !== 'custom') {
      const { dateFrom, dateTo } = getDateRange(preset);
      fetchData(dateFrom, dateTo);
    }
  }, [preset]);

  useEffect(() => {
    const range = getDateRange('current');
    setCustomDateFrom(range.dateFrom);
    setCustomDateTo(range.dateTo);
  }, []);

  const fetchData = async (dateFrom: string, dateTo: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardApi.categorySummary(dateFrom, dateTo);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category data');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomApply = () => {
    if (customDateFrom && customDateTo) {
      fetchData(customDateFrom, customDateTo);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="flex justify-center mb-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
          ))}
        </div>
        <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => {
            const range = getDateRange(preset);
            fetchData(range.dateFrom, range.dateTo);
          }}
          className="text-red-600 underline mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const chartData = data?.categories.map((c) => ({
    name: c.name,
    value: parseFloat(c.total),
    color: c.color,
    percentage: c.percentage,
  })) || [];

  const hasData = chartData.length > 0 && chartData.some((d) => d.value > 0);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Spending by Category</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['current', 'last3', 'last6', 'last12'] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-3 py-1 text-sm rounded-full transition ${
              preset === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'current' && 'Current Month'}
            {p === 'last3' && 'Last 3M'}
            {p === 'last6' && 'Last 6M'}
            {p === 'last12' && 'Last 12M'}
          </button>
        ))}
        <button
          onClick={() => setPreset('custom')}
          className={`px-3 py-1 text-sm rounded-full transition ${
            preset === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom
        </button>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap gap-2 mb-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      )}

      {data && !hasData && (
        <div className="text-center py-8 text-gray-600">
          No expense transactions in this period.
        </div>
      )}

      {data && hasData && (
        <>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: { payload: { percentage: number } }) => [
                    `${formatCurrency(value, data.baseCurrency)} (${props.payload.percentage.toFixed(1)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  formatter={(value: string) => <span className="text-gray-700 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Total Spending</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(data.totalSpending, data.baseCurrency)}
            </p>
          </div>

          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {data.categories.map((cat) => (
              <div
                key={cat.categoryId || 'uncategorized'}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-gray-700">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatCurrency(cat.total, data.baseCurrency)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
