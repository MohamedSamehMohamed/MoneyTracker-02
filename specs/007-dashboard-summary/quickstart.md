# Quickstart: Dashboard & Summary

**Feature**: 007-dashboard-summary | **Date**: 2026-04-03

## Prerequisites

- Node.js 18+
- PostgreSQL running with existing MoneyTrackerNew database
- Existing accounts and transactions in the database (for meaningful dashboard data)

## Setup Steps

### 1. Install new client dependency

```bash
cd client
npm install recharts
```

### 2. Server changes (no new dependencies needed)

Create 4 new files:
- `server/src/routes/dashboard.routes.ts` — route definitions
- `server/src/routes/dashboard.schemas.ts` — Zod validation
- `server/src/controllers/dashboard.controller.ts` — request handlers
- `server/src/services/dashboard.service.ts` — aggregation logic

Mount the router in `server/src/index.ts`:
```typescript
import dashboardRoutes from './routes/dashboard.routes';
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
```

### 3. Client changes

Create new files:
- `client/src/types/dashboard.ts` — TypeScript types for dashboard API responses
- `client/src/components/dashboard/AccountBalanceCards.tsx`
- `client/src/components/dashboard/RecentTransactions.tsx`
- `client/src/components/dashboard/SpendingChart.tsx`
- `client/src/components/dashboard/CategoryBreakdown.tsx`
- `client/src/components/dashboard/IncomeExpenseTrend.tsx`
- `client/src/components/dashboard/QuickAddTransaction.tsx`
- `client/src/components/dashboard/ExchangeRateIndicator.tsx`

Update existing files:
- `client/src/services/api.ts` — add `dashboardApi` object with `spendingChart()`, `categorySummary()`, `incomeVsExpense()` functions
- `client/src/pages/DashboardPage.tsx` — compose all dashboard components
- `client/src/components/dashboard/NetWorthCard.tsx` — add 24-hour stale rate warning

### 4. Verify

```bash
# Terminal 1: Start server
cd server && npm run dev

# Terminal 2: Start client
cd client && npm run dev
```

Navigate to `http://localhost:5173/dashboard` and verify:
- Net worth card displays with account breakdown
- Account balance cards render for each account
- Recent transactions list shows last 10 entries
- Bar chart shows monthly income vs expenses
- Donut chart shows category spending breakdown
- Line chart shows income/expense trends
- Quick-add button opens transaction modal
- Exchange rate indicator shows last-updated time

## Key Implementation Notes

- All monetary amounts are BigInt in smallest units (÷100 for currencies, ÷1000 for gold)
- Use `formatCurrency()` from `client/src/utils/currency.ts` for display
- Historical rates: use `getHistoricalRate(from, to, endOfMonthDate)` from exchange-rate service
- Transfer transactions (`type = 'transfer'`) must be filtered out from all chart queries
- Existing `transactionsApi.list()` can be reused for recent transactions with `limit=10`
- Quick-add modal reuses existing transaction form components
