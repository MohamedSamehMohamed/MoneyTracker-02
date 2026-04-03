import { useState, useCallback, useEffect } from 'react';
import { NetWorthCard } from '../components/dashboard/NetWorthCard';
import { AccountBalanceCards } from '../components/dashboard/AccountBalanceCards';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { ExchangeRateIndicator } from '../components/dashboard/ExchangeRateIndicator';
import { SpendingChart } from '../components/dashboard/SpendingChart';
import { CategoryBreakdown } from '../components/dashboard/CategoryBreakdown';
import { IncomeExpenseTrend } from '../components/dashboard/IncomeExpenseTrend';
import { QuickAddTransaction } from '../components/dashboard/QuickAddTransaction';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { exchangeRatesApi } from '../services/api';

interface NetWorthBreakdown {
  accountId: string;
  accountName: string;
  accountType: string;
  originalCurrency: string;
  originalBalance: string;
  convertedBalance: string;
  rate: string;
  isApproximate: boolean;
}

interface NetWorthData {
  baseCurrency: string;
  totalNetWorth: string;
  breakdown: NetWorthBreakdown[];
  lastRateUpdate: string;
}

export function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
  const [netWorthLoading, setNetWorthLoading] = useState(true);
  const [netWorthError, setNetWorthError] = useState<string | null>(null);

  const fetchNetWorth = useCallback(async () => {
    try {
      setNetWorthLoading(true);
      setNetWorthError(null);
      const data = await exchangeRatesApi.netWorth();
      setNetWorthData(data);
    } catch (err) {
      setNetWorthError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setNetWorthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetWorth();
  }, [fetchNetWorth, refreshKey]);

  const handleTransactionCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <ErrorBoundary>
            <NetWorthCard 
              data={netWorthData} 
              loading={netWorthLoading} 
              error={netWorthError} 
              onRefresh={fetchNetWorth} 
            />
          </ErrorBoundary>
        </div>
        <div className="lg:col-span-1">
          <ErrorBoundary>
            <ExchangeRateIndicator />
          </ErrorBoundary>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Balances</h2>
        <ErrorBoundary>
          <AccountBalanceCards 
            data={netWorthData} 
            loading={netWorthLoading} 
            error={netWorthError} 
            onRetry={fetchNetWorth} 
          />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ErrorBoundary>
          <SpendingChart key={`spending-${refreshKey}`} />
        </ErrorBoundary>
        <ErrorBoundary>
          <CategoryBreakdown key={`category-${refreshKey}`} />
        </ErrorBoundary>
      </div>

      <div className="mb-6">
        <ErrorBoundary>
          <IncomeExpenseTrend key={`trend-${refreshKey}`} />
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <RecentTransactions key={`recent-${refreshKey}`} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <QuickAddTransaction onTransactionCreated={handleTransactionCreated} />
      </ErrorBoundary>
    </div>
  );
}
