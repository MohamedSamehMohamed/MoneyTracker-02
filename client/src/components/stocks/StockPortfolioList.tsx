import type { StockHolding } from '../../types/stock';
import { StockPortfolioCard } from './StockPortfolioCard';

interface StockPortfolioListProps {
  holdings: StockHolding[];
  isLoading?: boolean;
}

export function StockPortfolioList({
  holdings,
  isLoading = false,
}: StockPortfolioListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading portfolio...</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">No stock holdings yet</p>
        <p className="text-sm text-gray-400">
          Record your first stock purchase to see your portfolio here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {holdings.map((holding) => (
        <StockPortfolioCard key={`${holding.company}-${holding.currency}`} holding={holding} />
      ))}
    </div>
  );
}
