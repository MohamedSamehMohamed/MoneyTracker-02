import { useState } from 'react';
import { DateRangeSelector } from '../components/reports/DateRangeSelector';
import { SpendingBreakdown } from '../components/reports/SpendingBreakdown';
import { IncomeBreakdown } from '../components/reports/IncomeBreakdown';
import { NetWorthChart } from '../components/reports/NetWorthChart';
import { MonthlyComparison } from '../components/reports/MonthlyComparison';
import { ExportButton } from '../components/reports/ExportButton';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return sixMonthsAgo.toISOString().split('T')[0];
  });

  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const handleDateRangeChange = (newDateFrom: string, newDateTo: string) => {
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <ExportButton dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      <div className="mb-6">
        <DateRangeSelector
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className="mb-6">
        <ErrorBoundary>
          <NetWorthChart
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <SpendingBreakdown
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <IncomeBreakdown
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </ErrorBoundary>
      </div>

      <div className="mt-6">
        <ErrorBoundary>
          <MonthlyComparison />
        </ErrorBoundary>
      </div>
    </div>
  );
}
