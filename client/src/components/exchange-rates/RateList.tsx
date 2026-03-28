import React from 'react';
import type { ExchangeRateItem } from '../../types/exchange-rate';

/**
 * Determine adaptive precision for rate display based on magnitude
 * Major pairs (like USD/EUR) need fewer decimals
 * Precious metals and exotic rates need more precision
 */
function getAdaptivePrecision(rate: number): number {
  const absRate = Math.abs(rate);

  if (absRate >= 100) {
    // Large rates (like JPY pairs): 0-2 decimals
    return absRate >= 1000 ? 0 : 2;
  } else if (absRate >= 1) {
    // Normal rates (like USD/EUR): 4-6 decimals
    return 4;
  } else if (absRate >= 0.01) {
    // Small rates: 6-8 decimals
    return 6;
  } else {
    // Very small rates (precious metals): 8+ decimals
    return 8;
  }
}

interface RateListProps {
  rates: ExchangeRateItem[];
  baseCurrency: string;
  lastUpdated: string;
  onRefresh?: () => void;
  onOverride?: (from: string, to: string) => void;
  onRemoveOverride?: (from: string, to: string) => void;
}

export function RateList({
  rates,
  baseCurrency,
  lastUpdated,
  onRefresh,
  onOverride,
  onRemoveOverride,
}: RateListProps) {
  if (rates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No exchange rates available yet.</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Fetch Rates
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Exchange Rates</h2>
            <p className="text-sm text-gray-600">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              Refresh Rates
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Pair
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rates.map((rate) => (
              <tr key={`${rate.fromCurrency}-${rate.toCurrency}`} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">
                    {rate.fromCurrency}/{rate.toCurrency}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-900">
                    {parseFloat(rate.rate).toFixed(getAdaptivePrecision(parseFloat(rate.rate)))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      rate.source === 'manual'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {rate.source === 'manual' ? 'Manual' : 'Auto'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(rate.fetchedAt).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  {rate.source === 'auto' && onOverride && (
                    <button
                      onClick={() => onOverride(rate.fromCurrency, rate.toCurrency)}
                      className="text-blue-600 hover:text-blue-700 transition text-sm font-medium"
                    >
                      Override
                    </button>
                  )}
                  {rate.source === 'manual' && onRemoveOverride && (
                    <button
                      onClick={() => onRemoveOverride(rate.fromCurrency, rate.toCurrency)}
                      className="text-red-600 hover:text-red-700 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
