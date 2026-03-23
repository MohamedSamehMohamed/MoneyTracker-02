import { useState } from 'react';
import type { StockHolding } from '../../types/stock';
import { formatShares, formatPrice, formatCurrency } from '../../utils/formatters';
import { stocksApi } from '../../services/api';

interface StockPortfolioCardProps {
  holding: StockHolding;
  onPriceUpdate?: () => void;
}

export function StockPortfolioCard({ holding, onPriceUpdate }: StockPortfolioCardProps) {
  const [currentPrice, setCurrentPrice] = useState(holding.currentPrice || '');
  const [isSaving, setIsSaving] = useState(false);

  const totalValue = parseFloat(holding.totalInvested);
  const shares = parseFloat(holding.totalShares);
  const avgCost = parseFloat(holding.averageCostPerShare);

  const handleSavePrice = async () => {
    if (!currentPrice || parseFloat(currentPrice) <= 0) return;

    try {
      setIsSaving(true);
      await stocksApi.setCurrentPrice({
        company: holding.company,
        price: currentPrice,
        currency: holding.currency,
      });
      onPriceUpdate?.();
    } catch (error) {
      console.error('Failed to save current price:', error);
      setCurrentPrice(holding.currentPrice || '');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMarketValue = holding.currentMarketValue
    ? parseFloat(holding.currentMarketValue)
    : null;
  const unrealizedGain = holding.unrealizedGain
    ? parseFloat(holding.unrealizedGain)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{holding.company}</h3>
        <p className="text-sm text-gray-500">{holding.currency}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Total Quantity
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatShares(shares)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {holding.company.toLowerCase() === 'gold' ? 'grams' : 'units'}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Avg Cost
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(avgCost)} {holding.currency}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Total Invested
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(totalValue)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Realized Gain
          </p>
          <p className={`text-lg font-semibold ${
            parseFloat(holding.totalRealizedGain) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(parseFloat(holding.totalRealizedGain))}
          </p>
        </div>

        <div className="col-span-2">
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Current Price ({holding.currency})
          </p>
          <input
            type="number"
            step="0.01"
            min="0"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            onBlur={handleSavePrice}
            disabled={isSaving}
            placeholder="Enter current price"
            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 disabled:bg-gray-100"
          />
        </div>

        {currentMarketValue !== null && (
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Current Value
            </p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(currentMarketValue)}
            </p>
          </div>
        )}

        {unrealizedGain !== null && (
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
              Unrealized Gain
            </p>
            <p className={`text-lg font-semibold ${
              unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(unrealizedGain)}
              {currentMarketValue && (
                <span className="text-sm ml-1">
                  ({((unrealizedGain / totalValue) * 100).toFixed(2)}%)
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
