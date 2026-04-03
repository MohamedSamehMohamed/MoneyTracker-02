import { prisma } from "../utils/prisma";
import { getHistoricalRate } from "./exchange-rate.service";

function getDivisor(currency: string): number {
  return currency === "GOLD_GRAM" ? 1000 : 100;
}

function getEndOfMonth(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatAmount(value: number): string {
  return value.toFixed(2);
}

interface MonthlyData {
  month: string;
  totalIncome: string;
  totalExpense: string;
  netFlow: string;
}

export async function getMonthlyTotals(
  userId: string,
  months: number
): Promise<{ baseCurrency: string; months: MonthlyData[] }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  const baseCurrency = user?.baseCurrency || "EGP";

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["income", "expense"] },
      date: { gte: startDate, lte: now },
    },
    select: {
      type: true,
      amount: true,
      date: true,
      account: {
        select: { currency: true },
      },
    },
  });

  const monthlyTotals: Map<string, { income: number; expense: number }> = new Map();

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = getMonthKey(monthDate);
    monthlyTotals.set(monthKey, { income: 0, expense: 0 });
  }

  const ratesToFetch = new Map<string, Date>();
  for (const tx of transactions) {
    const currency = tx.account?.currency || baseCurrency;
    if (currency !== baseCurrency) {
      const key = `${currency}_${getMonthKey(tx.date)}`;
      if (!ratesToFetch.has(key)) {
        ratesToFetch.set(key, getEndOfMonth(tx.date));
      }
    }
  }

  const rateCache = new Map<string, number>();
  await Promise.all(
    Array.from(ratesToFetch.entries()).map(async ([key, endOfMonth]) => {
      const currency = key.split("_")[0];
      const result = await getHistoricalRate(currency, baseCurrency, endOfMonth);
      if (result.rate) {
        rateCache.set(key, result.rate);
      }
    })
  );

  for (const transaction of transactions) {
    const monthKey = getMonthKey(transaction.date);
    const currency = transaction.account?.currency || baseCurrency;
    const divisor = getDivisor(currency);
    const amountInCurrency = Number(transaction.amount) / divisor;

    let convertedAmount = amountInCurrency;

    if (currency !== baseCurrency) {
      const key = `${currency}_${getMonthKey(transaction.date)}`;
      const rate = rateCache.get(key);
      if (rate) {
        convertedAmount = amountInCurrency * rate;
      }
    }

    const totals = monthlyTotals.get(monthKey);
    if (totals) {
      if (transaction.type === "income") {
        totals.income += convertedAmount;
      } else if (transaction.type === "expense") {
        totals.expense += convertedAmount;
      }
    }
  }

  const sortedMonths = Array.from(monthlyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, totals]) => ({
      month,
      totalIncome: formatAmount(totals.income),
      totalExpense: formatAmount(totals.expense),
      netFlow: formatAmount(totals.income - totals.expense),
    }));

  return { baseCurrency, months: sortedMonths };
}

interface CategoryData {
  categoryId: string | null;
  name: string;
  color: string;
  icon: string;
  total: string;
  percentage: number;
}

export async function getCategorySummary(
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  baseCurrency: string;
  dateFrom: string;
  dateTo: string;
  totalSpending: string;
  categories: CategoryData[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  const baseCurrency = user?.baseCurrency || "EGP";

  const now = new Date();
  const startDate = dateFrom
    ? new Date(dateFrom + "T00:00:00Z")
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = dateTo
    ? new Date(dateTo + "T23:59:59Z")
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: { gte: startDate, lte: endDate },
    },
    select: {
      amount: true,
      date: true,
      categoryId: true,
      category: {
        select: { id: true, name: true, color: true, icon: true },
      },
      account: {
        select: { currency: true },
      },
    },
  });

  const ratesToFetch = new Map<string, Date>();
  for (const tx of transactions) {
    const currency = tx.account?.currency || baseCurrency;
    if (currency !== baseCurrency) {
      const key = `${currency}_${getMonthKey(tx.date)}`;
      if (!ratesToFetch.has(key)) {
        ratesToFetch.set(key, getEndOfMonth(tx.date));
      }
    }
  }

  const rateCache = new Map<string, number>();
  await Promise.all(
    Array.from(ratesToFetch.entries()).map(async ([key, endOfMonth]) => {
      const currency = key.split("_")[0];
      const result = await getHistoricalRate(currency, baseCurrency, endOfMonth);
      if (result.rate) {
        rateCache.set(key, result.rate);
      }
    })
  );

  const categoryTotals: Map<
    string | null,
    { total: number; category: { name: string; color: string | null; icon: string | null } | null }
  > = new Map();

  let totalSpending = 0;

  for (const transaction of transactions) {
    const currency = transaction.account?.currency || baseCurrency;
    const divisor = getDivisor(currency);
    const amountInCurrency = Number(transaction.amount) / divisor;

    let convertedAmount = amountInCurrency;

    if (currency !== baseCurrency) {
      const key = `${currency}_${getMonthKey(transaction.date)}`;
      const rate = rateCache.get(key);
      if (rate) {
        convertedAmount = amountInCurrency * rate;
      }
    }

    totalSpending += convertedAmount;

    const categoryId = transaction.categoryId;
    const existing = categoryTotals.get(categoryId);

    if (existing) {
      existing.total += convertedAmount;
    } else {
      categoryTotals.set(categoryId, {
        total: convertedAmount,
        category: transaction.category,
      });
    }
  }

  const categories: CategoryData[] = Array.from(categoryTotals.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      name: data.category?.name || "Uncategorized",
      color: data.category?.color || "#9ca3af",
      icon: data.category?.icon || "circle",
      total: formatAmount(data.total),
      percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  for (const cat of categories) {
    cat.percentage = Math.round(cat.percentage * 100) / 100;
  }

  const formatDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    baseCurrency,
    dateFrom: formatDateStr(startDate),
    dateTo: formatDateStr(endDate),
    totalSpending: formatAmount(totalSpending),
    categories,
  };
}

export async function getIncomeVsExpense(
  userId: string,
  months: number
): Promise<{ baseCurrency: string; data: { month: string; income: string; expense: string }[] }> {
  const result = await getMonthlyTotals(userId, months);

  return {
    baseCurrency: result.baseCurrency,
    data: result.months.map((m) => ({
      month: m.month,
      income: m.totalIncome,
      expense: m.totalExpense,
    })),
  };
}
