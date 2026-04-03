import { formatCurrency } from '../../utils/currency';

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

interface NetWorthCardProps {
  data: NetWorthData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function NetWorthCard({ data, loading, error, onRefresh }: NetWorthCardProps) {
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
          onClick={onRefresh}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No accounts found. Create an account to see your net worth.</p>
      </div>
    );
  }

  const isStale = data.lastRateUpdate && 
    (new Date().getTime() - new Date(data.lastRateUpdate).getTime()) > 86400000;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Total Net Worth</h2>
            {isStale && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mb-2">
                ⚠️ Rates may be outdated
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(data.totalNetWorth, data.baseCurrency)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-700 transition px-3 py-1 rounded hover:bg-blue-50"
        >
          Refresh
        </button>
      </div>

      <div className="text-sm text-gray-500 mb-6">
        Last updated: {new Date(data.lastRateUpdate).toLocaleString()}
      </div>

      {data.breakdown.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Account Breakdown</h3>
          {data.breakdown.map((account) => {
            const rate = parseFloat(account.rate);
            const rateUnavailable = rate === 1 && account.originalCurrency !== data.baseCurrency;

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
                      formatCurrency(account.convertedBalance, data.baseCurrency)
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
