-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('buy', 'sell');

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "shares" DECIMAL(18,8) NOT NULL,
    "pricePerShare" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "date" DATE NOT NULL,
    "note" VARCHAR(500),
    "realizedGain" DECIMAL(18,2),
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_transactions_userId_company_idx" ON "stock_transactions"("userId", "company");

-- CreateIndex
CREATE INDEX "stock_transactions_userId_date_idx" ON "stock_transactions"("userId", "date" DESC);

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
