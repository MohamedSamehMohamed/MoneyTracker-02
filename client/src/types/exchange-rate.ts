export interface ExchangeRateItem {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  source: 'auto' | 'manual';
  fetchedAt: string;
}

export type ExchangeRate = ExchangeRateItem;

export interface NetWorthBreakdown {
  accountId: string;
  accountName: string;
  accountType: string;
  originalCurrency: string;
  originalBalance: string;
  convertedBalance: string;
  rate: string;
  isApproximate: boolean;
}

export interface NetWorthData {
  baseCurrency: string;
  totalNetWorth: string;
  breakdown: NetWorthBreakdown[];
  lastRateUpdate: string;
}

export interface ConvertResponse {
  convertedAmount: string;
  rate: string;
  isApproximate: boolean;
  rateDate?: string;
}

export interface ListRatesResponse {
  rates: ExchangeRateItem[];
  baseCurrency: string;
  lastUpdated: string;
}

export interface FetchRatesResponse {
  message: string;
  ratesUpdated: number;
  fetchedAt: string;
}

export type NetWorthResponse = NetWorthData;
