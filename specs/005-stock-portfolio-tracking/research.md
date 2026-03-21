# Research: Stock Portfolio Tracking

**Feature**: 005-stock-portfolio-tracking
**Date**: 2026-03-20

## R1: Storing Fractional Shares and Prices in Prisma/PostgreSQL

**Decision**: Use `Decimal` type via Prisma's `@db.Decimal(18, 8)` for shares and `@db.Decimal(18, 2)` for prices.

**Rationale**: The existing codebase uses `BigInt` for monetary amounts stored as smallest currency unit (piasters/cents). However, stock shares require fractional values (e.g., 0.5 shares) and prices are naturally decimal. Using `Decimal` with 8 decimal places for shares supports fractional share precision from modern brokerages. Prices use 2 decimal places matching standard financial pricing. Prisma maps PostgreSQL `DECIMAL`/`NUMERIC` to JavaScript `Decimal` (from the `decimal.js` library) which avoids floating-point precision issues.

**Alternatives considered**:
- `Float`: Rejected — floating-point precision errors in financial calculations (e.g., 0.1 + 0.2 !== 0.3).
- `BigInt` (store shares as millishares): Rejected — adds complexity with scaling factors, unfamiliar pattern for stock quantities.
- `String`: Rejected — cannot do database-level arithmetic or comparisons.

## R2: Average Cost Calculation Strategy

**Decision**: Calculate average cost on-the-fly by querying all buy transactions for a company, rather than storing a denormalized `averageCost` field.

**Rationale**: With <1000 expected stock transactions per user, computing the weighted average from individual transactions is fast and avoids consistency issues when transactions are edited or deleted. The formula: `averageCost = SUM(shares * price) / SUM(shares)` across all buy transactions (excluding sells). This ensures edits and deletes always produce correct results without needing to recalculate a stored value.

**Alternatives considered**:
- Denormalized `StockHolding` table with running totals: Rejected — creates consistency risk when transactions are edited/deleted. Would need triggers or complex update logic.
- FIFO/LIFO lot tracking: Out of scope per spec. Average cost method is sufficient.

## R3: Sell Validation — Preventing Overselling

**Decision**: Before creating a sell transaction, query the net shares held for that company (SUM of buy shares minus SUM of sell shares) and reject if the sell quantity exceeds the net position.

**Rationale**: This is the simplest correct approach. The check runs inside a database transaction to prevent race conditions. The same check must run when editing a sell transaction's share count upward.

**Alternatives considered**:
- Denormalized holdings table with trigger-based updates: Rejected — over-engineering for a personal finance app with no concurrent access concerns.
- Application-level locking: Rejected — database transactions are sufficient for single-user.

## R4: Realized Gain/Loss Calculation

**Decision**: Calculate realized gain/loss at the time of sale using the average cost method: `gain = shares_sold * (sell_price - average_cost_at_time_of_sale)`. Return this value in the sell transaction response.

**Rationale**: The average cost is recomputed from buy transactions at the time of sale. This value is stored on the sell transaction record (`realizedGain` field) so it can be displayed in history without recalculation. If a buy transaction is later edited, the stored `realizedGain` on existing sells is NOT retroactively updated (this is acceptable for a personal tracker; recalculation would be a future enhancement).

**Alternatives considered**:
- Recalculate all gains retroactively on any edit: Rejected — complex cascade logic for minimal benefit in personal finance context.
- Don't store gain, always compute: Rejected — computing gain for history listing requires fetching all prior buys for each sell, which is expensive for listing pages.

## R5: Account Linking Implementation

**Decision**: Add an optional `accountId` foreign key on `StockTransaction`. When present, create a corresponding balance adjustment on the linked account within the same database transaction (decrement on buy, increment on sell).

**Rationale**: This mirrors the existing transaction system's atomic balance updates. Using a nullable FK keeps account linking optional. The balance adjustment amount is `shares * pricePerShare` converted to the smallest currency unit (piasters/cents) of the linked account.

**Alternatives considered**:
- Create a regular Transaction record alongside the StockTransaction: Rejected — couples two independent systems and complicates delete/edit flows.
- Separate "funding" entity: Rejected — over-engineering for an optional feature.

## R6: Stock Transaction as Separate Entity vs. Extending Existing Transactions

**Decision**: Create a new `StockTransaction` model, completely separate from the existing `Transaction` model.

**Rationale**: Per the spec assumption, stock transactions have fundamentally different fields (company, shares, pricePerShare, realizedGain) that don't map to the existing Transaction schema. The existing Transaction model is tightly coupled to income/expense/transfer logic with BigInt amounts. Mixing stock logic into it would complicate both systems. A separate model keeps concerns isolated and follows the existing pattern of one model per domain concept.

**Alternatives considered**:
- Extend TransactionType enum with `stock_buy`/`stock_sell`: Rejected — would require nullable stock-specific fields on the Transaction model, complicating all existing transaction queries.
- Polymorphic transaction with discriminator: Rejected — Prisma doesn't natively support table-per-type inheritance.

## R7: Currency Handling for Stock-Account Linking

**Decision**: When linking a stock transaction to an account, the stock transaction's currency must match the linked account's currency. The balance adjustment amount is `shares * pricePerShare` stored as the smallest currency unit (multiply by 100 for 2-decimal currencies, 1000 for 3-decimal like gold grams).

**Rationale**: This avoids currency conversion complexity. The existing account system stores balances in the smallest unit (BigInt piasters/cents). Stock prices are stored as Decimal, so conversion requires: `balanceAdjustment = Math.round(shares * pricePerShare * currencyMultiplier)` where currencyMultiplier is 100 for most currencies.

**Alternatives considered**:
- Allow cross-currency linking with ExchangeRate conversion: Rejected — adds complexity and the ExchangeRate model may not have rates for stock currencies.
- Store linked amount separately: Rejected — redundant, can be derived from shares * price.
