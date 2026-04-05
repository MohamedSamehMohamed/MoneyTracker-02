# Research: Reports & Analytics

**Feature**: 008-reports-analytics  
**Date**: 2026-04-05

## Decisions

### 1. New Backend Endpoints vs Reusing Existing

**Decision**: Extend existing dashboard routes with 2 new endpoints; reuse existing endpoints for the rest.

**Rationale**: The backend already provides `GET /api/dashboard/spending-chart` (monthly income/expense totals), `GET /api/dashboard/category-summary` (spending by category), and `GET /api/dashboard/income-vs-expense` (monthly income vs expense). These cover most report data needs. Two new endpoints are needed:
- **Net worth over time**: No existing endpoint calculates historical net worth snapshots. A new endpoint must reconstruct account balances at each time point by replaying transactions backward from current balances.
- **CSV export**: The existing `GET /api/transactions` endpoint supports filtering but returns paginated JSON. A dedicated export endpoint removes pagination and streams CSV.

**Alternatives considered**:
- Creating entirely separate report routes/services — rejected because it would duplicate aggregation logic already in `dashboard.service.ts`.
- Adding CSV format to the existing transactions list endpoint via `Accept` header — rejected because export has different concerns (no pagination, streaming, different column set with converted amounts).

---

### 2. Net Worth History Calculation Strategy

**Decision**: Reconstruct historical net worth by working backward from current account balances, subtracting/adding transactions in reverse chronological order.

**Rationale**: There is no `net_worth_snapshots` table. Storing periodic snapshots would require a migration and a cron job. Instead, the calculation can work backward from current `account.balance` values, reversing each transaction's effect on the balance, and converting each account's balance to base currency using `getHistoricalRate()` at each data point's date.

**Alternatives considered**:
- Creating a `net_worth_snapshots` table with periodic cron snapshots — rejected for Phase 8 due to migration complexity and because the transaction volume for a personal finance app is low enough that on-the-fly calculation is performant.
- Using only end-of-month balances from transaction aggregation — rejected because it doesn't account for transfers or multi-currency conversions accurately.

---

### 3. Date Range State Management on Frontend

**Decision**: Use React `useState` at the `ReportsPage` level and pass date range as props to all child report components.

**Rationale**: The app uses local React state everywhere (no Redux, no React Query). Lifting date range state to the page level is consistent with the `DashboardPage` pattern (which passes `refreshKey` to children). Each child component fetches its own data when date range props change.

**Alternatives considered**:
- URL query parameters for date range — adds complexity without clear benefit for a single-page reports view. Could be added later for deep-linking.
- React Context for date range — overkill for a single page with a handful of components.

---

### 4. Chart Library for New Report Charts

**Decision**: Continue using Recharts (v3.8.1, already installed).

**Rationale**: Already used in 3 dashboard components (`BarChart`, `PieChart`, `LineChart`). Supports all needed chart types for reports (line chart for net worth, pie/donut for category breakdown, bar chart for monthly comparison). No additional charting library needed.

**Alternatives considered**: None — Recharts is already established in the codebase.

---

### 5. CSV Export Approach

**Decision**: Server-side CSV generation with a dedicated endpoint that streams the response.

**Rationale**: The spec requires columns including `convertedAmount` (base currency), which requires server-side exchange rate lookups via `getHistoricalRate()`. Client-side generation would require fetching all transactions AND all rates. A server endpoint can stream rows efficiently and handle the 10,000-row limit.

**Alternatives considered**:
- Client-side CSV generation from fetched JSON — rejected because converted amounts require server-side rate lookups; fetching all data to the client is wasteful.
- Background job with download link — overkill for a personal finance app where 10,000 rows is the max.

---

### 6. Extending Category Summary for Income Breakdown

**Decision**: Extend the existing `getCategorySummary()` service to accept a `type` filter parameter (`income` | `expense`).

**Rationale**: The current `getCategorySummary()` only aggregates expenses. Adding a `type` parameter allows it to serve both the spending breakdown (type=expense) and income sources breakdown (type=income) without duplicating logic.

**Alternatives considered**:
- Separate service function for income breakdown — rejected due to code duplication.

---

### 7. Monthly Comparison Data

**Decision**: Extend the existing `getMonthlyTotals()` function and create a thin wrapper for comparison format.

**Rationale**: `getMonthlyTotals()` already produces `{ month, totalIncome, totalExpense, netFlow }` per month. A comparison view just needs to extract the current and previous month entries and compute deltas. This can be done client-side from the existing `spending-chart` endpoint data, or via a thin server helper.

**Alternatives considered**:
- New dedicated endpoint — rejected because the existing `spending-chart` with `months=2` already returns exactly the data needed.

---

### 8. Date Picker Component

**Decision**: Build a simple date range picker using native HTML `<input type="date">` with preset buttons, following the existing pattern in `CategoryBreakdown.tsx`.

**Rationale**: No date library (dayjs, date-fns) is installed. The existing `CategoryBreakdown` component already implements a preset + custom date picker using native inputs. Replicating this pattern keeps dependencies minimal and stays consistent with the codebase.

**Alternatives considered**:
- Installing a date picker library (react-datepicker, etc.) — rejected to minimize dependencies; native inputs are sufficient for the use case.
