import { useEffect, useState } from 'react';
import { dashboardApi } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import type { SpendingChartResponse } from '../../types/dashboard';

export function MonthlyComparison() {
  const [data, setData] = useState<SpendingChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dashboardApi.spendingChart(2);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch monthly data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const computeChange = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return { absolute: 0, percentage: 0, display: 'N/A', isPositive: false };
      return { absolute: current, percentage: 100, display: 'New', isPositive: true };
    }
    const absolute = current - previous;
    const percentage = ((current - previous) / previous) * 100;
    const isPositive = absolute >= 0;
    return { absolute, percentage, display: `${absolute >= 0 ? '+' : ''}${percentage.toFixed(1)}%`, isPositive };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly Comparison</h2>
        <p className="text-red-700 mb-2">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            dashboardApi.spendingChart(2)
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

  if (!data || data.months.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h2>
        <div className="text-center py-8 text-gray-600">
          No transaction data available.
        </div>
      </div>
    );
  }

  const sortedMonths = [...data.months].sort((a, b) => a.month.localeCompare(b.month));

  const current = sortedMonths[sortedMonths.length - 1];
  const previous = sortedMonths[sortedMonths.length - 2];

  const incomeChange = computeChange(parseFloat(current.totalIncome), parseFloat(previous?.totalIncome || '0'));
  const expenseChange = computeChange(parseFloat(current.totalExpense), parseFloat(previous?.totalExpense || '0'));

  const getChangeIndicator = (change: { absolute: number; percentage: number; display: string; isPositive: boolean }, type: 'income' | 'expense') => {
    if (change.display === 'N/A' || change.display === 'New') {
      return <span className="text-gray-500 text-sm">{change.display}</span>;
    }

    const isImprovement = type === 'income' ? change.isPositive : !change.isPositive;
    const color = isImprovement ? 'text-green-600' : 'text-red-600';
    const arrow = change.absolute > 0 ? '↑' : change.absolute < 0 ? '↓' : '→';

    return (
      <span className={`${color} text-sm flex items-center gap-1`}>
        {arrow} {change.display}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h2>

      {sortedMonths.length === 1 ? (
        <div className="text-center py-8 text-gray-600">
          Only one month of data available. Need more data for comparison.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">{formatMonthLabel(previous.month)}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(previous.totalIncome, data.baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expenses</span>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(previous.totalExpense, data.baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">Net Flow</span>
                  <span className={`font-medium ${parseFloat(previous.netFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(previous.netFlow, data.baseCurrency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-2">{formatMonthLabel(current.month)} (Current)</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income</span>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(current.totalIncome, data.baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expenses</span>
                  <span className="text-red-600 font-medium">
                    {formatCurrency(current.totalExpense, data.baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">Net Flow</span>
                  <span className={`font-medium ${parseFloat(current.netFlow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(current.netFlow, data.baseCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Income Change</span>
              {getChangeIndicator(incomeChange, 'income')}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expense Change</span>
              {getChangeIndicator(expenseChange, 'expense')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
