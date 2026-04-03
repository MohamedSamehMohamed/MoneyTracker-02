# Feature Specification: Dashboard & Summary

**Feature Branch**: `007-dashboard-summary`
**Created**: 2026-04-03
**Status**: Draft
**Input**: User description: "I wanna start with phase 6 dashboard & summary"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Financial Overview at a Glance (Priority: P1)

As a user, I want to see my total net worth, all account balances, and recent transactions on a single dashboard page so I can quickly understand my current financial position without navigating to multiple pages.

**Why this priority**: The dashboard is the primary landing page. Showing net worth, account balances, and recent activity is the core value proposition — users need to see where their money is before analyzing trends.

**Independent Test**: Can be fully tested by logging in and viewing the dashboard page. It delivers immediate value by showing aggregated balances across all accounts (cash, bank, wallet, gold) converted to the user's base currency, along with individual account cards and the 5-10 most recent transactions.

**Acceptance Scenarios**:

1. **Given** a user with multiple accounts (cash EGP, USD, gold, bank), **When** they navigate to the dashboard, **Then** they see their total net worth in their base currency prominently displayed, with a breakdown of each account showing both original and converted balances.
2. **Given** a user with recent transactions, **When** they view the dashboard, **Then** they see the most recent transactions (up to 10) with date, amount, category, and account name.
3. **Given** a user with no accounts or transactions, **When** they view the dashboard, **Then** they see a friendly empty state with guidance to create their first account and add a transaction.
4. **Given** exchange rates are available, **When** the dashboard loads, **Then** a "last updated" indicator shows when rates were last refreshed, giving the user confidence in the accuracy of conversions.

---

### User Story 2 - Monthly Spending & Income Visualization (Priority: P2)

As a user, I want to see a bar chart comparing my monthly income versus expenses so I can quickly identify spending patterns and whether I am saving or overspending each month.

**Why this priority**: After seeing current balances (P1), the next most valuable insight is understanding monthly cash flow trends. This tells users whether they are on track financially.

**Independent Test**: Can be tested by viewing the dashboard with at least 2-3 months of transaction data. The bar chart should display grouped bars (income and expense) for each month, allowing visual comparison.

**Acceptance Scenarios**:

1. **Given** a user with transactions spanning multiple months, **When** the dashboard loads, **Then** a bar chart displays monthly income and expense totals for the last 6 months by default.
2. **Given** a user with no transactions, **When** the dashboard loads, **Then** the chart area shows a placeholder message indicating no data is available yet.
3. **Given** a user with transactions in only one month, **When** the dashboard loads, **Then** the chart displays that single month's data without errors.

---

### User Story 3 - Spending Breakdown by Category (Priority: P2)

As a user, I want to see a pie or donut chart showing how my expenses are distributed across categories (food, transport, rent, etc.) so I can identify where most of my money goes.

**Why this priority**: Category breakdown complements the monthly trend (P2) by giving users a different perspective — not just "how much" but "on what." This is essential for budgeting decisions.

**Independent Test**: Can be tested by viewing the dashboard with transactions assigned to different categories. The chart should display each category as a segment with its name, amount, and percentage.

**Acceptance Scenarios**:

1. **Given** a user with expense transactions across multiple categories, **When** the dashboard loads, **Then** a pie/donut chart shows the spending distribution for the current month, with each category labeled and showing its percentage.
2. **Given** a user selects a different time period, **When** the chart updates, **Then** it reflects spending distribution for the selected period.
3. **Given** a user with expenses in only one category, **When** the dashboard loads, **Then** the chart displays a single full segment for that category.

---

### User Story 4 - Income vs. Expense Trend Over Time (Priority: P3)

As a user, I want to see a line chart showing my income and expense trends over time so I can visualize whether my financial situation is improving or declining.

**Why this priority**: This is a deeper analytical view that builds on top of the monthly bar chart. While valuable, it overlaps with the bar chart's data and is less critical for initial dashboard delivery.

**Independent Test**: Can be tested by viewing the dashboard with several months of data. Two lines (income and expense) should be plotted over time, making trends visible.

**Acceptance Scenarios**:

1. **Given** a user with transactions over several months, **When** the dashboard loads, **Then** a line chart plots income and expense trends over the last 6 months.
2. **Given** the user hovers over a data point, **When** the tooltip appears, **Then** it shows the exact income or expense amount for that month.

---

### User Story 5 - Quick-Add Transaction from Dashboard (Priority: P3)

As a user, I want a quick-add button on the dashboard that lets me immediately create a new transaction without navigating away, so that recording expenses is fast and frictionless.

**Why this priority**: Convenience feature that reduces friction for the most common action (adding transactions). Important for daily use but the dashboard delivers value without it.

**Independent Test**: Can be tested by clicking the quick-add button on the dashboard and completing the transaction form. The dashboard should reflect the new transaction immediately after submission.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard, **When** they click the quick-add button, **Then** a modal or inline form appears to add a new transaction (amount, type, account, category, date, note).
2. **Given** a user submits a new transaction via quick-add, **When** the transaction is saved, **Then** the dashboard refreshes to show updated balances, recent transactions, and charts.

---

### Edge Cases

- What happens when a user has accounts but zero transactions? Dashboard should show account balances (possibly zero) and empty states for charts and recent transactions.
- What happens when exchange rates are unavailable or stale (e.g., API failure)? Dashboard should still load with available data and show a warning that rates may be outdated, displaying the last-known rate age.
- What happens when a user has only income transactions and no expenses (or vice versa)? Charts should handle single-type data gracefully without breaking or showing misleading visualizations.
- What happens when a user has transactions in currencies without available exchange rates? The net worth calculation should exclude those accounts or show them as unconvertible with a clear indicator.
- What happens when a user's transaction history spans less than one month? Monthly charts should display partial data for the current month rather than showing nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an aggregated monthly income and expense summary, returning totals grouped by month for a configurable number of past months (default: 6 months). Transfer transactions MUST be excluded from income and expense totals.
- **FR-002**: System MUST provide a spending breakdown by category for a given time period, returning each category's name, total amount, and percentage of total spending. Transfer transactions MUST be excluded from category breakdown. The time period selector MUST offer presets (current month, last 3 months, last 6 months, last 12 months) and a custom date range picker. Default: current month.
- **FR-003**: System MUST provide income vs. expense totals over time, returning monthly data points suitable for trend visualization.
- **FR-004**: Dashboard MUST display the user's total net worth in their base currency, with individual account balances showing both original and converted amounts.
- **FR-005**: Dashboard MUST display the most recent transactions (up to 10) with relevant details (date, amount, category, account, type).
- **FR-006**: Dashboard MUST display a bar chart comparing monthly income vs. expenses.
- **FR-007**: Dashboard MUST display a pie or donut chart showing spending distribution by category.
- **FR-008**: Dashboard MUST display a line chart showing income and expense trends over time.
- **FR-009**: Dashboard MUST include a quick-add button that allows users to create a new transaction without leaving the dashboard.
- **FR-010**: Dashboard MUST display a "last updated" indicator for exchange rates, showing when rates were last refreshed. Rates older than 24 hours MUST be visually flagged as potentially stale with a warning indicator.
- **FR-011**: Dashboard MUST handle empty states gracefully — showing helpful messages when the user has no accounts, no transactions, or no data for a given period.
- **FR-012**: Dashboard MUST convert all monetary values to the user's base currency for aggregated views. Net worth and account balances use current exchange rates. Chart aggregations (monthly summaries, category breakdown) MUST use the exchange rate that was active at the end of each respective month for historical accuracy.
- **FR-013**: Charts MUST display tooltips on hover showing exact values.

### Key Entities

- **Monthly Summary**: Aggregation of income and expense totals grouped by calendar month, associated with a user. Used for bar and line charts.
- **Category Breakdown**: Aggregation of expense amounts grouped by transaction category for a time period. Includes category name, color, total amount, and percentage of total. Used for the pie/donut chart.
- **Dashboard Snapshot**: A composite view combining net worth, account balances, recent transactions, monthly summaries, and category breakdown into a single dashboard experience.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their complete financial overview (net worth, balances, recent transactions, charts) on a single page within 3 seconds of navigation.
- **SC-002**: Users can identify their top 3 spending categories within 5 seconds of viewing the dashboard.
- **SC-003**: Users can add a new transaction from the dashboard in under 30 seconds using the quick-add feature.
- **SC-004**: Dashboard correctly displays data for users with 1,000+ transactions without noticeable performance degradation.
- **SC-005**: All charts render correctly with data ranging from 1 month to 12+ months of transaction history.
- **SC-006**: Dashboard gracefully handles all empty/missing data states without errors or broken layouts.

## Clarifications

### Session 2026-04-03

- Q: Should transfer transactions be included in income/expense charts and category breakdown? → A: Exclude transfers entirely from income/expense charts and category breakdown.
- Q: Should chart aggregations use current or historical exchange rates? → A: Use the exchange rate active at the end of each respective month for historical accuracy.
- Q: What time period options for category breakdown? → A: Presets (current month, last 3/6/12 months) plus custom date range picker. Default: current month.
- Q: At what age should exchange rates be flagged as stale? → A: 24 hours (6 missed refresh cycles).

## Assumptions

- The existing net worth endpoint (`/api/exchange-rates/net-worth`) will continue to serve net worth and account balance data; new endpoints will be added for chart-specific data.
- Monthly summaries will aggregate by calendar month (not rolling 30-day periods).
- The default time range for charts is the last 6 months, which covers a reasonable history for most users.
- Category breakdown focuses on expenses only (income categories are less meaningful for "where does my money go" analysis).
- The quick-add transaction will reuse the existing transaction creation form/logic, presented in a modal overlay.
- Exchange rate "last updated" will use the most recent `fetchedAt` timestamp from cached rates.
