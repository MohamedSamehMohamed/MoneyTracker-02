import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import type { SpendingChartResponse } from '../../types/dashboard';

function formatMonthLabel(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function SpendingChart() {
  const [data, setData] = useState<SpendingChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardApi.spendingChart(6);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spending data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={fetchData} className="text-red-600 underline mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.months.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-2">Income vs Expense</h3>
        <p className="text-gray-600">No transaction data available for the last 6 months.</p>
      </div>
    );
  }

  const chartData = data.months.map((m) => ({
    month: formatMonthLabel(m.month),
    income: parseFloat(m.totalIncome),
    expense: parseFloat(m.totalExpense),
    netFlow: parseFloat(m.netFlow),
  }));

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h3 className="font-semibold text-gray-900 mb-2">Income vs Expense</h3>
        <p className="text-gray-600">No income or expense transactions in the last 6 months.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Income vs Expense (Last 6 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value, data.baseCurrency),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar
            dataKey="income"
            fill="#10b981"
            name="Income"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expense"
            fill="#ef4444"
            name="Expense"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
