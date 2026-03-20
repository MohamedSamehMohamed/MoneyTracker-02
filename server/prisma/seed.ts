import { PrismaClient, CategoryType } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Default expense categories
  const expenseCategories = [
    { name: "Food", icon: "🍔", color: "#FF6B6B" },
    { name: "Transport", icon: "🚗", color: "#4ECDC4" },
    { name: "Rent", icon: "🏠", color: "#95E1D3" },
    { name: "Entertainment", icon: "🎭", color: "#C7CEEA" },
    { name: "Shopping", icon: "🛍️", color: "#FFB6C1" },
    { name: "Health", icon: "⚕️", color: "#98D8C8" },
    { name: "Utilities", icon: "💡", color: "#F7DC6F" },
    { name: "Education", icon: "📚", color: "#85C1E2" },
    { name: "Other", icon: "📌", color: "#D3D3D3" },
  ];

  // Default income categories
  const incomeCategories = [
    { name: "Salary", icon: "💼", color: "#52C41A" },
    { name: "Freelance", icon: "💻", color: "#1890FF" },
    { name: "Investment", icon: "📈", color: "#EB2F96" },
    { name: "Gift", icon: "🎁", color: "#FA8C16" },
    { name: "Other", icon: "📌", color: "#D3D3D3" },
  ];

  // Seed expense categories
  for (const category of expenseCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: CategoryType.expense },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          type: CategoryType.expense,
          icon: category.icon,
          color: category.color,
          userId: null,
        },
      });
      console.log(`✓ Created expense category: ${category.name}`);
    } else {
      console.log(`✓ Expense category already exists: ${category.name}`);
    }
  }

  // Seed income categories
  for (const category of incomeCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: CategoryType.income },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          type: CategoryType.income,
          icon: category.icon,
          color: category.color,
          userId: null,
        },
      });
      console.log(`✓ Created income category: ${category.name}`);
    } else {
      console.log(`✓ Income category already exists: ${category.name}`);
    }
  }

  console.log("✓ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
