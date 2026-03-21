import { useState, useEffect } from 'react';
import { stocksApi, accountsApi } from '../services/api';
import type { Account } from '../types/account';
import type { CreateStockTransactionInput } from '../types/stock';
import { StockTransactionFormModal } from '../components/stocks/StockTransactionFormModal';

export default function StocksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    async function loadAccounts() {
      try {
        setIsLoading(true);
        const result = await accountsApi.list();
        setAccounts(result.accounts);
      } catch (err: any) {
        setError(err.error || 'Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const handleFormSubmit = async (data: CreateStockTransactionInput) => {
    try {
      setSubmitError(null);
      await stocksApi.create(data);
      setIsFormOpen(false);
      // Could refresh portfolio/list here
    } catch (err: any) {
      setSubmitError(err.error || 'Failed to save transaction');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stock Portfolio</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Record Purchase
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Portfolio Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Portfolio</h2>
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <p className="text-gray-500">Loading portfolio...</p>
            ) : (
              <p className="text-gray-500">Portfolio section coming soon...</p>
            )}
          </div>
        </section>

        {/* Transaction History Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transaction History</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Transaction history coming soon...</p>
          </div>
        </section>
      </div>

      {/* Form Modal */}
      <StockTransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSubmitError(null);
        }}
        onSubmit={handleFormSubmit}
        accounts={accounts}
        error={submitError || undefined}
        isLoading={false}
      />
    </div>
  );
}
