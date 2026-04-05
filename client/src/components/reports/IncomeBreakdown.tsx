import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import type { CategorySummaryResponse } from '../../types/dashboard';

export interface IncomeBreakdownProps {
  dateFrom: string;
  dateTo: string;
}

export function IncomeBreakdown({ dateFrom, dateTo }: IncomeBreakdownProps) {
  const [data, setData] = useState<CategorySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardApi.categorySummary(dateFrom, dateTo, 'income');
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch income data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Income Sources</h2>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-[280px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Income Sources</h2>
        <p className="text-red-700 mb-2">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            dashboardApi.categorySummary(dateFrom, dateTo, 'income')
              .then(setData)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
          }}
          className="text-red-600 underline"
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Income Sources</h2>

      {!hasData && (
        <div className="text-center py-8 text-gray-600">
          No income transactions in this period.
        </div>
      )}

      {hasData && data && (
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
                  formatter={(value, name, props) => [
                    `${formatCurrency(value as number, data.baseCurrency)} (${(props as { payload: { percentage: number } }).payload.percentage.toFixed(1)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Total Income</p>
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
