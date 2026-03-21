import { useState, useEffect } from 'react';
import { stocksApi, accountsApi } from '../services/api';
import type { Account } from '../types/account';
import type { CreateStockTransactionInput, PortfolioResponse, StockTransactionFilters, StockTransactionListResponse, StockTransaction } from '../types/stock';
import { StockTransactionFormModal } from '../components/stocks/StockTransactionFormModal';
import { StockPortfolioList } from '../components/stocks/StockPortfolioList';
import { StockTransactionList } from '../components/stocks/StockTransactionList';
import { StockFilters } from '../components/stocks/StockFilters';
import { DeleteStockTransactionDialog } from '../components/stocks/DeleteStockTransactionDialog';

export default function StocksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'buy' | 'sell'>('buy');
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockTransaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [transactions, setTransactions] = useState<StockTransactionListResponse | null>(null);
  const [filters, setFilters] = useState<StockTransactionFilters>({ page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [accountsResult, portfolioResult, transactionsResult] = await Promise.all([
          accountsApi.list(),
          stocksApi.portfolio(),
          stocksApi.list(filters),
        ]);
        setAccounts(accountsResult.accounts);
        setPortfolio(portfolioResult);
        setTransactions(transactionsResult);
      } catch (err: any) {
        setError(err.error || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const loadPortfolio = async () => {
    try {
      setIsLoadingPortfolio(true);
      const result = await stocksApi.portfolio();
      setPortfolio(result);
    } catch (err: any) {
      setError(err.error || 'Failed to load portfolio');
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const loadTransactions = async (currentFilters: StockTransactionFilters = filters) => {
    try {
      setIsLoadingTransactions(true);
      const result = await stocksApi.list(currentFilters);
      setTransactions(result);
    } catch (err: any) {
      setError(err.error || 'Failed to load transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleFilterChange = (newFilters: StockTransactionFilters) => {
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    loadTransactions(newFilters);
  };

  const handleFormSubmit = async (data: CreateStockTransactionInput) => {
    try {
      setSubmitError(null);
      if (editingTransaction) {
        // Edit mode
        await stocksApi.update(editingTransaction.id, data);
      } else {
        // Create mode
        await stocksApi.create(data);
      }
      setIsFormOpen(false);
      setEditingTransaction(null);
      // Refresh both portfolio and transactions after transaction change
      await Promise.all([loadPortfolio(), loadTransactions(filters)]);
    } catch (err: any) {
      setSubmitError(err.error || 'Failed to save transaction');
    }
  };

  const handleEdit = (transaction: StockTransaction) => {
    setEditingTransaction(transaction);
    setFormType(transaction.type as 'buy' | 'sell');
    setIsFormOpen(true);
  };

  const handleDeleteClick = (transaction: StockTransaction) => {
    setDeleteTarget(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeletingTransaction(true);
      await stocksApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      // Refresh both portfolio and transactions after deletion
      await Promise.all([loadPortfolio(), loadTransactions(filters)]);
    } catch (err: any) {
      setError(err.error || 'Failed to delete transaction');
    } finally {
      setIsDeletingTransaction(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stock Portfolio</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormType('buy');
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Record Purchase
            </button>
            <button
              onClick={() => {
                setFormType('sell');
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              + Record Sale
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Portfolio Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Portfolio</h2>
            {portfolio && portfolio.holdings.length > 0 && (
              <button
                onClick={loadPortfolio}
                disabled={isLoadingPortfolio}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {isLoadingPortfolio ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            {isLoading ? (
              <p className="text-gray-500">Loading portfolio...</p>
            ) : (
              <>
                <StockPortfolioList
                  holdings={portfolio?.holdings || []}
                  isLoading={isLoadingPortfolio}
                />

                {portfolio && portfolio.holdings.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Total Invested by Currency
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(portfolio.totalInvestedAcrossCurrencies).map(
                        ([currency, amount]) => (
                          <div key={currency} className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">{currency}</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {parseFloat(amount).toFixed(2)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Transaction History Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transaction History</h2>

          {/* Filters */}
          <StockFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* Transaction List */}
          <StockTransactionList
            data={transactions}
            isLoading={isLoadingTransactions}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </section>
      </div>

      {/* Form Modal */}
      <StockTransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
          setSubmitError(null);
        }}
        onSubmit={handleFormSubmit}
        accounts={accounts}
        editingTransaction={editingTransaction}
        error={submitError || undefined}
        isLoading={false}
        initialType={formType}
      />

      {/* Delete Dialog */}
      <DeleteStockTransactionDialog
        isOpen={!!deleteTarget}
        isLoading={isDeletingTransaction}
        company={deleteTarget?.company}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
