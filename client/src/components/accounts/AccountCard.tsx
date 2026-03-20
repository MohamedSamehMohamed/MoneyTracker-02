import type { Account } from '../../types/account';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const accountTypeEmojis: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  wallet: '👜',
  gold: '🏆',
};

function formatBalance(balance: string, type: string): string {
  const numBalance = BigInt(balance);

  // Divide by 1000 for gold, 100 for currencies
  let divisor = 100n;
  let decimalPlaces = 2;
  if (type === 'gold') {
    divisor = 1000n;
    decimalPlaces = 3;
  }

  const wholeAmount = numBalance / divisor;
  const decimalAmount = numBalance % divisor;
  const decimalStr = decimalAmount.toString().padStart(decimalPlaces, '0');

  // Format with thousands separators (convert BigInt to Number for toLocaleString support)
  const formatted = Number(wholeAmount).toLocaleString('en-US') + '.' + decimalStr;

  return formatted;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const emoji = account.icon || accountTypeEmojis[account.type] || '📊';
  const formattedBalance = formatBalance(account.balance, account.type);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{emoji}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-600 capitalize">{account.type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(account)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(account)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-600">Balance</span>
          <span className="text-2xl font-bold text-gray-900">
            {formattedBalance}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Currency</span>
          <span className="font-medium">{account.currency}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Created {new Date(account.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
