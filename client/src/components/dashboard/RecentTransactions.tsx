import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { transactionsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/currency';
import type { Transaction } from '../../types/transaction';

export function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await transactionsApi.list({ limit: 10, page: 1, convertToBase: true });
      setTransactions(result.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeSign = (type: string) => {
    switch (type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
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

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600 mb-4">No transactions yet.</p>
        <Link to="/transactions" className="text-blue-600 hover:underline">
          Add your first transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Link to="/transactions" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              {tx.category && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tx.category.color || '#9ca3af' }}
                />
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {tx.category?.name || 'Uncategorized'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.date).toLocaleDateString()} • {tx.account?.name}
                </p>
              </div>
            </div>
            <div className={`font-semibold ${getTypeColor(tx.type)}`}>
              {getTypeSign(tx.type)}
              {tx.convertedAmount
                ? formatCurrency(tx.convertedAmount, user?.baseCurrency || 'EGP')
                : formatCurrency(tx.amount, tx.account?.currency || 'EGP')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
