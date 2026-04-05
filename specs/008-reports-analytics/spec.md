# Feature Specification: Reports & Analytics

**Feature Branch**: `008-reports-analytics`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User description: "phase 8 from plan.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Date Range for All Reports (Priority: P1)

As a user, I want a consistent date range selector on the Reports page that controls all charts and data displays, so I can analyze my finances for any time period I choose.

**Why this priority**: The date range selector is foundational — every other report depends on it. Without it, no report is useful.

**Independent Test**: Can be fully tested by selecting different date ranges (presets and custom) and verifying all visible reports update to reflect the selected period.

**Acceptance Scenarios**:

1. **Given** I am on the Reports page, **When** I select a preset date range (e.g., "This Month", "Last 3 Months", "This Year", "All Time"), **Then** all charts and data tables update to show data for that period.
2. **Given** I want to analyze a specific period, **When** I use the custom date range picker to set start and end dates, **Then** all reports update to reflect the exact date range I selected.
3. **Given** I select a date range, **When** I navigate between different report views on the page, **Then** my selected date range persists across all views without needing to reselect.

---

### User Story 2 - View Spending Breakdown by Category (Priority: P1)

As a user, I want to see a detailed breakdown of my spending by category for a selected date range, so I can understand where my money is going and identify areas to reduce expenses.

**Why this priority**: Understanding spending patterns by category is the primary reason users visit a reports page. It provides immediate, actionable insight into financial habits.

**Independent Test**: Can be fully tested by selecting a date range and verifying that spending amounts are grouped by category with correct totals displayed in both a table and a visual chart.

**Acceptance Scenarios**:

1. **Given** I have transactions across multiple categories in the last month, **When** I navigate to the Reports page and select "Last 30 days", **Then** I see a table listing each category with its total spending amount and percentage of total, alongside a visual chart representing the distribution.
2. **Given** I select a date range with no expense transactions, **When** the reports page loads, **Then** I see a helpful empty state indicating no spending data is available for the selected period.
3. **Given** I have transactions in multiple currencies, **When** I view the spending breakdown, **Then** all amounts are converted to my base currency (EGP) for accurate totals.

---

### User Story 3 - Track Net Worth Over Time (Priority: P1)

As a user, I want to see how my total net worth has changed over time on a line chart, so I can track my overall financial progress and spot trends.

**Why this priority**: Net worth tracking over time is a core value proposition of the app — it ties directly to the app's purpose of tracking total money across multiple sources.

**Independent Test**: Can be fully tested by verifying that a line chart displays net worth data points over a selected time period, correctly reflecting account balances and currency conversions at each point.

**Acceptance Scenarios**:

1. **Given** I have transaction history spanning multiple months, **When** I view the net worth chart, **Then** I see a line chart showing my total net worth (in base currency) plotted over time with regular data points.
2. **Given** I select a custom date range, **When** the chart updates, **Then** only data within that range is displayed with appropriate time granularity (daily for ranges under 1 month, weekly for 1-3 months, monthly for longer).
3. **Given** I have accounts in different currencies and gold, **When** viewing net worth over time, **Then** each data point reflects the exchange rates applicable at that point in time.

---

### User Story 4 - Compare Monthly Income vs Expenses (Priority: P2)

As a user, I want to compare my income and expenses between the current month and the previous month, so I can quickly see if my financial habits are improving or worsening.

**Why this priority**: Month-over-month comparison is a natural next step after understanding current spending — it helps users identify trends without requiring deep analysis.

**Independent Test**: Can be fully tested by verifying that current month and previous month totals for income and expenses are displayed side-by-side with percentage change indicators.

**Acceptance Scenarios**:

1. **Given** I have transactions in both the current and previous month, **When** I view the monthly comparison report, **Then** I see income and expense totals for both months displayed side-by-side with the absolute and percentage change.
2. **Given** my spending increased compared to last month, **When** I view the comparison, **Then** the expense change is visually indicated as negative (e.g., red) and the exact percentage increase is shown.
3. **Given** I have no transactions in the previous month, **When** I view the comparison, **Then** the previous month shows zero with a clear indication that no data exists for comparison.

---

### User Story 5 - View Income Sources Breakdown (Priority: P2)

As a user, I want to see a breakdown of my income by source/category, so I can understand the diversification of my income streams and identify my primary earning sources.

**Why this priority**: Complements the spending breakdown — together they give a complete picture of cash flow. Slightly lower priority because most users have fewer income categories than expense categories.

**Independent Test**: Can be fully tested by verifying that income transactions are grouped by category and displayed with amounts and proportions for a selected date range.

**Acceptance Scenarios**:

1. **Given** I have income transactions from multiple categories (e.g., Salary, Freelance, Investments), **When** I view the income breakdown, **Then** I see each income source listed with its total amount, percentage of total income, and a visual chart.
2. **Given** I select a specific date range, **When** the income breakdown updates, **Then** only income within that range is included in the totals.

---

### User Story 6 - Export Transactions to CSV (Priority: P3)

As a user, I want to export my transaction history to a CSV file with the currently applied filters, so I can perform custom analysis in a spreadsheet or share the data with an accountant.

**Why this priority**: Export is a utility feature that serves power users and external workflows. It's important but not the core analytics experience.

**Independent Test**: Can be fully tested by applying filters on the reports page and downloading a CSV file, then verifying the file contains the correct filtered transaction data with all relevant fields.

**Acceptance Scenarios**:

1. **Given** I have applied date range and category filters, **When** I click the "Export to CSV" button, **Then** a CSV file is downloaded containing only the transactions matching my filters.
2. **Given** I export transactions, **When** I open the CSV file, **Then** it contains columns for date, note, category, account name, original amount with currency, converted amount in base currency, and transaction type.
3. **Given** I have no transactions matching my current filters, **When** I click the export button, **Then** I see a message indicating there is no data to export.

---

### Edge Cases

- What happens when a user has only one month of data? The monthly comparison shows the available month with a note about insufficient historical data.
- How does the system handle date ranges that span periods with exchange rate changes? Each transaction is converted using the exchange rate closest to its transaction date.
- What happens when a user has no transactions at all? All report sections display helpful empty states encouraging the user to add their first transaction.
- How does the CSV export handle large datasets (thousands of transactions)? The export supports up to 10,000 rows per export with a clear indication if the limit is reached.
- What happens when the user's only transactions are transfers between accounts? The spending and income breakdowns show zero with a note, while net worth and account-level data still display correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Reports page accessible from the main navigation with a unified date range selector that controls all applicable report views. Note: the monthly comparison (FR-006) always shows current vs previous month and is not controlled by the date range selector.
- **FR-002**: System MUST offer preset date ranges: "This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year", and "All Time".
- **FR-003**: System MUST allow users to select a custom date range with specific start and end dates.
- **FR-004**: System MUST display a net worth over time line chart showing the user's total net worth (in base currency) at regular intervals within the selected date range.
- **FR-005**: System MUST display a spending breakdown by category showing each expense category's total amount, percentage of total spending, in both tabular and chart form.
- **FR-006**: System MUST display a monthly comparison showing current month vs previous month for both income and expenses, with absolute and percentage change indicators.
- **FR-007**: System MUST display an income sources breakdown showing each income category's total amount and percentage of total income for the selected period.
- **FR-008**: System MUST allow users to export filtered transactions to a CSV file containing date, note, category, account name, original amount with currency, converted amount in base currency, and transaction type.
- **FR-009**: System MUST convert all monetary amounts to the user's base currency (EGP) using the applicable exchange rates when displaying aggregated totals.
- **FR-010**: System MUST display appropriate empty states when no data is available for any report section within the selected date range.
- **FR-011**: System MUST persist the selected date range across different date-range-controlled report views within the same session.
- **FR-012**: System MUST exclude transfer transactions from income and expense totals to avoid double-counting.

### Key Entities

- **Report Period**: A user-defined time range (preset or custom) that scopes all analytics data. Defined by a start date and end date.
- **Spending Breakdown**: An aggregation of expense transactions grouped by category within a report period. Attributes: category name, total amount (base currency), percentage of total.
- **Income Breakdown**: An aggregation of income transactions grouped by category within a report period. Attributes: category name, total amount (base currency), percentage of total.
- **Net Worth Snapshot**: A calculated total of all account balances converted to base currency at a point in time. Used to build the net worth trend line.
- **Monthly Comparison**: A side-by-side summary of income and expense totals for two consecutive months, with computed deltas.
- **Transaction Export**: A filtered set of transaction records formatted for external use (CSV), preserving both original and converted amounts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their spending breakdown by category within 3 seconds of selecting a date range.
- **SC-002**: Users can identify their top 3 expense categories at a glance from the reports page.
- **SC-003**: Users can track their net worth trend over any period spanning up to 2 years of history.
- **SC-004**: Users can compare current vs previous month income and expenses in a single view without manual calculation.
- **SC-005**: Users can export up to 10,000 transactions to a CSV file that opens correctly in common spreadsheet applications.
- **SC-006**: All report charts and data update within 3 seconds when the date range is changed.
- **SC-007**: 90% of users can locate and use the date range selector on their first visit to the Reports page.
- **SC-008**: Users can switch between different report views without losing their selected date range.

## Assumptions

- The app already has a functioning dashboard (Phase 6/7) with basic charts; this Reports page provides deeper, more detailed analytics.
- Exchange rates are already stored historically in the `exchange_rates` table, allowing retrospective currency conversion.
- Transaction data includes category associations for the majority of transactions, enabling meaningful category-based breakdowns.
- The user's base currency is EGP as established in the user profile.
- The existing transaction filtering infrastructure (date range, category, account) from Phase 4 can be extended for report data retrieval.
