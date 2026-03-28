import { NetWorthCard } from '../components/dashboard/NetWorthCard';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <NetWorthCard />
          </ErrorBoundary>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-600 mb-4">Quick Stats</h2>
          <p className="text-gray-600">More stats coming soon...</p>
        </div>
      </div>
      <p className="text-gray-600">Welcome to your personal finance tracker. View your account overview and recent transactions here.</p>
    </div>
  );
}
