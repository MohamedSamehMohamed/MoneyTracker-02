import type { Account } from '../../types/account';
import { AccountCard } from './AccountCard';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onAddClick?: () => void;
}

export function AccountList({
  accounts,
  onEdit,
  onDelete,
  onAddClick,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts yet</h3>
        <p className="text-gray-600 mb-6">Start by creating your first account to track your finances.</p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
          >
            Add Account
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
