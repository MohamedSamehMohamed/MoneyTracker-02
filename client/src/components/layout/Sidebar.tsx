import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Money Tracker</h1>
        {user && <p className="text-sm text-gray-600 mt-2">{user.name}</p>}
      </div>

      <nav className="px-4 py-6 space-y-2 flex-1">
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
          to="/stocks"
          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          Stocks
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

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
