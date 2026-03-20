import { useState, useEffect } from 'react';
import { accountsApi } from '../services/api';
import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/account';
import { AccountFormModal } from '../components/accounts/AccountFormModal';
import { AccountList } from '../components/accounts/AccountList';
import { DeleteAccountDialog } from '../components/accounts/DeleteAccountDialog';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await accountsApi.list();
      setAccounts(response.accounts || []);
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      setError(
        error?.error || 'Failed to load accounts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleFormSubmit = async (data: CreateAccountInput | UpdateAccountInput) => {
    try {
      if (editingAccount) {
        await accountsApi.update(editingAccount.id, data as UpdateAccountInput);
      } else {
        await accountsApi.create(data as CreateAccountInput);
      }
      await fetchAccounts();
      setIsFormOpen(false);
      setEditingAccount(null);
    } catch (error) {
      console.error('Failed to save account:', error);
      throw error;
    }
  };

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account);
    setDeleteError('');
  };

  const handleConfirmDelete = async (account: Account) => {
    try {
      setIsDeletingLoading(true);
      await accountsApi.delete(account.id);
      await fetchAccounts();
      setDeletingAccount(null);
    } catch (error: any) {
      const message =
        error?.error || 'Failed to delete account. Please try again.';
      setDeleteError(message);
      throw error;
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingAccount(null);
    setDeleteError('');
  };

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-red-800 font-medium">⚠️ Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchAccounts}
            className="px-4 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600">Manage your bank accounts, wallets, cash, and other money sources.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          + Add Account
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <div className="inline-flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-400">Loading accounts...</p>
        </div>
      ) : (
        <AccountList
          accounts={accounts}
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
          onAddClick={handleOpenCreate}
        />
      )}

      <AccountFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={editingAccount || undefined}
      />

      <DeleteAccountDialog
        isOpen={!!deletingAccount}
        account={deletingAccount}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeletingLoading}
      />

      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-lg max-w-sm flex items-center justify-between gap-4">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError('')}
            className="text-red-700 hover:text-red-900 font-bold"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
