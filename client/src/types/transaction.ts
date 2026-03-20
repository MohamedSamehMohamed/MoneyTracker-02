export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: string;
  categoryId?: string;
  note?: string;
  date: string;
  transferToId?: string;
  createdAt: string;
  updatedAt: string;
  account: Account;
  category: Category | null;
  transferAccount?: Account | null;
}

export interface CreateTransactionInput {
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  note?: string;
  date: string;
  transferToId?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  categoryId?: string | null;
  note?: string | null;
  date?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: PaginationInfo;
}
