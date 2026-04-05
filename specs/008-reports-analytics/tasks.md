# Tasks: Reports & Analytics

**Input**: Design documents from `/specs/008-reports-analytics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Not requested in feature specification. Omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and shared API client methods needed by all report components

- [ ] T001 Create reports component directory at `client/src/components/reports/`
- [ ] T002 Add `dashboardApi.netWorthHistory()` method to `client/src/services/api.ts` — accepts `{ dateFrom?, dateTo?, granularity? }`, calls `GET /api/dashboard/net-worth-history`, returns `{ baseCurrency, dateFrom, dateTo, granularity, dataPoints: { date, netWorth }[] }`
- [ ] T003 Add `transactionsApi.exportCsv()` method to `client/src/services/api.ts` — accepts `{ dateFrom, dateTo, accountId?, categoryId?, type? }`, calls `GET /api/transactions/export`, triggers file download by creating a blob URL from the response
- [ ] T004 Update `dashboardApi.categorySummary()` in `client/src/services/api.ts` to accept optional `type` parameter (`"income" | "expense"`) and pass it as a query param

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reports page layout and date range selector that ALL report components depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [US1] Create `DateRangeSelector` component at `client/src/components/reports/DateRangeSelector.tsx` — renders preset buttons ("This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year", "All Time") and two native `<input type="date">` fields for custom range. Follow the existing date picker pattern from `client/src/components/dashboard/CategoryBreakdown.tsx`. Props: `dateFrom: string`, `dateTo: string`, `onChange: (dateFrom: string, dateTo: string) => void`. Each preset computes absolute dates relative to today. Tailwind-styled with active state on selected preset.
- [ ] T006 [US1] Build out `ReportsPage` at `client/src/pages/ReportsPage.tsx` (currently a stub) — add `useState` for `dateFrom` (default: 6 months ago as YYYY-MM-DD) and `dateTo` (default: today as YYYY-MM-DD). Render `DateRangeSelector` at the top, passing state and setter. Below it, render placeholder sections for each report (to be replaced in subsequent phases). Use the existing page layout pattern from `DashboardPage.tsx` with heading + grid layout. Include loading/error wrapper pattern consistent with other pages.

**Checkpoint**: Reports page loads at `/reports` with a working date range selector. Changing dates updates state. No report data yet.

---

## Phase 3: User Story 2 - View Spending Breakdown by Category (Priority: P1) 🎯 MVP

**Goal**: Users can see a detailed table and chart showing spending grouped by category for a selected date range.

**Independent Test**: Navigate to `/reports`, select a date range, verify expense categories appear in both a table (with amounts and percentages) and a donut chart. Verify empty state when no expenses exist in range.

### Backend

- [ ] T007 [US2] Extend `getCategorySummary()` in `server/src/services/dashboard.service.ts` to accept an optional `type` parameter (`"income" | "expense"`, default `"expense"`). Change the Prisma `where` clause to filter by the provided type instead of hardcoding `"expense"`. Rename internal variable `totalSpending` contextually (or keep as-is since response shape is the same). Ensure transfers are excluded regardless of type filter.
- [ ] T008 [US2] Add `type` field to the category summary Zod schema in `server/src/routes/dashboard.schemas.ts` — `type: z.enum(["income", "expense"]).optional().default("expense")`. Update the route handler in `server/src/routes/dashboard.routes.ts` to pass the `type` param through to the controller.
- [ ] T009 [US2] Update `getCategorySummary` handler in `server/src/controllers/dashboard.controller.ts` to extract `type` from validated query and pass it to the service function.

### Frontend

- [ ] T010 [US2] Create `SpendingBreakdown` component at `client/src/components/reports/SpendingBreakdown.tsx`. Props: `dateFrom: string`, `dateTo: string`. On mount and when props change, call `dashboardApi.categorySummary({ dateFrom, dateTo, type: "expense" })`. Display results as: (1) A Recharts `PieChart` (donut style with `innerRadius`) using category colors from the API response, with `Tooltip` showing category name + amount + percentage. (2) A table below the chart listing each category with columns: color swatch, name, amount (formatted with `formatCurrency`), percentage. Sort by total descending. Show loading skeleton (animate-pulse divs) while fetching. Show empty state message when no data. Follow existing `CategoryBreakdown.tsx` chart pattern for Recharts setup.
- [ ] T011 [US2] Integrate `SpendingBreakdown` into `ReportsPage` at `client/src/pages/ReportsPage.tsx` — replace the spending placeholder section with `<SpendingBreakdown dateFrom={dateFrom} dateTo={dateTo} />`. Wrap in an `ErrorBoundary`.

**Checkpoint**: Reports page shows spending breakdown by category with chart and table. Changing date range updates the data. Empty state works.

---

## Phase 4: User Story 3 - Track Net Worth Over Time (Priority: P1)

**Goal**: Users can see a line chart showing how their total net worth changed over time within a selected date range.

**Independent Test**: Navigate to `/reports`, select a date range spanning multiple months, verify a line chart renders with net worth data points. Change granularity via date range (short range = more points, long range = fewer points).

### Backend

- [ ] T012 [US3] Add Zod schema for net-worth-history endpoint in `server/src/routes/dashboard.schemas.ts` — `dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`, `dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`, `granularity: z.enum(["daily", "weekly", "monthly", "auto"]).optional().default("auto")`. Note: T008 also modifies this file — run T008 first or T012 after T008.
- [ ] T013 [US3] Implement `getNetWorthHistory()` in `server/src/services/dashboard.service.ts`. Algorithm: (1) Fetch user's baseCurrency and all user accounts with current balances. (2) Determine date range: default dateFrom = 6 months ago, dateTo = today. (3) Resolve granularity: if "auto", use daily for <31 days, weekly for <93 days, monthly otherwise. (4) Generate list of data point dates based on granularity (end of each period). (5) Fetch all user transactions within the date range, ordered by date DESC. (6) For each data point date (working backward from today): reconstruct each account's balance at that date by subtracting/adding transactions that occurred after that date. For income/transfer-in: subtract from balance. For expense/transfer-out: add back to balance. (7) Convert each account balance to baseCurrency using `getHistoricalRate(account.currency, baseCurrency, dataPointDate)` with a rateCache Map. (8) Sum all converted account balances for the net worth at that date. Return `{ baseCurrency, dateFrom, dateTo, granularity, dataPoints: [{ date, netWorth }] }`. Performance note: cache exchange rate lookups in a Map keyed by `${currency}_${dateString}` to avoid redundant calls. For ranges over 1 year, cap at monthly granularity to limit data points (max ~24). Ensure the algorithm is O(transactions + dataPoints*accounts) not O(transactions*dataPoints).
- [ ] T014 [US3] Add `getNetWorthHistory` handler in `server/src/controllers/dashboard.controller.ts` — extract validated query params, call `dashboardService.getNetWorthHistory(userId, params)`, return JSON result. Handle errors with `next(error)`.
- [ ] T015 [US3] Register `GET /net-worth-history` route in `server/src/routes/dashboard.routes.ts` — apply `authMiddleware`, `validateMiddleware(netWorthHistorySchema, "query")`, then the controller handler.

### Frontend

- [ ] T016 [US3] Create `NetWorthChart` component at `client/src/components/reports/NetWorthChart.tsx`. Props: `dateFrom: string`, `dateTo: string`. On mount and when props change, call `dashboardApi.netWorthHistory({ dateFrom, dateTo })`. Render a Recharts `LineChart` inside `<ResponsiveContainer width="100%" height={350}>` with: `XAxis` (dataKey="date", formatted as short month+year or day depending on granularity), `YAxis` (formatted with currency), `CartesianGrid` (strokeDasharray), `Tooltip` (formatted with `formatCurrency`), single `Line` (dataKey="netWorth", stroke color, smooth curve with `type="monotone"`). Show loading skeleton while fetching. Show empty state when no data points. Display the resolved granularity label (e.g., "Monthly" or "Weekly") in a subtitle.
- [ ] T017 [US3] Integrate `NetWorthChart` into `ReportsPage` at `client/src/pages/ReportsPage.tsx` — replace the net worth placeholder with `<NetWorthChart dateFrom={dateFrom} dateTo={dateTo} />`. Wrap in `ErrorBoundary`. Position as the first report section (full width) above the spending breakdown.

**Checkpoint**: Reports page shows net worth line chart above spending breakdown. Both respond to date range changes.

---

## Phase 5: User Story 4 - Compare Monthly Income vs Expenses (Priority: P2)

**Goal**: Users can see current month vs previous month totals for income and expenses with change indicators.

**Independent Test**: Navigate to `/reports`, verify two months are compared side-by-side with income/expense totals and percentage changes. Positive changes show green, negative show red.

### Frontend (no backend changes needed — uses existing `spending-chart` endpoint with `months=2`)

- [ ] T018 [US4] Create `MonthlyComparison` component at `client/src/components/reports/MonthlyComparison.tsx`. No date range props needed (always compares current vs previous month). On mount, call `dashboardApi.spendingChart(2)` to get the last 2 months of data. Compute: `incomeChange = { absolute: current.totalIncome - previous.totalIncome, percentage: ((current - previous) / previous) * 100 }` and same for expenses. Handle division by zero (previous = 0 → show "N/A" or "New"). Render as two side-by-side cards (Tailwind grid): left card = previous month, right card = current month. Each card shows: month label (e.g., "March 2026"), income total (green), expense total (red), net flow. Between cards or below, show change indicators: arrow up/down icon + percentage + absolute change. Green for improvement (income up or expense down), red for worsening. Show loading skeleton while fetching. Handle case where only 1 month of data exists (show single month with "No previous month data" note).
- [ ] T019 [US4] Integrate `MonthlyComparison` into `ReportsPage` at `client/src/pages/ReportsPage.tsx` — add below the spending breakdown section. Wrap in `ErrorBoundary`. Note: this component does NOT depend on the page-level date range (always shows current vs previous month).

**Checkpoint**: Monthly comparison cards display correctly. Income/expense changes are visually indicated.

---

## Phase 6: User Story 5 - View Income Sources Breakdown (Priority: P2)

**Goal**: Users can see their income grouped by category with amounts and proportions for the selected date range.

**Independent Test**: Navigate to `/reports`, select a date range, verify income categories appear in a chart and table similar to the spending breakdown but filtered to income transactions only.

### Frontend (backend already extended in T007-T009 to support `type=income`)

- [ ] T020 [US5] Create `IncomeBreakdown` component at `client/src/components/reports/IncomeBreakdown.tsx`. Props: `dateFrom: string`, `dateTo: string`. On mount and when props change, call `dashboardApi.categorySummary({ dateFrom, dateTo, type: "income" })`. Render in the same style as `SpendingBreakdown`: (1) Recharts `PieChart` (donut) with category colors and tooltip. (2) Table with color swatch, category name, amount, percentage. Sort by total descending. Show loading skeleton while fetching. Show empty state when no income data exists. Use a distinct heading ("Income Sources" vs "Spending Breakdown") and optionally a different accent color scheme to differentiate from spending.
- [ ] T021 [US5] Integrate `IncomeBreakdown` into `ReportsPage` at `client/src/pages/ReportsPage.tsx` — add alongside or below the spending breakdown. Consider a two-column grid layout: spending on the left, income on the right (on desktop). Wrap in `ErrorBoundary`.

**Checkpoint**: Income breakdown appears alongside spending breakdown. Both respond to the same date range selector.

---

## Phase 7: User Story 6 - Export Transactions to CSV (Priority: P3)

**Goal**: Users can download a CSV file of their transactions filtered by the current date range and optional filters.

**Independent Test**: Navigate to `/reports`, select a date range, click "Export to CSV", verify a `.csv` file downloads with correct columns and filtered data. Verify button is disabled when no data matches.

### Backend

- [ ] T022 [P] [US6] Add Zod schema for export endpoint in `server/src/routes/transaction.schemas.ts` — `dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` (required), `dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` (required), `accountId: z.string().uuid().optional()`, `categoryId: z.string().uuid().optional()`, `type: z.enum(["income", "expense", "transfer"]).optional()`.
- [ ] T023 [US6] Implement `exportTransactions()` in `server/src/services/transaction.service.ts`. Steps: (1) Fetch user's baseCurrency. (2) Query transactions matching filters with Prisma (same `where` pattern as `listTransactions` but without pagination, limit 10,000, include account and category relations). (3) For each transaction, call `getHistoricalRate(account.currency, baseCurrency, transaction.date)` with rateCache Map. (4) Build CSV string: header row `Date,Type,Category,Account,Note,Amount,Currency,Converted Amount,Base Currency`, then one row per transaction with amounts divided by `getDivisor(currency)` and formatted to 2 decimals (3 for gold). (5) Return the CSV string and the count of rows. If count is 0, throw a NotFoundError.
- [ ] T024 [US6] Add `exportTransactions` handler in `server/src/controllers/transaction.controller.ts` — extract validated query, call service, set response headers (`Content-Type: text/csv`, `Content-Disposition: attachment; filename="transactions_{dateFrom}_{dateTo}.csv"`), send CSV string as response body. If NotFoundError, return 404 JSON.
- [ ] T025 [US6] Register `GET /export` route in `server/src/routes/transaction.routes.ts` — apply `authMiddleware`, `validateMiddleware(exportSchema, "query")`, then the controller handler. Place this route BEFORE the `GET /:id` route to avoid route conflict.

### Frontend

- [ ] T026 [US6] Create `ExportButton` component at `client/src/components/reports/ExportButton.tsx`. Props: `dateFrom: string`, `dateTo: string`. Renders a button styled with Tailwind (outline style with download icon). On click, calls `transactionsApi.exportCsv({ dateFrom, dateTo })`. Show a loading spinner on the button while the request is in progress. Handle errors with a toast or inline error message. If the API returns 404 (no data), show a brief "No transactions to export" message.
- [ ] T027 [US6] Integrate `ExportButton` into `ReportsPage` at `client/src/pages/ReportsPage.tsx` — place next to the `DateRangeSelector` in the page header area (same row, right-aligned). Pass current `dateFrom` and `dateTo` props.

**Checkpoint**: CSV export works end-to-end. Button downloads a valid CSV file filtered by the selected date range.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Layout refinement, empty states, and responsive design across all report sections

- [ ] T028 [P] Refine `ReportsPage` grid layout in `client/src/pages/ReportsPage.tsx` — ensure responsive behavior: full-width stacked on mobile, two-column grid for spending/income breakdowns on desktop (md breakpoint). Net worth chart and monthly comparison are always full-width. Add consistent section headings and spacing between report cards. Use Tailwind `bg-white rounded-lg shadow p-6` card pattern consistent with dashboard.
- [ ] T029 [P] Add empty state handling across all report components — when the user has zero transactions, show a single unified empty state on the `ReportsPage` with a message like "No transaction data yet. Add your first transaction to see reports here." with a link/button to `/transactions/new`. Individual components should still handle their own empty states for partial data (e.g., has expenses but no income).
- [ ] T030 Verify all report components handle the "All Time" date range preset correctly — when "All Time" is selected, `dateFrom` should be set to the user's account creation date or earliest transaction date (or a reasonable far-past date like 2020-01-01), and `dateTo` to today. Ensure no performance degradation with large date ranges.
- [ ] T031 Run quickstart.md verification checklist — manually test all items listed in `specs/008-reports-analytics/quickstart.md` Verification section.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 from Setup — BLOCKS all user stories
- **US2 - Spending Breakdown (Phase 3)**: Depends on Phase 2 (needs DateRangeSelector + ReportsPage)
- **US3 - Net Worth Chart (Phase 4)**: Depends on Phase 2 only. Can run in PARALLEL with Phase 3
- **US4 - Monthly Comparison (Phase 5)**: Depends on Phase 2 only. Can run in PARALLEL with Phases 3-4
- **US5 - Income Breakdown (Phase 6)**: Depends on T007-T009 from Phase 3 (backend `type` param extension). Frontend can start after Phase 2 but needs backend from US2
- **US6 - CSV Export (Phase 7)**: Depends on Phase 2 only. Can run in PARALLEL with Phases 3-5
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Date Range)**: Foundational — all other stories depend on this
- **US2 (Spending)**: Independent after Phase 2. Backend changes also enable US5
- **US3 (Net Worth)**: Fully independent after Phase 2
- **US4 (Monthly Comparison)**: Fully independent after Phase 2 (no backend changes)
- **US5 (Income)**: Depends on US2's backend changes (T007-T009)
- **US6 (CSV Export)**: Fully independent after Phase 2

### Within Each User Story

- Backend schema → service → controller → route (sequential)
- Frontend component → page integration (sequential)
- Backend and frontend tracks can run in parallel within a story

### Parallel Opportunities

```
After Phase 2 completes:
├── US2 backend (T007-T009) + US6 backend (T022-T025) — different files, true parallel
├── US4 frontend (T018-T019) — no backend needed, true parallel
├── After T008 completes: US3 schema T012 (same file: dashboard.schemas.ts)
├── After T007 completes: US3 service T013 (same file: dashboard.service.ts)
├── US3 controller T014 + route T015 — parallel with any (different files)
└── After US2 backend (T007-T009): US5 frontend (T020-T021)

File conflict summary:
  - dashboard.service.ts: T007 (US2) then T013 (US3) — sequential
  - dashboard.schemas.ts: T008 (US2) then T012 (US3) — sequential
  - dashboard.controller.ts: T009 (US2) then T014 (US3) — sequential
  - dashboard.routes.ts: T008 (US2) then T015 (US3) — sequential
  - api.ts: T002, T003, T004 — sequential (same file)
```

---

## Parallel Example: Phase 3 + Phase 4 + Phase 7

```
# TRUE parallel (different files, no conflicts):
Task T007-T009 (US2 backend) || Task T022-T025 (US6 backend) || Task T018-T019 (US4 frontend)

# SEQUENTIAL due to shared files (US2 backend must complete before US3 backend):
Task T008 (dashboard.schemas.ts) → then T012 (dashboard.schemas.ts)
Task T007 (dashboard.service.ts) → then T013 (dashboard.service.ts)
Task T009 (dashboard.controller.ts) → then T014 (dashboard.controller.ts)
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Setup (API methods, directory)
2. Complete Phase 2: Reports page + date range selector (US1)
3. Complete Phase 3: Spending breakdown (US2)
4. **STOP and VALIDATE**: Users can view spending by category with date filtering
5. This alone delivers the highest-value report feature

### Incremental Delivery

1. Setup + Foundational → Page with date selector ready
2. Add US2 (Spending) → First real report visible → Validate
3. Add US3 (Net Worth) → Core financial tracking → Validate
4. Add US4 (Monthly Comparison) → Quick win, frontend-only → Validate
5. Add US5 (Income) → Complete cash flow picture → Validate
6. Add US6 (CSV Export) → Power user feature → Validate
7. Polish → Responsive layout, empty states → Final validation

---

## Notes

- No database migrations needed — all data derived from existing tables
- T007 modifies `dashboard.service.ts` and T013 also modifies it — implement T007 first
- Monthly comparison (US4) requires zero backend changes — fastest to implement
- Income breakdown (US5) reuses the same backend extension as spending (US2) — just pass `type: "income"`
- The `transactionsApi.exportCsv()` method (T003) must handle the response as a blob, not JSON — use `response.blob()` instead of `response.json()`
- All monetary values from API are numbers (already converted from BigInt by existing services) — pass directly to Recharts
