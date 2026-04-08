import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/account';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters, Category, TransactionListResponse } from '../types/transaction';
import type { StockTransaction, CreateStockTransactionInput, UpdateStockTransactionInput, StockTransactionFilters, StockTransactionListResponse, PortfolioResponse } from '../types/stock';
import type { ExchangeRate, ConvertResponse, NetWorthResponse, ListRatesResponse, FetchRatesResponse } from '../types/exchange-rate';
import type { SpendingChartResponse, CategorySummaryResponse, IncomeVsExpenseResponse } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(fetchOptions.headers);

  // Only set Content-Type for requests with a body
  if (fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = localStorage.getItem("authToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}` };
    }
    throw errorData;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  getMe: () => apiFetch("/auth/me", { method: "GET" }),

  updateProfile: (data: { name?: string; baseCurrency?: string }) =>
    apiFetch("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const accountsApi = {
  list: () => apiFetch<{ accounts: Account[] }>("/accounts", { method: "GET" }),

  create: (data: CreateAccountInput) =>
    apiFetch<{ account: Account }>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateAccountInput) =>
    apiFetch<{ account: Account }>(`/accounts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/accounts/${id}`, {
      method: "DELETE",
    }),
};

export const transactionsApi = {
  list: (filters?: TransactionFilters) => {
    const params = new URLSearchParams();
    if (filters?.page !== undefined) params.append("page", filters.page.toString());
    if (filters?.limit !== undefined) params.append("limit", filters.limit.toString());
    if (filters?.accountId !== undefined) params.append("accountId", filters.accountId);
    if (filters?.categoryId !== undefined) params.append("categoryId", filters.categoryId);
    if (filters?.type !== undefined) params.append("type", filters.type);
    if (filters?.dateFrom !== undefined) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo !== undefined) params.append("dateTo", filters.dateTo);
    if (filters?.convertToBase !== undefined) params.append("convertToBase", filters.convertToBase.toString());

    const query = params.toString();
    const endpoint = query ? `/transactions?${query}` : "/transactions";
    return apiFetch<TransactionListResponse>(endpoint, { method: "GET" });
  },

  get: (id: string) =>
    apiFetch<{ transaction: Transaction }>(`/transactions/${id}`, {
      method: "GET",
    }),

  create: (data: CreateTransactionInput) =>
    apiFetch<{ transaction: Transaction }>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTransactionInput) =>
    apiFetch<{ transaction: Transaction }>(`/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/transactions/${id}`, {
      method: "DELETE",
    }),

  exportCsv: async (filters: { dateFrom: string; dateTo: string; accountId?: string; categoryId?: string; type?: "income" | "expense" | "transfer" }) => {
    const params = new URLSearchParams();
    params.append("dateFrom", filters.dateFrom);
    params.append("dateTo", filters.dateTo);
    if (filters.accountId) params.append("accountId", filters.accountId);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.type) params.append("type", filters.type);

    const url = `${API_BASE_URL}/transactions/export?${params.toString()}`;
    const token = localStorage.getItem("authToken");

    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}` };
      }
      throw errorData;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `transactions_${filters.dateFrom}_${filters.dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export const categoriesApi = {
  list: (type?: string) => {
    const query = type ? `?type=${type}` : "";
    return apiFetch<{ categories: Category[] }>(`/categories${query}`, {
      method: "GET",
    });
  },

  create: (data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }) =>
    apiFetch<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; icon?: string; color?: string }) =>
    apiFetch<{ category: Category }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/categories/${id}`, {
      method: "DELETE",
    }),
};

export const stocksApi = {
  list: (filters?: StockTransactionFilters) => {
    const params = new URLSearchParams();
    if (filters?.page !== undefined) params.append("page", filters.page.toString());
    if (filters?.limit !== undefined) params.append("limit", filters.limit.toString());
    if (filters?.company !== undefined) params.append("company", filters.company);
    if (filters?.type !== undefined) params.append("type", filters.type);
    if (filters?.dateFrom !== undefined) params.append("dateFrom", filters.dateFrom);
    if (filters?.dateTo !== undefined) params.append("dateTo", filters.dateTo);

    const query = params.toString();
    const endpoint = query ? `/stocks?${query}` : "/stocks";
    return apiFetch<StockTransactionListResponse>(endpoint, { method: "GET" });
  },

  get: (id: string) =>
    apiFetch<{ transaction: StockTransaction }>(`/stocks/${id}`, {
      method: "GET",
    }),

  create: (data: CreateStockTransactionInput) =>
    apiFetch<{ transaction: StockTransaction }>("/stocks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateStockTransactionInput) =>
    apiFetch<{ transaction: StockTransaction }>(`/stocks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/stocks/${id}`, {
      method: "DELETE",
    }),

  portfolio: () =>
    apiFetch<PortfolioResponse>("/stocks/portfolio", {
      method: "GET",
    }),

  setCurrentPrice: (data: { company: string; price: string; currency: string }) =>
    apiFetch<{ company: string; price: string; currency: string; updatedAt: string }>(
      "/stocks/current-price",
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    ),
};

export const exchangeRatesApi = {
  list: () =>
    apiFetch<ListRatesResponse>("/exchange-rates", { method: "GET" }),

  convert: (amount: string, from: string, to: string, date?: string) => {
    const params = new URLSearchParams();
    params.append("amount", amount);
    params.append("from", from);
    params.append("to", to);
    if (date) params.append("date", date);

    return apiFetch<ConvertResponse>(`/exchange-rates/convert?${params.toString()}`, {
      method: "GET",
    });
  },

  fetch: () =>
    apiFetch<FetchRatesResponse>("/exchange-rates/fetch", {
      method: "POST",
    }),

  setOverride: (fromCurrency: string, toCurrency: string, rate: string) =>
    apiFetch<ExchangeRate>("/exchange-rates/override", {
      method: "PUT",
      body: JSON.stringify({ fromCurrency, toCurrency, rate }),
    }),

  removeOverride: (fromCurrency: string, toCurrency: string) =>
    apiFetch<void>("/exchange-rates/override", {
      method: "DELETE",
      body: JSON.stringify({ fromCurrency, toCurrency }),
    }),

  netWorth: () =>
    apiFetch<NetWorthResponse>("/exchange-rates/net-worth", { method: "GET" }),
};

export const dashboardApi = {
  spendingChart: (months?: number) => {
    const params = months ? `?months=${months}` : "";
    return apiFetch<SpendingChartResponse>(`/dashboard/spending-chart${params}`, {
      method: "GET",
    });
  },

  categorySummary: (dateFrom?: string, dateTo?: string, type?: "income" | "expense") => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (type) params.append("type", type);
    const query = params.toString();
    const endpoint = query ? `/dashboard/category-summary?${query}` : "/dashboard/category-summary";
    return apiFetch<CategorySummaryResponse>(endpoint, { method: "GET" });
  },

  incomeVsExpense: (months?: number) => {
    const params = months ? `?months=${months}` : "";
    return apiFetch<IncomeVsExpenseResponse>(`/dashboard/income-vs-expense${params}`, {
      method: "GET",
    });
  },

  netWorthHistory: (dateFrom?: string, dateTo?: string, granularity?: "daily" | "weekly" | "monthly" | "auto") => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (granularity) params.append("granularity", granularity);
    const query = params.toString();
    const endpoint = query ? `/dashboard/net-worth-history?${query}` : "/dashboard/net-worth-history";
    return apiFetch<{ baseCurrency: string; dateFrom: string; dateTo: string; granularity: string; dataPoints: { date: string; netWorth: string }[] }>(endpoint, { method: "GET" });
  },
};
