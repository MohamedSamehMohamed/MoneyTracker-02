import type { StockHolding } from '../../types/stock';
import { formatShares, formatPrice, formatCurrency } from '../../utils/formatters';

interface StockPortfolioCardProps {
  holding: StockHolding;
}

export function StockPortfolioCard({ holding }: StockPortfolioCardProps) {
  const totalValue = parseFloat(holding.totalInvested);
  const shares = parseFloat(holding.totalShares);
  const avgCost = parseFloat(holding.averageCostPerShare);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{holding.company}</h3>
        <p className="text-sm text-gray-500">{holding.currency}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Total Shares
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {formatShares(shares)}
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
            {formatCurrency(totalValue, holding.currency)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
            Realized Gain
          </p>
          <p className={`text-lg font-semibold ${
            parseFloat(holding.totalRealizedGain) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(parseFloat(holding.totalRealizedGain), holding.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
