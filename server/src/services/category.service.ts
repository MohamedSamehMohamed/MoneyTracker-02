import { prisma } from "../utils/prisma";
import { CreateCategoryInput, UpdateCategoryInput } from "../routes/category.schemas";

export async function listCategories(userId: string, type?: "income" | "expense") {
  const where: any = {
    OR: [
      { userId: null },
      { userId },
    ],
  };

  if (type) {
    where.type = type;
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ userId: "asc" }, { name: "asc" }],
  });

  return categories;
}

export async function getCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    const error = new Error("Category not found") as any;
    error.statusCode = 404;
    throw error;
  }

  if (category.userId && category.userId !== userId) {
    const error = new Error("Category not found") as any;
    error.statusCode = 404;
    throw error;
  }

  return category;
}

export async function checkCategoryNameExists(
  userId: string,
  name: string,
  type: "income" | "expense",
  excludeId?: string
) {
  const where: any = {
    name,
    type,
    OR: [
      { userId: null },
      { userId },
    ],
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await prisma.category.findFirst({ where });
  return existing !== null;
}

export async function countTransactionsByCategory(categoryId: string) {
  return prisma.transaction.count({
    where: { categoryId },
  });
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  const nameExists = await checkCategoryNameExists(userId, input.name, input.type);
  if (nameExists) {
    const error = new Error(`A category named "${input.name}" already exists for ${input.type} type`) as any;
    error.statusCode = 409;
    throw error;
  }

  const category = await prisma.category.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
    },
  });

  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput
) {
  const category = await getCategory(userId, categoryId);

  if (!category.userId) {
    const error = new Error("Cannot modify system default categories") as any;
    error.statusCode = 403;
    throw error;
  }

  if (input.name !== undefined) {
    const nameExists = await checkCategoryNameExists(
      userId,
      input.name,
      category.type,
      categoryId
    );
    if (nameExists) {
      const error = new Error(`A category named "${input.name}" already exists for ${category.type} type`) as any;
      error.statusCode = 409;
      throw error;
    }
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });

  return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const category = await getCategory(userId, categoryId);

  if (!category.userId) {
    const error = new Error("Cannot delete system default categories") as any;
    error.statusCode = 403;
    throw error;
  }

  const transactionCount = await countTransactionsByCategory(categoryId);
  if (transactionCount > 0) {
    const error = new Error(`Cannot delete category: ${transactionCount} transaction${transactionCount > 1 ? 's are' : ' is'} using this category`) as any;
    error.statusCode = 409;
    throw error;
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
}
