import { Link } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Money Tracker</h1>
      </div>

      <nav className="px-4 py-6 space-y-2">
        <Link
          to="/dashboard"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Dashboard
        </Link>
        <Link
          to="/transactions"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Transactions
        </Link>
        <Link
          to="/new-transaction"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          New Transaction
        </Link>
        <Link
          to="/accounts"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Accounts
        </Link>
        <Link
          to="/categories"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Categories
        </Link>
        <Link
          to="/reports"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Reports
        </Link>
        <Link
          to="/settings"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}
