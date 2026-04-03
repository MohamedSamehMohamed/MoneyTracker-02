---
## Goal

Implement the Dashboard & Summary feature (spec7) for a personal finance tracker application. This involves creating dashboard endpoints on the server and chart components on the client to display financial overview, spending charts, and transaction summaries.

## Instructions

- Use `/speckit.implement spec7` command to implement the feature from `specs/007-dashboard-summary/`
- Follow the tasks defined in `specs/007-dashboard-summary/tasks.md` which contains 25 tasks organized in 7 phases
- Implement tasks sequentially following the phase dependencies
- Server endpoints must exclude transfer transactions from all chart/aggregation queries
- Historical exchange rates must be used for chart aggregations (end-of-month rates via `getHistoricalRate()`)
- Exchange rates older than 24 hours must be flagged as stale
- Monetary amounts are BigInt in smallest units - use divisor 100 for regular currencies, 1000 for GOLD_GRAM
- Return amounts as strings in API responses

## Discoveries

- Project uses TypeScript 5.x on Node.js 18+ (server), TypeScript 5.9 + React 19 (client)
- Uses Express 4.18, Prisma 6.19, Zod 4.3 for server
- Uses React Hook Form 7.71, Tailwind CSS 4.2 for client
- Existing patterns: controller → service → Prisma ORM architecture
- Auth middleware sets `req.userId` for authenticated requests
- `getHistoricalRate()` function exists in `server/src/services/exchange-rate.service.ts` for historical rate lookups
- `formatCurrency()` utility exists in `client/src/utils/currency.ts` for displaying amounts
- Existing `NetWorthCard` component fetches from `exchangeRatesApi.netWorth()`
- Recharts was installed for chart components

## Accomplished

**Phase 1 (Setup) - COMPLETE:**
- T001: Installed Recharts dependency in client ✓
- T002: Created `client/src/types/dashboard.ts` with TypeScript types ✓
- T003: Created `server/src/routes/dashboard.schemas.ts` with Zod validation schemas ✓
- T004: Created `server/src/services/dashboard.service.ts` with `getMonthlyTotals()`, `getCategorySummary()`, `getIncomeVsExpense()` ✓
- T005: Created `server/src/controllers/dashboard.controller.ts` with request handlers ✓
- T006: Created `server/src/routes/dashboard.routes.ts` with routes ✓
- T007: Mounted dashboard router in `server/src/index.ts` at `/api/dashboard` ✓
- T008: Added `dashboardApi` object to `client/src/services/api.ts` ✓

**Phase 2 (User Story 1 - Financial Overview) - COMPLETE:**
- T009: Created `client/src/components/dashboard/AccountBalanceCards.tsx` ✓
- T010: Created `client/src/components/dashboard/RecentTransactions.tsx` ✓
- T011: Created `client/src/components/dashboard/ExchangeRateIndicator.tsx` ✓
- T012: Updated `NetWorthCard.tsx` with stale rate warning ✓
- T013: Updated `DashboardPage.tsx` with full dashboard composition ✓

**Phase 3 (User Story 2 - Monthly Spending) - COMPLETE:**
- T014: Created `client/src/components/dashboard/SpendingChart.tsx` ✓
- T015: Integrated SpendingChart into DashboardPage ✓

**Phase 4 (User Story 3 - Category Breakdown) - COMPLETE:**
- T016: Created `client/src/components/dashboard/CategoryBreakdown.tsx` ✓
- T017: Integrated CategoryBreakdown into DashboardPage ✓

**Phase 5 (User Story 4 - Income vs Expense Trend) - COMPLETE:**
- T018: Created `client/src/components/dashboard/IncomeExpenseTrend.tsx` ✓
- T019: Integrated IncomeExpenseTrend into DashboardPage ✓

**Phase 6 (User Story 5 - Quick Add Transaction) - COMPLETE:**
- T020: Created `client/src/components/dashboard/QuickAddTransaction.tsx` ✓
- T021: Integrated QuickAddTransaction into DashboardPage with refresh callback ✓

**Phase 7 (Polish & Verification) - COMPLETE:**
- T022: Loading skeletons already implemented in all components ✓
- T023: Error states with retry already implemented in all components ✓
- T024: Responsive layout verified with Tailwind grid breakpoints ✓
- T025: TypeScript compilation passed for both server and client ✓

**All 25 tasks complete.**

## Relevant files / directories

### Spec files (read):
- `specs/007-dashboard-summary/tasks.md` - Task list with 25 tasks
- `specs/007-dashboard-summary/contracts/dashboard-api.md` - API contract definitions

### Server files (created):
- `server/src/routes/dashboard.schemas.ts` - Zod validation schemas
- `server/src/services/dashboard.service.ts` - Aggregation logic with historical rate conversion
- `server/src/controllers/dashboard.controller.ts` - Request handlers
- `server/src/routes/dashboard.routes.ts` - Route definitions

### Server files (modified):
- `server/src/index.ts` - Added dashboard router import and mounted at `/api/dashboard`

### Client files (created):
- `client/src/types/dashboard.ts` - TypeScript response types
- `client/src/components/dashboard/AccountBalanceCards.tsx` - Account balance grid
- `client/src/components/dashboard/RecentTransactions.tsx` - Last 10 transactions list
- `client/src/components/dashboard/ExchangeRateIndicator.tsx` - Rate freshness indicator
- `client/src/components/dashboard/SpendingChart.tsx` - Bar chart for income/expense
- `client/src/components/dashboard/CategoryBreakdown.tsx` - Donut chart for spending by category
- `client/src/components/dashboard/IncomeExpenseTrend.tsx` - Line chart for trends
- `client/src/components/dashboard/QuickAddTransaction.tsx` - FAB for quick transaction creation

### Client files (modified):
- `client/src/services/api.ts` - Added `dashboardApi` object
- `client/src/components/dashboard/NetWorthCard.tsx` - Added stale rate warning badge
- `client/src/pages/DashboardPage.tsx` - Full dashboard with all components

### Reference files (existing patterns):
- `server/src/services/transaction.service.ts` - Pattern for service layer
- `server/src/services/exchange-rate.service.ts` - Contains `getHistoricalRate()` function
- `server/src/controllers/transaction.controller.ts` - Pattern for controller layer
- `server/src/routes/transaction.routes.ts` - Pattern for routes
- `client/src/utils/currency.ts` - Currency formatting utilities
- `client/src/components/transactions/TransactionFormModal.tsx` - Reused for quick-add
