import { useState, useEffect, useCallback } from 'react';
import { transactionsApi, accountsApi, categoriesApi } from '../services/api';
import type { Account, Category, Transaction, TransactionFilters } from '../types/transaction';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { TransactionFilters as TransactionFiltersComponent } from '../components/transactions/TransactionFilters';
import { TransactionList } from '../components/transactions/TransactionList';
import { DeleteTransactionDialog } from '../components/transactions/DeleteTransactionDialog';

export function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts and categories
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [accountsRes, categoriesRes] = await Promise.all([
          accountsApi.list(),
          categoriesApi.list(),
        ]);

        setAccounts(accountsRes.accounts);
        setCategories(categoriesRes.categories);
      } catch (err: any) {
        const message = typeof err === 'string' ? err : err.error || 'Failed to load data';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaticData();
  }, []);

  // Load transactions when filters change
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsListLoading(true);
        setError(null);

        const result = await transactionsApi.list(filters);
        setTransactions(result.transactions);
        setPagination(result.pagination);
      } catch (err: any) {
        const message = typeof err === 'string' ? err : err.error || 'Failed to load transactions';
        setError(message);
      } finally {
        setIsListLoading(false);
      }
    };

    loadTransactions();
  }, [filters]);

  const handleFilterChange = useCallback((newFilters: TransactionFilters) => {
    setFilters({
      ...newFilters,
      page: 1,
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  const handleConvertToBaseToggle = useCallback((convertToBase: boolean) => {
    // Add convertToBase as a query parameter through filters
    setFilters((prev) => ({
      ...prev,
      page: 1,
      // Store convertToBase in a way that can be passed to the API
      ...(convertToBase && { convertToBase: true }),
    }));
  }, []);

  const handleCreateOrUpdateTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingTransaction) {
        // Update mode - only send fields that changed
        const updateData: any = {};

        // Convert current amount to smallest units for comparison
        const selectedAccount = accounts.find((a) => a.id === editingTransaction.accountId);
        const multiplier = selectedAccount?.currency === 'GOLD_GRAM' ? 1000 : 100;
        const currentAmountInSmallestUnit = Math.round(parseFloat(editingTransaction.amount) * multiplier);

        if (data.amount !== undefined && data.amount !== currentAmountInSmallestUnit) {
          updateData.amount = data.amount;
        }
        if (data.categoryId !== undefined && data.categoryId !== editingTransaction.categoryId) {
          updateData.categoryId = data.categoryId || null;
        }
        if (data.note !== undefined && data.note !== (editingTransaction.note || '')) {
          updateData.note = data.note || null;
        }
        if (data.date !== undefined && data.date !== editingTransaction.date) {
          updateData.date = data.date;
        }

        await transactionsApi.update(editingTransaction.id, updateData);
        setEditingTransaction(null);
      } else {
        // Create mode
        await transactionsApi.create(data);
      }

      setIsFormOpen(false);

      // Reload transactions
      const result = await transactionsApi.list(filters);
      setTransactions(result.transactions);
      setPagination(result.pagination);
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err.error || 'Failed to save transaction';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      setIsDeletingLoading(true);
      setError(null);

      await transactionsApi.delete(deletingTransaction.id);
      setDeletingTransaction(null);

      // Reload transactions
      const result = await transactionsApi.list(filters);
      setTransactions(result.transactions);
      setPagination(result.pagination);
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err.error || 'Failed to delete transaction';
      setError(message);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <button
            onClick={openCreateForm}
            disabled={isListLoading || isSubmitting || isDeletingLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Transaction
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => {
                setError(null);
                const result = transactionsApi.list(filters);
                result.then(({ transactions, pagination }) => {
                  setTransactions(transactions);
                  setPagination(pagination);
                }).catch((err: any) => {
                  const message = typeof err === 'string' ? err : err.error || 'Failed to load transactions';
                  setError(message);
                });
              }}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        <TransactionFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }}
          onSubmit={handleCreateOrUpdateTransaction}
          accounts={accounts}
          categories={categories}
          initialData={editingTransaction || undefined}
          isLoading={isSubmitting}
        />

        <DeleteTransactionDialog
          isOpen={!!deletingTransaction}
          transaction={deletingTransaction}
          onConfirm={handleDeleteTransaction}
          onCancel={() => setDeletingTransaction(null)}
          isLoading={isDeletingLoading}
        />

        <TransactionFiltersComponent
          filters={filters}
          accounts={accounts}
          categories={categories}
          onFilterChange={handleFilterChange}
        />

        <TransactionList
          transactions={transactions}
          pagination={pagination}
          onPageChange={handlePageChange}
          onEdit={openEditForm}
          onDelete={(transaction) => setDeletingTransaction(transaction)}
          onAddNew={openCreateForm}
          isLoading={isListLoading}
          onConvertToBaseToggle={handleConvertToBaseToggle}
        />
      </div>
    </div>
  );
}
