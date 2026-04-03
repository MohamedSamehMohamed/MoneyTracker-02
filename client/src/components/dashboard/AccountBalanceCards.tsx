import { Link } from 'react-router-dom';
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

function getAccountTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    cash: '💵',
    bank: '🏦',
    wallet: '👛',
    gold: '🥇',
  };
  return icons[type] || '💰';
}

interface AccountBalanceCardsProps {
  data: NetWorthData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AccountBalanceCards({ data, loading, error, onRetry }: AccountBalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={onRetry} className="text-red-600 underline mt-2">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.breakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">No accounts yet.</p>
        <Link to="/accounts" className="text-blue-600 hover:underline">
          Create your first account
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.breakdown.map((account) => {
        const rate = parseFloat(account.rate);
        const rateUnavailable = rate === 1 && account.originalCurrency !== data.baseCurrency;

        return (
          <div key={account.accountId} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getAccountTypeIcon(account.accountType)}</span>
              <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
            </div>
            <div className="mb-1">
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(account.originalBalance, account.originalCurrency)}
              </p>
            </div>
            {account.originalCurrency !== data.baseCurrency && (
              <div className="text-sm text-gray-500">
                {rateUnavailable ? (
                  <span className="text-orange-600">Rate unavailable</span>
                ) : (
                  <span>
                    {formatCurrency(account.convertedBalance, data.baseCurrency)}
                    {account.isApproximate && ' (approx)'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
