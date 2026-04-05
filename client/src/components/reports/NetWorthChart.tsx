import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export interface NetWorthChartProps {
  dateFrom: string;
  dateTo: string;
}

export function NetWorthChart({ dateFrom, dateTo }: NetWorthChartProps) {
  const [data, setData] = useState<{ baseCurrency: string; dateFrom: string; dateTo: string; granularity: string; dataPoints: { date: string; netWorth: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardApi.netWorthHistory(dateFrom, dateTo);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch net worth history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFrom, dateTo]);

  const granularityLabel = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    auto: 'Auto',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Over Time</h2>
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Net Worth Over Time</h2>
        <p className="text-red-700 mb-2">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            dashboardApi.netWorthHistory(dateFrom, dateTo)
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

  const hasData = data && data.dataPoints.length > 0;

  const chartData = data ? data.dataPoints.map((dp) => ({
    date: dp.date,
    netWorth: parseFloat(dp.netWorth),
  })) : [];

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (data?.granularity === 'daily' || data?.granularity === 'weekly') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Net Worth Over Time</h2>
        {data && (
          <p className="text-sm text-gray-500">
            {granularityLabel[data.granularity as keyof typeof granularityLabel]} granularity
          </p>
        )}
      </div>

      {!hasData && (
        <div className="text-center py-8 text-gray-600">
          No net worth data available for this period.
        </div>
      )}

      {hasData && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              style={{ fontSize: '12px', fill: '#6b7280' }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (data) {
                  return formatCurrency(value, data.baseCurrency);
                }
                return value.toString();
              }}
              style={{ fontSize: '12px', fill: '#6b7280' }}
              width={80}
            />
            <Tooltip
              formatter={(value: any) => {
                if (value === undefined || value === null) {
                  return ['N/A', 'Net Worth'];
                }
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                if (data) {
                  return [formatCurrency(numValue, data.baseCurrency), 'Net Worth'];
                }
                return [numValue.toString(), 'Net Worth'];
              }}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
