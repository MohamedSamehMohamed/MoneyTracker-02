import { useState, useEffect, useCallback } from 'react';
import { transactionsApi, accountsApi, categoriesApi } from '../../services/api';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import type { Account, Category, CreateTransactionInput } from '../../types/transaction';

interface ApiError {
  error?: string;
}

interface QuickAddTransactionProps {
  onTransactionCreated: () => void;
}

export function QuickAddTransaction({ onTransactionCreated }: QuickAddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accountsRes, categoriesRes] = await Promise.all([
          accountsApi.list(),
          categoriesApi.list(),
        ]);
        setAccounts(accountsRes.accounts);
        setCategories(categoriesRes.categories);
      } catch {
        // Silently fail - modal will show empty accounts/categories
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleSubmit = async (data: CreateTransactionInput) => {
    try {
      setIsLoading(true);
      await transactionsApi.create(data);
      setIsOpen(false);
      onTransactionCreated();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      throw new Error(apiErr.error || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }
  }, [isOpen, handleClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center text-2xl font-bold transition-transform hover:scale-110 z-40"
        aria-label="Add transaction"
      >
        +
      </button>

      <TransactionFormModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        accounts={accounts}
        categories={categories}
        isLoading={isLoading}
      />
    </>
  );
}
