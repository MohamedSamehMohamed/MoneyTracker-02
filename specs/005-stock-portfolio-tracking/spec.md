# Feature Specification: Stock Portfolio Tracking

**Feature Branch**: `005-stock-portfolio-tracking`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "I want to implement a new type of account or transaction related to stocks - bought x stocks for company y with a price z in some date"

## Clarifications

### Session 2026-03-20

- Q: How is company identity determined for grouping into holdings? → A: Single free-text field; exact string match determines grouping. "AAPL" and "Apple Inc" would be treated as separate holdings. Users are responsible for consistency.
- Q: Can a user record transactions for the same company in different currencies? → A: No. All transactions for the same company must use the same currency. The system rejects a transaction if its currency differs from existing holdings for that company.
- Q: Which fields can be edited on a stock transaction after creation? → A: Shares, price per share, note, and date are editable. Company and type (buy/sell) are locked after creation. This mirrors the existing transaction editing pattern from Phase 4.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a Stock Purchase (Priority: P1)

A logged-in user wants to record that they bought stocks. They specify the company/ticker (e.g., "AAPL" or "Apple"), the number of shares purchased, the price per share, and the date of purchase. The system records this as a stock holding and tracks it over time. The user can see all their stock purchases in one place.

**Why this priority**: Recording stock purchases is the core action of this feature. Without it, there is no portfolio to track.

**Independent Test**: Can be fully tested by creating a stock purchase entry and verifying it appears in the user's stock holdings list with correct details.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they record a stock purchase of 10 shares of "AAPL" at 150.00 USD per share on 2026-03-15, **Then** the holding is saved and appears in their portfolio showing company "AAPL", 10 shares, 150.00 USD cost per share, and total cost of 1,500.00 USD.
2. **Given** an authenticated user, **When** they submit a stock purchase with a missing required field (company, shares, or price), **Then** the system shows a validation error and does not create the holding.
3. **Given** an authenticated user, **When** they record a stock purchase with a fractional number of shares (e.g., 0.5 shares), **Then** the system accepts it (fractional shares are supported).
4. **Given** an authenticated user, **When** they record a stock purchase with a future date, **Then** the system rejects it with a validation error.

---

### User Story 2 - View Stock Portfolio (Priority: P1)

A logged-in user wants to see an overview of all their stock holdings grouped by company. For each company, they can see the total number of shares held, the average cost per share, and the total amount invested. The portfolio view gives them a clear picture of their stock investments.

**Why this priority**: Viewing the portfolio is the primary reason users track stocks. It provides immediate value by showing a consolidated view of all investments.

**Independent Test**: Can be fully tested by adding multiple stock purchases for different companies and verifying the portfolio view shows correct aggregated data.

**Acceptance Scenarios**:

1. **Given** an authenticated user who bought 10 shares of "AAPL" at 150.00 and 5 shares of "AAPL" at 160.00, **When** they view their portfolio, **Then** they see "AAPL" with 15 total shares and an average cost of 153.33 per share.
2. **Given** an authenticated user with holdings in "AAPL", "GOOGL", and "MSFT", **When** they view their portfolio, **Then** all three companies are listed with their respective totals.
3. **Given** an authenticated user with no stock holdings, **When** they view the portfolio, **Then** they see an empty state prompting them to record their first stock purchase.

---

### User Story 3 - Record a Stock Sale (Priority: P2)

A logged-in user wants to record that they sold some or all of their shares in a company. They specify the company, number of shares sold, the selling price per share, and the date. The system adjusts their holdings accordingly and calculates the realized profit or loss on the sale.

**Why this priority**: Selling stocks is the natural complement to buying. Users need to track sales to understand their actual gains or losses. Depends on purchases being in place first.

**Independent Test**: Can be fully tested by selling shares from an existing holding and verifying the holding quantity decreases and the realized gain/loss is displayed.

**Acceptance Scenarios**:

1. **Given** an authenticated user holding 15 shares of "AAPL" (average cost 153.33), **When** they sell 5 shares at 180.00 per share, **Then** their holding updates to 10 shares of "AAPL" and the system shows a realized gain of 133.35 (5 x (180.00 - 153.33)).
2. **Given** an authenticated user holding 10 shares of "AAPL", **When** they try to sell 15 shares, **Then** the system rejects it with an error indicating insufficient shares.
3. **Given** an authenticated user holding 10 shares of "AAPL", **When** they sell all 10 shares, **Then** the "AAPL" holding is reduced to 0 shares (or removed from the active portfolio view).

---

### User Story 4 - View Stock Transaction History (Priority: P2)

A logged-in user wants to see a chronological list of all their stock buy and sell transactions. They can filter by company and date range. Each entry shows the transaction type (buy/sell), company, number of shares, price per share, total value, and date.

**Why this priority**: Transaction history provides an audit trail of all stock activity. It depends on buy and sell functionality being in place.

**Independent Test**: Can be fully tested by creating several buy and sell transactions and verifying they appear in the history with correct details and filtering works.

**Acceptance Scenarios**:

1. **Given** an authenticated user with multiple stock transactions, **When** they view the stock transaction history, **Then** transactions are listed in reverse chronological order.
2. **Given** an authenticated user viewing stock history, **When** they filter by company "AAPL", **Then** only AAPL transactions are shown.
3. **Given** an authenticated user viewing stock history, **When** they filter by date range, **Then** only transactions within that range are shown.

---

### User Story 5 - Link Stock Transactions to a Funding Account (Priority: P3)

A logged-in user wants to link their stock purchases and sales to one of their existing financial accounts (e.g., "NBE Bank"). When they buy stocks, the purchase amount is deducted from the linked account. When they sell stocks, the sale proceeds are added to the linked account. This keeps their overall financial picture consistent.

**Why this priority**: Linking to accounts is important for financial accuracy but adds complexity. The core stock tracking works without it, so it can be added after the basic buy/sell flow is solid.

**Independent Test**: Can be fully tested by buying stocks linked to a bank account and verifying the bank account balance decreases by the total purchase amount.

**Acceptance Scenarios**:

1. **Given** an authenticated user with "NBE Bank" (balance 10,000.00 EGP) who buys 10 shares at 500.00 EGP linked to "NBE Bank", **When** the purchase is saved, **Then** the "NBE Bank" balance decreases by 5,000.00 EGP.
2. **Given** an authenticated user selling 5 shares at 600.00 EGP linked to "NBE Bank", **When** the sale is saved, **Then** the "NBE Bank" balance increases by 3,000.00 EGP.
3. **Given** an authenticated user recording a stock purchase, **When** they choose not to link an account, **Then** the purchase is recorded without affecting any account balance.

---

### Edge Cases

- What happens when a user records multiple purchases of the same stock at different prices? The system aggregates them, calculating the weighted average cost per share.
- What happens when a user sells more shares than they own? The system rejects it with a validation error (short selling is not supported).
- What happens when a user enters a stock ticker/company name that doesn't match a known company? The system accepts any user-provided company name or ticker -- no external validation is performed. Users are responsible for entering correct information.
- How does the system handle stock splits or dividends? These are out of scope for this phase. Users can manually adjust by recording additional purchases at the adjusted price.
- What happens when the user's base currency differs from the stock's trading currency? The stock purchase is recorded in the currency specified by the user. No automatic currency conversion is performed (consistent with the existing approach for cross-currency transactions).
- What happens when a user tries to record a transaction for an existing stock in a different currency? The system rejects it with a validation error. All transactions for the same company must use the same currency to ensure correct average cost aggregation.
- What happens if a user deletes a stock purchase that was linked to a funding account? The account balance is restored (reversed), and the stock holding is adjusted accordingly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to record a stock purchase with: company name/ticker, number of shares (supports fractional), price per share, date, and optional note.
- **FR-002**: System MUST allow authenticated users to record a stock sale with: company name/ticker, number of shares, selling price per share, date, and optional note.
- **FR-003**: System MUST prevent users from selling more shares of a company than they currently hold.
- **FR-004**: System MUST display a portfolio view showing all holdings grouped by company, with total shares, average cost per share, and total invested amount for each.
- **FR-005**: System MUST display a stock transaction history in reverse chronological order with pagination.
- **FR-006**: System MUST support filtering stock transactions by company and date range.
- **FR-007**: System MUST calculate the weighted average cost per share when a user has multiple purchases of the same stock.
- **FR-008**: System MUST calculate and display the realized gain or loss when shares are sold (based on average cost method).
- **FR-009**: System MUST validate all stock transaction input (company is required, shares must be positive, price must be positive, date must be today or in the past, currency must match existing holdings for that company).
- **FR-010**: System MUST ensure users can only view, edit, and delete their own stock holdings and transactions (ownership enforcement).
- **FR-017**: System MUST allow users to edit a stock transaction's shares, price per share, note, and date, recalculating the holding's average cost and total shares to reflect the change. Company and type (buy/sell) are locked after creation.
- **FR-011**: System MUST optionally allow users to link a stock purchase or sale to an existing financial account, adjusting that account's balance accordingly (deducting on buy, adding on sell).
- **FR-012**: System MUST allow linking stock transactions to an account to be optional -- users can track stocks without impacting any account balance.
- **FR-013**: System MUST show an empty state when a user has no stock holdings, with guidance to record their first purchase.
- **FR-014**: System MUST allow users to delete a stock transaction, reversing its effect on holdings and any linked account balance.
- **FR-015**: System MUST show a confirmation dialog before deleting a stock transaction.
- **FR-016**: System MUST display the currency used for each stock transaction.

### Key Entities

- **Stock Holding**: Represents a user's aggregated position in a specific company. Key attributes: company name/ticker (single free-text field; exact string match determines identity), total shares held, average cost per share, total invested amount, currency. A holding is derived from the sum of all buy and sell transactions for that company where the company field matches exactly.
- **Stock Transaction**: Represents a single stock buy or sell event. Key attributes: type (buy or sell), company name/ticker, number of shares, price per share, total value (shares x price), date, optional note, optional link to a financial account, currency. Each stock transaction belongs to exactly one user.
- **Account** (existing): Optionally linked as the funding source for stock purchases or the recipient of sale proceeds. Balance is updated atomically when linked.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can record a stock purchase or sale in under 30 seconds.
- **SC-002**: The portfolio view loads and displays all holdings within 2 seconds, even with 100+ distinct stocks.
- **SC-003**: 100% of stock sale operations enforce the "cannot sell more than owned" rule -- no negative holdings are ever created.
- **SC-004**: 100% of stock operations enforce ownership -- no user can access another user's stock data.
- **SC-005**: Average cost per share and realized gain/loss calculations are accurate to two decimal places.
- **SC-006**: When a stock transaction is linked to a financial account, the account balance is always consistent with the transaction (no balance drift).
- **SC-007**: Users see clear, actionable feedback for every validation error (missing company, negative shares, overselling, future date).
- **SC-008**: Stock transaction history with filters and pagination returns accurate results within 1 second.

## Assumptions

- Stock tracking is separate from the existing transaction system (income/expense/transfer). Stock buy/sell transactions are a new entity, not an extension of the existing TransactionType enum.
- No real-time stock price data or market integration is included in this phase. The system only tracks what the user manually enters.
- Fractional shares are supported (users may buy 0.5 shares through modern brokerages).
- The average cost method (weighted average) is used for calculating cost basis and gains/losses. FIFO or LIFO methods are out of scope.
- Stock splits, dividends, and corporate actions are out of scope. Users can manually adjust holdings if needed.
- No automatic currency conversion is performed for stock transactions -- the user specifies the currency.
- Short selling (selling shares not owned) is not supported.
- The existing Account model and balance management system (from Phase 3-4) is available for the optional account linking feature.
