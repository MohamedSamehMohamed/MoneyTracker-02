export interface MonthlyData {
  month: string;
  totalIncome: string;
  totalExpense: string;
  netFlow: string;
}

export interface SpendingChartResponse {
  baseCurrency: string;
  months: MonthlyData[];
}

export interface CategorySummaryItem {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  total: string;
  percentage: number;
}

export interface CategorySummaryResponse {
  baseCurrency: string;
  dateFrom: string;
  dateTo: string;
  totalSpending: string;
  categories: CategorySummaryItem[];
}

export interface IncomeExpenseDataPoint {
  month: string;
  income: string;
  expense: string;
}

export interface IncomeVsExpenseResponse {
  baseCurrency: string;
  data: IncomeExpenseDataPoint[];
}
