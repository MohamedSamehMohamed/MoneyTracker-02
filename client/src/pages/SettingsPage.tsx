import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const COMMON_CURRENCIES = [
  'EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'JPY', 'CHF', 'CAD',
  'AUD', 'NZD', 'BHD', 'OMR', 'TND', 'XAU'
];

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(user?.baseCurrency || 'EGP');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    try {
      setLoading(true);
      setMessage(null);
      await updateProfile(undefined, currency);
      setMessage({ type: 'success', text: 'Base currency updated successfully' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update currency',
      });
      // Revert on error
      setSelectedCurrency(user?.baseCurrency || 'EGP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences, currency, and other application settings.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>

        <div className="space-y-6">
          {/* User Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Base Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Base Currency
            </label>
            <p className="text-sm text-gray-600 mb-3">
              All conversions and net worth calculations will be displayed in this currency.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COMMON_CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  onClick={() => handleCurrencyChange(currency)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCurrency === currency
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currency}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Current selection: <strong>{selectedCurrency}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
