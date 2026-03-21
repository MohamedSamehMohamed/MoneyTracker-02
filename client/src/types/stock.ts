// Stock portfolio tracking types

export type StockTransactionType = 'buy' | 'sell';

export interface StockTransaction {
  id: string;
  userId: string;
  type: StockTransactionType;
  company: string;
  shares: string; // Decimal as string (Decimal(18,8))
  pricePerShare: string; // Decimal as string (Decimal(18,2))
  currency: string;
  date: string; // ISO date string (YYYY-MM-DD)
  note?: string;
  realizedGain?: string; // Decimal as string for sell transactions
  accountId?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface StockHolding {
  company: string;
  currency: string;
  totalShares: string; // Decimal as string
  totalInvested: string; // Decimal as string
  averageCostPerShare: string; // Decimal as string
  totalRealizedGain: string; // Decimal as string
}

export interface CreateStockTransactionInput {
  type: StockTransactionType;
  company: string;
  shares: string | number;
  pricePerShare: string | number;
  currency: string;
  date: string; // ISO date string (YYYY-MM-DD)
  note?: string;
  accountId?: string;
}

export interface UpdateStockTransactionInput {
  shares?: string | number;
  pricePerShare?: string | number;
  note?: string;
  date?: string;
}

export interface StockTransactionFilters {
  company?: string;
  type?: StockTransactionType | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface StockTransactionListResponse {
  items: StockTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PortfolioResponse {
  holdings: StockHolding[];
  totalInvestedAcrossCurrencies: Record<string, string>; // Map of currency to total
}
