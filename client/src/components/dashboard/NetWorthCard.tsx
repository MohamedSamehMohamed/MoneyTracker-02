import { useEffect, useState } from 'react';
import { exchangeRatesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/currency';

interface NetWorthBreakdown {
  accountId: string;
  accountName: string;
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

export function NetWorthCard() {
  const { user } = useAuth();
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNetWorth();
  }, [user?.baseCurrency]);

  const fetchNetWorth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await exchangeRatesApi.netWorth();
      setNetWorth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch net worth');
      console.error('Error fetching net worth:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-300 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Net Worth</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchNetWorth}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!netWorth) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No accounts found. Create an account to see your net worth.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-medium text-gray-600 mb-2">Total Net Worth</h2>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(netWorth.totalNetWorth, netWorth.baseCurrency)}
          </p>
        </div>
        <button
          onClick={fetchNetWorth}
          className="text-sm text-blue-600 hover:text-blue-700 transition px-3 py-1 rounded hover:bg-blue-50"
        >
          Refresh
        </button>
      </div>

      <div className="text-sm text-gray-500 mb-6">
        Last updated: {new Date(netWorth.lastRateUpdate).toLocaleString()}
      </div>

      {netWorth.breakdown.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Account Breakdown</h3>
          {netWorth.breakdown.map((account) => {
            const rate = parseFloat(account.rate);
            const rateUnavailable = rate === 1 && account.originalCurrency !== netWorth.baseCurrency;

            return (
              <div key={account.accountId} className="flex justify-between items-start border-t pt-4">
                <div>
                  <p className="font-medium text-gray-900">{account.accountName}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(account.originalBalance, account.originalCurrency)}
                    {account.isApproximate && ' (approx)'}
                    {rateUnavailable && ' (rate unavailable)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {rateUnavailable ? (
                      <span className="text-orange-600">Rate unavailable</span>
                    ) : (
                      formatCurrency(account.convertedBalance, netWorth.baseCurrency)
                    )}
                  </p>
                  {!rateUnavailable && (
                    <p className="text-sm text-gray-500">
                      @ {rate.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
