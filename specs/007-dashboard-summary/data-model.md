# Data Model: Dashboard & Summary

**Feature**: 007-dashboard-summary | **Date**: 2026-04-03

## Overview

No new database tables or schema changes are required. The dashboard feature aggregates data from existing models (Transaction, Account, ExchangeRate, Category). All new data structures are **computed aggregations** returned by API endpoints.

## Existing Models Used

### Transaction (existing, no changes)
- `id`: UUID, primary key
- `userId`: UUID, foreign key → User
- `accountId`: UUID, foreign key → Account
- `type`: Enum (`income` | `expense` | `transfer`)
- `amount`: BigInt (smallest currency unit: piasters, cents, milligrams)
- `categoryId`: UUID, nullable, foreign key → Category
- `note`: String, nullable
- `date`: Date (YYYY-MM-DD, no time component)
- `transferToId`: UUID, nullable, foreign key → Account
- `createdAt`: DateTime
- `updatedAt`: DateTime

**Relationships**: belongs to User, Account, Category (optional), transferAccount (optional)

### Account (existing, no changes)
- `id`: UUID, primary key
- `userId`: UUID, foreign key → User
- `name`: String (max 100)
- `type`: Enum (`cash` | `bank` | `wallet` | `gold`)
- `currency`: String (max 10, e.g., "EGP", "USD", "GOLD_GRAM")
- `balance`: BigInt (smallest unit, default 0)
- `icon`: String, nullable (max 50)

### ExchangeRate (existing, no changes)
- `id`: UUID, primary key
- `fromCurrency`: String (max 10)
- `toCurrency`: String (max 10)
- `rate`: Decimal(18, 6)
- `fetchedAt`: DateTime
- `source`: String (max 50, values: "auto", "manual")

**Unique constraint**: `(fromCurrency, toCurrency, fetchedAt)` — enables historical rate lookup

### Category (existing, no changes)
- `id`: UUID, primary key
- `userId`: UUID, nullable (null = system default)
- `name`: String (max 50)
- `type`: Enum (`income` | `expense`)
- `icon`: String (max 50)
- `color`: String (max 7, hex color)

## Computed Aggregation Structures

These are not persisted — they are computed at query time and returned by API endpoints.

### MonthlyTotal
Aggregation of income and expense totals for a single calendar month.

| Field          | Type    | Description                                           |
| -------------- | ------- | ----------------------------------------------------- |
| month          | String  | "YYYY-MM" format (e.g., "2026-03")                   |
| totalIncome    | String  | Sum of income transactions converted to base currency |
| totalExpense   | String  | Sum of expense transactions converted to base currency|
| netFlow        | String  | totalIncome - totalExpense                            |

**Computation rules**:
- Filter: `type IN ('income', 'expense')` — transfers excluded
- Group by: calendar month of `transaction.date`
- Currency conversion: Use `getHistoricalRate()` with last day of each month as reference date
- Amount divisor: 100 for regular currencies, 1000 for GOLD_GRAM

### CategoryTotal
Aggregation of expense amounts for a single category within a time period.

| Field      | Type    | Description                                              |
| ---------- | ------- | -------------------------------------------------------- |
| categoryId | String  | UUID of the category                                     |
| name       | String  | Category display name                                    |
| color      | String  | Hex color code from Category model                       |
| icon       | String  | Icon identifier from Category model                      |
| total      | String  | Sum of expenses in this category, converted to base      |
| percentage | Number  | Percentage of total spending (0-100)                     |

**Computation rules**:
- Filter: `type = 'expense'` only — income and transfers excluded
- Group by: `categoryId`
- Currency conversion: Use `getHistoricalRate()` with end-of-month for each transaction's month
- Percentage: `(categoryTotal / sumOfAllCategories) * 100`
- Uncategorized transactions (null categoryId): grouped as "Uncategorized"

## Query Patterns

### Monthly Summary Query
```
SELECT transactions WHERE:
  userId = :userId
  AND type IN ('income', 'expense')
  AND date >= :startDate
  AND date <= :endDate
ORDER BY date ASC
```
Then group in application code by `YYYY-MM` of date, converting each transaction's amount using `getHistoricalRate(account.currency, user.baseCurrency, endOfMonth)`.

### Category Breakdown Query
```
SELECT transactions WHERE:
  userId = :userId
  AND type = 'expense'
  AND date >= :startDate
  AND date <= :endDate
INCLUDE: account, category
```
Then group by categoryId, convert amounts, and calculate percentages.

### Recent Transactions Query
```
SELECT transactions WHERE:
  userId = :userId
ORDER BY date DESC, createdAt DESC
LIMIT 10
INCLUDE: account, category, transferAccount
```
Uses existing `listTransactions` service with `limit=10, page=1`.

## Validation Rules

- `months` parameter: integer 1-24, default 6
- `dateFrom` / `dateTo`: YYYY-MM-DD format, dateTo >= dateFrom
- Preset periods computed client-side: "current month", "last 3 months", "last 6 months", "last 12 months"
- All monetary amounts returned as strings to preserve precision (BigInt serialization pattern)

## State Transitions

No state transitions — all dashboard data is read-only aggregation of existing transaction data.
