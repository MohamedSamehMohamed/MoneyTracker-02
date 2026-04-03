# Tasks: Dashboard & Summary

**Input**: Design documents from `/specs/007-dashboard-summary/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included — no test framework is configured and tests were not explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create shared types/services needed by all dashboard features

- [ ] T001 Install Recharts dependency in client (`cd client && npm install recharts`)
- [ ] T002 Create dashboard TypeScript response types in `client/src/types/dashboard.ts` — define `SpendingChartResponse`, `CategorySummaryResponse`, `IncomeVsExpenseResponse` interfaces per contracts/dashboard-api.md
- [ ] T003 [P] Create Zod validation schemas for dashboard endpoints in `server/src/routes/dashboard.schemas.ts` — `months` (integer 1-24, default 6), `dateFrom`/`dateTo` (YYYY-MM-DD format, dateTo >= dateFrom)
- [ ] T004 [P] Create dashboard service with monthly aggregation logic in `server/src/services/dashboard.service.ts` — implement `getMonthlyTotals(userId, months)` and `getCategorySummary(userId, dateFrom, dateTo)` functions. Query transactions filtered by `type IN ('income', 'expense')` (excluding transfers), group by calendar month in application code, convert amounts using `getHistoricalRate()` with end-of-month dates. Handle BigInt amounts with divisor 100 (regular currencies) / 1000 (GOLD_GRAM). Return amounts as strings.
- [ ] T005 Create dashboard controller with request handlers in `server/src/controllers/dashboard.controller.ts` — implement `getSpendingChart`, `getCategorySummary`, `getIncomeVsExpense` handlers using dashboard service. Follow existing controller patterns (try/catch, `req.userId` from auth middleware).
- [ ] T006 Create dashboard routes in `server/src/routes/dashboard.routes.ts` — define `GET /spending-chart`, `GET /category-summary`, `GET /income-vs-expense` with Zod validation middleware. Apply auth middleware.
- [ ] T007 Mount dashboard router in `server/src/index.ts` — import and register `dashboardRoutes` at `/api/dashboard` path with auth middleware

**Checkpoint**: Server endpoints operational, client types ready. Verify endpoints return correct JSON via API client (e.g., curl or Postman).

---

## Phase 2: User Story 1 - Financial Overview at a Glance (Priority: P1) MVP

**Goal**: Dashboard displays net worth, individual account balance cards, recent transactions, and exchange rate freshness indicator on a single page.

**Independent Test**: Log in with a user who has multiple accounts and transactions. Dashboard should show net worth card, account cards with original + converted balances, last 10 transactions, and a "last updated" timestamp for exchange rates.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Add dashboard API functions to `client/src/services/api.ts` — add `dashboardApi` object with `spendingChart(months?)`, `categorySummary(dateFrom?, dateTo?)`, `incomeVsExpense(months?)` methods calling the new `/api/dashboard/*` endpoints
- [ ] T009 [P] [US1] Create AccountBalanceCards component in `client/src/components/dashboard/AccountBalanceCards.tsx` — fetch account data from existing `exchangeRatesApi.netWorth()` breakdown, render a responsive grid of cards (one per account) showing account name, type icon, original balance with currency, converted balance in base currency. Use `formatCurrency()` from `client/src/utils/currency.ts`. Handle empty state (no accounts) with a "Create your first account" message and link to accounts page.
- [ ] T010 [P] [US1] Create RecentTransactions component in `client/src/components/dashboard/RecentTransactions.tsx` — fetch last 10 transactions using existing `transactionsApi.list({ limit: 10, page: 1 })`. Display each transaction with date, amount (formatted), category name + color dot, account name, and type indicator (income/expense/transfer). Handle empty state with "No transactions yet" message. Include a "View all" link to `/transactions`.
- [ ] T011 [P] [US1] Create ExchangeRateIndicator component in `client/src/components/dashboard/ExchangeRateIndicator.tsx` — fetch rates using existing `exchangeRatesApi.list()`, extract the most recent `fetchedAt` timestamp. Display as relative time (e.g., "2 hours ago"). If `fetchedAt` is older than 24 hours, show a yellow warning icon and "Rates may be outdated" message. Include a manual refresh button calling `exchangeRatesApi.triggerFetch()`.
- [ ] T012 [US1] Update NetWorthCard to add stale rate warning in `client/src/components/dashboard/NetWorthCard.tsx` — if `lastRateUpdate` from the net-worth response is older than 24 hours, display a warning badge/indicator on the card. Reuse the 24-hour threshold logic.
- [ ] T013 [US1] Compose dashboard layout in `client/src/pages/DashboardPage.tsx` — replace current minimal layout with full dashboard composition: NetWorthCard (full width top), ExchangeRateIndicator (top right), AccountBalanceCards (grid below net worth), RecentTransactions (list section). Use Tailwind CSS responsive grid (1 col mobile, 2 col tablet, 3 col desktop for account cards). Handle overall loading state and empty state (new user with no data).

**Checkpoint**: User Story 1 fully functional. Dashboard shows financial overview at a glance with net worth, account cards, recent transactions, and rate freshness.

---

## Phase 3: User Story 2 - Monthly Spending & Income Visualization (Priority: P2)

**Goal**: Bar chart showing monthly income vs. expense comparison for the last 6 months.

**Independent Test**: View dashboard with 2-3 months of transaction data. Grouped bar chart should show income (green) and expense (red) bars for each month with tooltips showing exact values.

### Implementation for User Story 2

- [ ] T014 [US2] Create SpendingChart component in `client/src/components/dashboard/SpendingChart.tsx` — fetch data from `dashboardApi.spendingChart(6)`. Render a Recharts `BarChart` inside `ResponsiveContainer` with grouped bars: income (green/emerald) and expense (red). X-axis: month labels (e.g., "Mar 2026"). Y-axis: amount in base currency. Include `Tooltip` showing exact formatted amounts on hover. Include `Legend` for income/expense. Handle empty state (no data) with placeholder message. Handle single-month data gracefully.
- [ ] T015 [US2] Integrate SpendingChart into dashboard layout in `client/src/pages/DashboardPage.tsx` — add SpendingChart below the account balance cards section. Use full-width container with appropriate height (300-400px).

**Checkpoint**: Monthly spending bar chart renders on dashboard with real transaction data.

---

## Phase 4: User Story 3 - Spending Breakdown by Category (Priority: P2)

**Goal**: Donut chart showing expense distribution by category with time period selector.

**Independent Test**: View dashboard with expense transactions in multiple categories. Donut chart should show each category as a colored segment with name and percentage. Changing the period preset should update the chart.

### Implementation for User Story 3

- [ ] T016 [US3] Create CategoryBreakdown component in `client/src/components/dashboard/CategoryBreakdown.tsx` — fetch data from `dashboardApi.categorySummary(dateFrom, dateTo)`. Render a Recharts `PieChart` with inner radius (donut style) inside `ResponsiveContainer`. Each segment uses the category's `color` from the API response. Show category name and percentage in `Tooltip`. Display a legend listing categories with color dots, amounts, and percentages. Include a period selector with preset buttons (Current Month, Last 3M, Last 6M, Last 12M) and a custom date range picker (two date inputs). Default to current month. Compute preset date ranges client-side and pass as `dateFrom`/`dateTo` to the API. Handle empty state (no expenses in period). Show `totalSpending` as center label in the donut.
- [ ] T017 [US3] Integrate CategoryBreakdown into dashboard layout in `client/src/pages/DashboardPage.tsx` — add CategoryBreakdown to the charts section. Position alongside or below SpendingChart using responsive grid (side-by-side on desktop, stacked on mobile).

**Checkpoint**: Category donut chart renders with period selection. Changing periods fetches fresh data.

---

## Phase 5: User Story 4 - Income vs. Expense Trend Over Time (Priority: P3)

**Goal**: Line chart showing income and expense trends over the last 6 months.

**Independent Test**: View dashboard with several months of data. Two lines (income green, expense red) should plot monthly trends with tooltips on hover.

### Implementation for User Story 4

- [ ] T018 [US4] Create IncomeExpenseTrend component in `client/src/components/dashboard/IncomeExpenseTrend.tsx` — fetch data from `dashboardApi.incomeVsExpense(6)`. Render a Recharts `LineChart` inside `ResponsiveContainer` with two `Line` series: income (green/emerald, solid) and expense (red, solid). X-axis: month labels. Y-axis: amount. Include `Tooltip` with formatted amounts on hover. Include `Legend`. Use smooth curve type (`monotone`). Handle empty state with placeholder message.
- [ ] T019 [US4] Integrate IncomeExpenseTrend into dashboard layout in `client/src/pages/DashboardPage.tsx` — add IncomeExpenseTrend to the charts section below or alongside the other charts.

**Checkpoint**: Trend line chart renders on dashboard showing income/expense trajectories.

---

## Phase 6: User Story 5 - Quick-Add Transaction from Dashboard (Priority: P3)

**Goal**: Floating action button on dashboard that opens a modal to create a transaction without navigating away.

**Independent Test**: Click the quick-add button, fill in a transaction, submit. Dashboard should refresh showing the new transaction in recent list and updated balances/charts.

### Implementation for User Story 5

- [ ] T020 [US5] Create QuickAddTransaction component in `client/src/components/dashboard/QuickAddTransaction.tsx` — render a floating action button (FAB) with a "+" icon in the bottom-right corner of the dashboard. On click, open a modal dialog containing the existing transaction creation form (reuse form fields from the existing NewTransaction page: amount, type selector, account dropdown, category dropdown, date picker, note field). On successful submission via `transactionsApi.create()`, close the modal and trigger a dashboard data refresh (invalidate/refetch all dashboard queries). Include cancel button and escape-to-close behavior.
- [ ] T021 [US5] Integrate QuickAddTransaction into dashboard layout in `client/src/pages/DashboardPage.tsx` — add QuickAddTransaction component. Wire up a refresh callback that re-fetches net worth, recent transactions, and chart data after a successful transaction creation.

**Checkpoint**: Quick-add flow works end-to-end. New transactions immediately reflected on dashboard.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T022 [P] Add loading skeletons for all dashboard components in `client/src/components/dashboard/` — replace simple "Loading..." text with Tailwind-based skeleton placeholders (animated pulse bars) for NetWorthCard, AccountBalanceCards, RecentTransactions, and all chart components
- [ ] T023 [P] Add error boundaries and error states for each dashboard component — each component should catch fetch errors independently and display a retry-able error message without breaking the rest of the dashboard
- [ ] T024 Responsive layout verification in `client/src/pages/DashboardPage.tsx` — verify and adjust Tailwind breakpoints for mobile (1-col stacked), tablet (2-col), and desktop (3-col for account cards, 2-col for charts). Ensure charts have minimum heights and remain readable at all breakpoints.
- [ ] T025 Run quickstart.md validation — follow all steps in `specs/007-dashboard-summary/quickstart.md` and verify each checkpoint passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (Recharts installed), T002 (types), T007 (server endpoints mounted). T008-T011 can run in parallel once dependencies met.
- **User Story 2 (Phase 3)**: Depends on T008 (dashboard API client functions). Independent of US1 UI components.
- **User Story 3 (Phase 4)**: Depends on T008 (dashboard API client functions). Independent of US1/US2 UI components.
- **User Story 4 (Phase 5)**: Depends on T008 (dashboard API client functions). Independent of other story UI components.
- **User Story 5 (Phase 6)**: Depends on Phase 2 completion (DashboardPage layout established). Reuses existing transaction form components.
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Setup only — no dependencies on other stories
- **User Story 2 (P2)**: Depends on Setup (T008 specifically) — independent of US1
- **User Story 3 (P2)**: Depends on Setup (T008 specifically) — independent of US1/US2
- **User Story 4 (P3)**: Depends on Setup (T008 specifically) — independent of other stories
- **User Story 5 (P3)**: Depends on US1 (needs DashboardPage layout and refresh mechanism)

### Within Each User Story

- Server-side tasks (Phase 1) before client-side tasks
- Types/API functions before UI components
- Individual components before dashboard page integration
- Core implementation before polish

### Parallel Opportunities

- T003 and T004 can run in parallel (different server files)
- T008, T009, T010, T011 can all run in parallel (different client files)
- US2, US3, US4 can run in parallel after Setup (they only depend on T008 for API functions)
- T022 and T023 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# After Setup complete, launch all US1 component tasks in parallel:
Task: "T008 [P] [US1] Add dashboard API functions to client/src/services/api.ts"
Task: "T009 [P] [US1] Create AccountBalanceCards component in client/src/components/dashboard/AccountBalanceCards.tsx"
Task: "T010 [P] [US1] Create RecentTransactions component in client/src/components/dashboard/RecentTransactions.tsx"
Task: "T011 [P] [US1] Create ExchangeRateIndicator component in client/src/components/dashboard/ExchangeRateIndicator.tsx"

# Then sequential (depends on above):
Task: "T012 [US1] Update NetWorthCard stale rate warning"
Task: "T013 [US1] Compose dashboard layout in DashboardPage.tsx"
```

## Parallel Example: User Stories 2, 3, 4

```bash
# After T008 (API functions) complete, these can all run in parallel:
Task: "T014 [US2] Create SpendingChart component"
Task: "T016 [US3] Create CategoryBreakdown component"
Task: "T018 [US4] Create IncomeExpenseTrend component"

# Then integrate each into DashboardPage sequentially:
Task: "T015 [US2] Integrate SpendingChart"
Task: "T017 [US3] Integrate CategoryBreakdown"
Task: "T019 [US4] Integrate IncomeExpenseTrend"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: User Story 1 (T008-T013)
3. **STOP and VALIDATE**: Dashboard shows net worth, account cards, recent transactions, rate indicator
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → Server endpoints operational
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Bar chart on dashboard → Deploy/Demo
4. Add User Story 3 → Category donut chart → Deploy/Demo
5. Add User Story 4 → Trend line chart → Deploy/Demo
6. Add User Story 5 → Quick-add button → Deploy/Demo
7. Polish phase → Loading skeletons, error handling, responsive verification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All monetary amounts are BigInt in smallest units — use `formatCurrency()` for display
- Transfer transactions must be excluded from all chart/aggregation queries (`type IN ('income', 'expense')`)
- Historical exchange rates must be used for chart aggregations (end-of-month rates via `getHistoricalRate()`)
- Exchange rates older than 24 hours must be flagged as stale
