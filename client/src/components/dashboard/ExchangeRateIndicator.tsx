import { useEffect, useState } from 'react';
import { exchangeRatesApi } from '../../services/api';

interface RateInfo {
  fromCurrency: string;
  toCurrency: string;
  fetchedAt: string;
}

export function ExchangeRateIndicator() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await exchangeRatesApi.list();
      if (result.rates && result.rates.length > 0) {
        const dates = result.rates.map((r: RateInfo) => new Date(r.fetchedAt));
        const mostRecent = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
        setLastUpdate(mostRecent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await exchangeRatesApi.fetch();
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh rates');
    } finally {
      setRefreshing(false);
    }
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const isStale = lastUpdate && (new Date().getTime() - lastUpdate.getTime()) > 86400000;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (!lastUpdate) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-600 text-sm">No exchange rate data available</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-blue-600 text-sm mt-2 hover:underline disabled:opacity-50"
        >
          {refreshing ? 'Fetching...' : 'Fetch rates'}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow p-4 ${isStale ? 'bg-yellow-50 border border-yellow-200' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">Exchange Rates</h3>
            {isStale && (
              <span className="text-yellow-600 text-xs flex items-center gap-1">
                ⚠️ May be outdated
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Last updated: {getRelativeTime(lastUpdate)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-blue-600 text-sm hover:underline disabled:opacity-50 px-2 py-1"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
