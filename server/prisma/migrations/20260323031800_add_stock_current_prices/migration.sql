-- CreateTable
CREATE TABLE "stock_current_prices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_current_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_current_prices_userId_company_key" ON "stock_current_prices"("userId", "company");

-- AddForeignKey
ALTER TABLE "stock_current_prices" ADD CONSTRAINT "stock_current_prices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
