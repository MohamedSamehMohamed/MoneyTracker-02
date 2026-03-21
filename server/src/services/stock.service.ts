import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../utils/prisma";
import {
  CreateStockTransactionInput,
  UpdateStockTransactionInput,
  ListStockTransactionsQuery,
} from "../routes/stock.schemas";

function serializeStockTransaction(transaction: any) {
  return {
    ...transaction,
    shares: transaction.shares.toString(),
    pricePerShare: transaction.pricePerShare.toString(),
    realizedGain: transaction.realizedGain ? transaction.realizedGain.toString() : null,
  };
}

export async function createStockTransaction(
  userId: string,
  input: CreateStockTransactionInput
) {
  // Validate account exists if provided
  if (input.accountId) {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
    });

    if (!account || account.userId !== userId) {
      const error = new Error("Account not found") as any;
      error.statusCode = 404;
      throw error;
    }

    // Validate currency match between stock and account (US5)
    if (account.currency !== input.currency) {
      const error = new Error(
        "Stock transaction currency must match account currency"
      ) as any;
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate currency consistency for company
  const existingTransaction = await prisma.stockTransaction.findFirst({
    where: {
      userId,
      company: input.company,
    },
  });

  if (existingTransaction && existingTransaction.currency !== input.currency) {
    const error = new Error(
      `Currency mismatch: This company already has transactions in ${existingTransaction.currency}`
    ) as any;
    error.statusCode = 400;
    throw error;
  }

  // For sells, validate we have enough shares to sell
  if (input.type === "sell") {
    const heldShares = await calculateHeldShares(userId, input.company);
    const sellShares = new Decimal(input.shares.toString());

    if (sellShares.greaterThan(heldShares)) {
      const error = new Error(
        `Cannot sell ${input.shares} shares: Only ${heldShares.toString()} shares held`
      ) as any;
      error.statusCode = 400;
      throw error;
    }
  }

  // Create transaction (with realized gain for sells)
  const transaction = await prisma.$transaction(async (tx) => {
    let realizedGain = null;

    if (input.type === "sell") {
      // Calculate average cost for this company
      const avgCost = await calculateAverageCost(userId, input.company, tx);
      const shareCount = new Decimal(input.shares.toString());
      const pricePerShare = new Decimal(input.pricePerShare.toString());
      realizedGain = shareCount.times(pricePerShare.minus(avgCost));
    }

    const newTransaction = await tx.stockTransaction.create({
      data: {
        userId,
        type: input.type,
        company: input.company,
        shares: new Decimal(input.shares.toString()),
        pricePerShare: new Decimal(input.pricePerShare.toString()),
        currency: input.currency,
        date: new Date(input.date + "T00:00:00Z"),
        note: input.note || null,
        realizedGain,
        accountId: input.accountId || null,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        company: true,
        shares: true,
        pricePerShare: true,
        currency: true,
        date: true,
        note: true,
        realizedGain: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update linked account balance if provided
    if (input.accountId) {
      const total = new Decimal(input.shares.toString())
        .times(new Decimal(input.pricePerShare.toString()))
        .times(100); // Convert to cents

      if (input.type === "buy") {
        await tx.account.update({
          where: { id: input.accountId },
          data: { balance: { decrement: total.toNumber() } },
        });
      } else if (input.type === "sell") {
        await tx.account.update({
          where: { id: input.accountId },
          data: { balance: { increment: total.toNumber() } },
        });
      }
    }

    return newTransaction;
  });

  return serializeStockTransaction(transaction);
}

export async function getStockTransaction(
  userId: string,
  transactionId: string
) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      userId: true,
      type: true,
      company: true,
      shares: true,
      pricePerShare: true,
      currency: true,
      date: true,
      note: true,
      realizedGain: true,
      accountId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Stock transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return serializeStockTransaction(transaction);
}

export async function listStockTransactions(
  userId: string,
  filters: ListStockTransactionsQuery
) {
  const skip = (filters.page - 1) * filters.limit;

  const where: any = { userId };
  if (filters.company) where.company = { contains: filters.company, mode: "insensitive" };
  if (filters.type) where.type = filters.type;
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom)
      where.date.gte = new Date(filters.dateFrom + "T00:00:00Z");
    if (filters.dateTo)
      where.date.lte = new Date(filters.dateTo + "T23:59:59Z");
  }

  const [transactions, total] = await Promise.all([
    prisma.stockTransaction.findMany({
      where,
      select: {
        id: true,
        userId: true,
        type: true,
        company: true,
        shares: true,
        pricePerShare: true,
        currency: true,
        date: true,
        note: true,
        realizedGain: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.limit,
    }),
    prisma.stockTransaction.count({ where }),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  return {
    items: transactions.map(serializeStockTransaction),
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages,
  };
}

export async function updateStockTransaction(
  userId: string,
  transactionId: string,
  input: UpdateStockTransactionInput
) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Stock transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  // Can't change company or type after creation
  const updateData: any = {};
  if (input.shares !== undefined) updateData.shares = new Decimal(input.shares.toString());
  if (input.pricePerShare !== undefined)
    updateData.pricePerShare = new Decimal(input.pricePerShare.toString());
  if (input.note !== undefined) updateData.note = input.note;
  if (input.date !== undefined)
    updateData.date = new Date(input.date + "T00:00:00Z");

  // If it's a sell and shares/price changed, recalculate realized gain
  if (transaction.type === "sell" && (input.shares !== undefined || input.pricePerShare !== undefined)) {
    const avgCost = await calculateAverageCost(userId, transaction.company);
    const shares = input.shares ? new Decimal(input.shares.toString()) : transaction.shares;
    const price = input.pricePerShare ? new Decimal(input.pricePerShare.toString()) : transaction.pricePerShare;
    updateData.realizedGain = shares.times(price.minus(avgCost));

    // Also validate sell quantity for sell updates
    if (input.shares !== undefined) {
      const heldShares = await calculateHeldShares(userId, transaction.company, undefined, transactionId);
      const newSellShares = new Decimal(input.shares.toString());

      if (newSellShares.greaterThan(heldShares)) {
        const error = new Error(
          `Cannot sell ${input.shares} shares: Only ${heldShares.toString()} shares held`
        ) as any;
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const updated = await prisma.stockTransaction.update({
    where: { id: transactionId },
    data: updateData,
    select: {
      id: true,
      userId: true,
      type: true,
      company: true,
      shares: true,
      pricePerShare: true,
      currency: true,
      date: true,
      note: true,
      realizedGain: true,
      accountId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return serializeStockTransaction(updated);
}

export async function deleteStockTransaction(
  userId: string,
  transactionId: string
) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Stock transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // Reverse balance adjustment if account linked
    if (transaction.accountId) {
      const total = transaction.shares
        .times(transaction.pricePerShare)
        .times(100); // Convert to cents

      if (transaction.type === "buy") {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: total.toNumber() } },
        });
      } else if (transaction.type === "sell") {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { decrement: total.toNumber() } },
        });
      }
    }

    // Delete the transaction
    await tx.stockTransaction.delete({
      where: { id: transactionId },
    });
  });
}

export async function getPortfolio(userId: string) {
  // Get all transactions for this user
  const transactions = await prisma.stockTransaction.findMany({
    where: { userId },
    orderBy: [{ company: "asc" }, { date: "asc" }],
  });

  // Group by company and aggregate
  const holdings: Record<string, any> = {};

  for (const tx of transactions) {
    if (!holdings[tx.company]) {
      holdings[tx.company] = {
        company: tx.company,
        currency: tx.currency,
        buys: [],
        sells: [],
      };
    }

    if (tx.type === "buy") {
      holdings[tx.company].buys.push({
        shares: tx.shares,
        pricePerShare: tx.pricePerShare,
      });
    } else {
      holdings[tx.company].sells.push({
        shares: tx.shares,
        pricePerShare: tx.pricePerShare,
      });
    }
  }

  // Compute aggregates
  const result = Object.entries(holdings)
    .map(([company, data]: [string, any]) => {
      const totalBuyShares = data.buys.reduce(
        (sum: Decimal, b: any) => sum.plus(b.shares),
        new Decimal(0)
      );
      const totalSellShares = data.sells.reduce(
        (sum: Decimal, s: any) => sum.plus(s.shares),
        new Decimal(0)
      );
      const totalShares = totalBuyShares.minus(totalSellShares);

      const totalBuyValue = data.buys.reduce(
        (sum: Decimal, b: any) => sum.plus(b.shares.times(b.pricePerShare)),
        new Decimal(0)
      );
      const totalSellValue = data.sells.reduce(
        (sum: Decimal, s: any) => sum.plus(s.shares.times(s.pricePerShare)),
        new Decimal(0)
      );
      const totalInvested = totalBuyValue.minus(totalSellValue);

      const averageCostPerShare =
        totalBuyShares.greaterThan(0)
          ? totalBuyValue.dividedBy(totalBuyShares)
          : new Decimal(0);

      return {
        company,
        currency: data.currency,
        totalShares: totalShares.toString(),
        totalInvested: totalInvested.toString(),
        averageCostPerShare: averageCostPerShare.toString(),
        totalRealizedGain: data.sells
          .reduce(
            (sum: Decimal, s: any) =>
              sum.plus(s.shares.times(s.pricePerShare.minus(averageCostPerShare))),
            new Decimal(0)
          )
          .toString(),
      };
    })
    .filter((holding) => new Decimal(holding.totalShares).greaterThan(0));

  // Group total invested by currency
  const totalInvestedAcrossCurrencies: Record<string, Decimal> = {};
  result.forEach((holding) => {
    if (!totalInvestedAcrossCurrencies[holding.currency]) {
      totalInvestedAcrossCurrencies[holding.currency] = new Decimal(0);
    }
    totalInvestedAcrossCurrencies[holding.currency] =
      totalInvestedAcrossCurrencies[holding.currency].plus(holding.totalInvested);
  });

  return {
    holdings: result,
    totalInvestedAcrossCurrencies: Object.entries(
      totalInvestedAcrossCurrencies
    ).reduce(
      (acc, [currency, amount]) => {
        acc[currency] = amount.toString();
        return acc;
      },
      {} as Record<string, string>
    ),
  };
}

// Helper: Calculate total held shares for a company
async function calculateHeldShares(
  userId: string,
  company: string,
  tx?: any,
  excludeTransactionId?: string
) {
  const query = {
    where: {
      userId,
      company,
      ...(excludeTransactionId && { id: { not: excludeTransactionId } }),
    },
  };

  const buys = await (tx || prisma).stockTransaction.aggregate({
    where: { ...query.where, type: "buy" },
    _sum: { shares: true },
  });

  const sells = await (tx || prisma).stockTransaction.aggregate({
    where: { ...query.where, type: "sell" },
    _sum: { shares: true },
  });

  const buyTotal = buys._sum.shares || new Decimal(0);
  const sellTotal = sells._sum.shares || new Decimal(0);

  return buyTotal.minus(sellTotal);
}

// Helper: Calculate average cost per share for a company
async function calculateAverageCost(
  userId: string,
  company: string,
  tx?: any
) {
  const buys = await (tx || prisma).stockTransaction.aggregate({
    where: { userId, company, type: "buy" },
    _sum: { shares: true },
  });

  const buyValues = await (tx || prisma).stockTransaction.findMany({
    where: { userId, company, type: "buy" },
    select: { shares: true, pricePerShare: true },
  });

  const totalShares = buys._sum.shares || new Decimal(0);
  const totalValue = buyValues.reduce(
    (sum: Decimal, b: any) => sum.plus(b.shares.times(b.pricePerShare)),
    new Decimal(0)
  );

  return totalShares.greaterThan(0) ? totalValue.dividedBy(totalShares) : new Decimal(0);
}
