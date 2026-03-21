# Quickstart: Stock Portfolio Tracking

**Feature**: 005-stock-portfolio-tracking

## Prerequisites

- Node.js 18+
- PostgreSQL running (via Docker: `docker-compose up -d`)
- Existing database with migrations applied from phases 1-4

## Setup

```bash
# 1. Apply the new migration (after adding StockTransaction model to schema.prisma)
cd server
npx prisma migrate dev --name add-stock-transactions

# 2. Generate Prisma client
npx prisma generate

# 3. Start backend
npm run dev

# 4. Start frontend (in another terminal)
cd client
npm run dev
```

## Key Files to Create/Modify

### Backend (server/)

| Action | File | Purpose |
| ------ | ---- | ------- |
| Modify | `prisma/schema.prisma` | Add `StockTransaction` model and `StockTransactionType` enum |
| Create | `src/routes/stock.routes.ts` | Express router for `/api/stocks` |
| Create | `src/routes/stock.schemas.ts` | Zod validation schemas |
| Create | `src/controllers/stock.controller.ts` | Request handlers |
| Create | `src/services/stock.service.ts` | Business logic (CRUD, portfolio aggregation, gain calc) |
| Modify | `src/index.ts` | Register stock routes |

### Frontend (client/)

| Action | File | Purpose |
| ------ | ---- | ------- |
| Create | `src/types/stock.ts` | TypeScript interfaces |
| Modify | `src/services/api.ts` | Add `stocksApi` section |
| Create | `src/pages/StocksPage.tsx` | Main stocks page (portfolio + history tabs/sections) |
| Create | `src/components/stocks/StockPortfolioList.tsx` | Portfolio holdings list |
| Create | `src/components/stocks/StockPortfolioCard.tsx` | Single holding card |
| Create | `src/components/stocks/StockTransactionList.tsx` | Transaction history list |
| Create | `src/components/stocks/StockTransactionItem.tsx` | Single transaction row |
| Create | `src/components/stocks/StockTransactionFormModal.tsx` | Buy/sell form modal |
| Create | `src/components/stocks/StockFilters.tsx` | Company/date filters |
| Create | `src/components/stocks/DeleteStockTransactionDialog.tsx` | Delete confirmation |
| Modify | `src/App.tsx` | Add `/stocks` route |
| Modify | `src/components/layout/Sidebar.tsx` | Add "Stocks" nav link |

## Patterns to Follow

- **Backend service pattern**: See `server/src/services/transaction.service.ts` — same structure (list, get, create, update, delete functions)
- **Zod schemas**: See `server/src/routes/transaction.schemas.ts` — same validation approach
- **Controller pattern**: See `server/src/controllers/transaction.controller.ts` — same error handling
- **Route registration**: See `server/src/routes/transaction.routes.ts` — same middleware chain (authMiddleware + validateMiddleware)
- **API client**: See `client/src/services/api.ts` → `transactionsApi` — same `apiFetch` wrapper pattern
- **Frontend types**: See `client/src/types/transaction.ts` — same interface pattern
- **Component structure**: See `client/src/components/transactions/` — same component decomposition

## Key Implementation Notes

1. **Decimal serialization**: Prisma returns `Decimal` as objects. Serialize to strings in the service layer (like how `BigInt` is `.toString()` in `serializeTransaction`).
2. **Portfolio aggregation**: Use Prisma `groupBy` or raw query to compute per-company totals. `SELECT company, currency, SUM(CASE WHEN type='buy' THEN shares ELSE -shares END) as total_shares, ...`
3. **Sell validation**: Always check net shares inside `prisma.$transaction()` to prevent race conditions.
4. **Account balance linking**: Convert `shares * pricePerShare` to smallest currency unit (`BigInt(Math.round(shares * pricePerShare * 100))`) before adjusting account balance.
5. **Edit flow**: When shares or price change on a linked transaction, reverse the old balance adjustment and apply the new one atomically.
