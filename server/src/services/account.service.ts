import { prisma } from "../utils/prisma";
import { CreateAccountInput, UpdateAccountInput } from "../routes/account.schemas";

export async function listAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // Convert BigInt balance to string for JSON serialization
  return accounts.map((account) => ({
    ...account,
    balance: account.balance.toString(),
  }));
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      icon: input.icon,
      balance: 0n,
    },
  });

  return {
    ...account,
    balance: account.balance.toString(),
  };
}

export async function updateAccount(
  userId: string,
  accountId: string,
  input: UpdateAccountInput
) {
  // Verify ownership and update in a single query
  const updated = await prisma.account.updateMany({
    where: { id: accountId, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
    },
  });

  if (updated.count === 0) {
    const error = new Error("Account not found") as any;
    error.statusCode = 404;
    throw error;
  }

  // Fetch the updated account to return it
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    const error = new Error("Account not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return {
    ...account,
    balance: account.balance.toString(),
  };
}

export async function deleteAccount(userId: string, accountId: string) {
  // Verify ownership and check balance
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account || account.userId !== userId) {
    const error = new Error("Account not found") as any;
    error.statusCode = 404;
    throw error;
  }

  if (account.balance !== 0n) {
    const error = new Error(
      "Cannot delete account with non-zero balance"
    ) as any;
    error.statusCode = 400;
    throw error;
  }

  await prisma.account.delete({
    where: { id: accountId },
  });
}
