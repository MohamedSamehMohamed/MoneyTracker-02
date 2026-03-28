import { prisma } from "../utils/prisma";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionsQuery,
} from "../routes/transaction.schemas";
import { getHistoricalRate } from "./exchange-rate.service";

function serializeTransaction(transaction: any, converted?: any) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    account: transaction.account || null,
    transferAccount: transaction.transferAccount || null,
    ...(converted && {
      convertedAmount: converted.convertedAmount,
      conversionRate: converted.conversionRate,
      isApproximate: converted.isApproximate,
    }),
  };
}

export async function listTransactions(
  userId: string,
  filters: ListTransactionsQuery,
  convertToBase: boolean = false
) {
  const skip = (filters.page - 1) * filters.limit;

  const where: any = { userId };
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.type) where.type = filters.type;
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom)
      where.date.gte = new Date(filters.dateFrom + "T00:00:00Z");
    if (filters.dateTo)
      where.date.lte = new Date(filters.dateTo + "T23:59:59Z");
  }

  const [transactions, total, user] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: {
        id: true,
        userId: true,
        accountId: true,
        type: true,
        amount: true,
        categoryId: true,
        note: true,
        date: true,
        transferToId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: true,
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    }),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  let serialized = transactions.map(serializeTransaction);

  if (convertToBase && user?.baseCurrency) {
    serialized = await Promise.all(
      serialized.map(async (transaction) => {
        if (transaction.account?.currency && transaction.account.currency !== user.baseCurrency) {
          try {
            const result = await getHistoricalRate(
              transaction.account.currency,
              user.baseCurrency,
              transaction.date
            );
            if (result.rate) {
              const divisor = transaction.account?.currency === 'GOLD_GRAM' ? 1000 : 100;
              const convertedAmount = (Number(transaction.amount) / divisor) * result.rate;
              return {
                ...transaction,
                convertedAmount: convertedAmount.toString(),
                conversionRate: result.rate.toString(),
                isApproximate: !result.rateDate ||
                  result.rateDate.toDateString() !== new Date(transaction.date).toDateString(),
              };
            }
          } catch (error) {
            console.error('Error converting transaction:', error);
          }
        }
        return transaction;
      })
    );
  }

  return {
    transactions: serialized,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages,
    },
  };
}

export async function getTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      userId: true,
      accountId: true,
      type: true,
      amount: true,
      categoryId: true,
      note: true,
      date: true,
      transferToId: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
        },
      },
      category: true,
      transferAccount: {
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
        },
      },
    },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return serializeTransaction(transaction);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  const sourceAccount = await prisma.account.findUnique({
    where: { id: input.accountId },
  });

  if (!sourceAccount || sourceAccount.userId !== userId) {
    const error = new Error("Account not found") as any;
    error.statusCode = 404;
    throw error;
  }

  // For transfer, validate destination account
  if (input.type === "transfer") {
    if (!input.transferToId) {
      const error = new Error(
        "transferToId is required for transfer transactions"
      ) as any;
      error.statusCode = 400;
      throw error;
    }

    if (input.transferToId === input.accountId) {
      const error = new Error(
        "Cannot transfer to the same account"
      ) as any;
      error.statusCode = 400;
      throw error;
    }

    const destAccount = await prisma.account.findUnique({
      where: { id: input.transferToId },
    });

    if (!destAccount || destAccount.userId !== userId) {
      const error = new Error("Destination account not found") as any;
      error.statusCode = 404;
      throw error;
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    // Create transaction
    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        accountId: input.accountId,
        type: input.type,
        amount: BigInt(input.amount),
        categoryId: input.categoryId,
        note: input.note,
        date: new Date(input.date + "T00:00:00Z"),
        transferToId: input.type === "transfer" ? input.transferToId : null,
      },
      select: {
        id: true,
        userId: true,
        accountId: true,
        type: true,
        amount: true,
        categoryId: true,
        note: true,
        date: true,
        transferToId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: true,
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
    });

    // Update account balances
    if (input.type === "income") {
      await tx.account.update({
        where: { id: input.accountId },
        data: { balance: { increment: input.amount } },
      });
    } else if (input.type === "expense") {
      await tx.account.update({
        where: { id: input.accountId },
        data: { balance: { decrement: input.amount } },
      });
    } else if (input.type === "transfer" && input.transferToId) {
      // Decrement source
      await tx.account.update({
        where: { id: input.accountId },
        data: { balance: { decrement: input.amount } },
      });

      // Increment destination
      await tx.account.update({
        where: { id: input.transferToId },
        data: { balance: { increment: input.amount } },
      });
    }

    return newTransaction;
  });

  return serializeTransaction(transaction);
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  // Can't change type or account after creation
  const updateData: any = {};
  if (input.amount !== undefined) updateData.amount = BigInt(input.amount);
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.note !== undefined) updateData.note = input.note;
  if (input.date !== undefined)
    updateData.date = new Date(input.date + "T00:00:00Z");

  // If no amount change, just update
  if (input.amount === undefined) {
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      select: {
        id: true,
        userId: true,
        accountId: true,
        type: true,
        amount: true,
        categoryId: true,
        note: true,
        date: true,
        transferToId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: true,
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
    });
    return serializeTransaction(updated);
  }

  // If amount changed, use transaction to update balances atomically
  const updated = await prisma.$transaction(async (tx) => {
    const amountDiff = BigInt(input.amount!) - transaction.amount;

    // Reverse old balance effect then apply new
    if (transaction.type === "income") {
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: amountDiff } },
      });
    } else if (transaction.type === "expense") {
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { decrement: amountDiff } },
      });
    } else if (transaction.type === "transfer" && transaction.transferToId) {
      // Adjust source account
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { decrement: amountDiff } },
      });

      // Adjust destination account
      await tx.account.update({
        where: { id: transaction.transferToId },
        data: { balance: { increment: amountDiff } },
      });
    }

    // Update transaction
    return await tx.transaction.update({
      where: { id: transactionId },
      data: updateData,
      select: {
        id: true,
        userId: true,
        accountId: true,
        type: true,
        amount: true,
        categoryId: true,
        note: true,
        date: true,
        transferToId: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        category: true,
        transferAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
    });
  });

  return serializeTransaction(updated);
}

export async function deleteTransaction(
  userId: string,
  transactionId: string
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    // Reverse balance effect
    if (transaction.type === "income") {
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { decrement: transaction.amount } },
      });
    } else if (transaction.type === "expense") {
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: transaction.amount } },
      });
    } else if (transaction.type === "transfer" && transaction.transferToId) {
      // Reverse source
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: transaction.amount } },
      });

      // Reverse destination
      await tx.account.update({
        where: { id: transaction.transferToId },
        data: { balance: { decrement: transaction.amount } },
      });
    }

    // Delete transaction
    await tx.transaction.delete({
      where: { id: transactionId },
    });
  });
}
