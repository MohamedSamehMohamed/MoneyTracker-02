# Data Model: Reports & Analytics

**Feature**: 008-reports-analytics  
**Date**: 2026-04-05

## Overview

No new database tables or schema changes are required. All report data is derived from existing models through aggregation queries and calculations. This document describes the derived data structures returned by the API.

## Existing Models (Referenced)

### Transaction
- `id`: UUID
- `userId`: UUID (FK → User)
- `accountId`: UUID (FK → Account)
- `type`: enum (income | expense | transfer)
- `amount`: BigInt (smallest unit: piasters/cents/milligrams)
- `categoryId`: UUID? (FK → Category, nullable)
- `note`: String?
- `date`: Date
- `transferToId`: UUID? (FK → Account, for transfers)

### Account
- `id`: UUID
- `userId`: UUID (FK → User)
- `name`: String
- `type`: enum (cash | bank | wallet | gold)
- `currency`: String (e.g., "EGP", "USD", "GOLD_GRAM")
- `balance`: BigInt (current balance in smallest unit)

### Category
- `id`: UUID
- `userId`: UUID? (null = system default)
- `name`: String
- `type`: enum (income | expense)
- `icon`: String?
- `color`: String? (hex)

### ExchangeRate
- `fromCurrency`: String
- `toCurrency`: String
- `rate`: Decimal(18,6)
- `fetchedAt`: DateTime
- `source`: String
- Unique constraint: [fromCurrency, toCurrency, fetchedAt]

### User
- `id`: UUID
- `baseCurrency`: String (default "EGP")

## Derived Data Structures (API Response Shapes)

### NetWorthDataPoint
Represents the user's total net worth at a specific date, used to plot the net worth trend line.

| Field | Type | Description |
|-------|------|-------------|
| date | string (YYYY-MM-DD) | The date of the snapshot |
| netWorth | number | Total net worth in base currency (human-readable, e.g., 15000.50) |

**Derivation**: For each data point date, reconstruct all account balances by replaying transactions backward from current balance. Convert each account's balance to base currency using `getHistoricalRate(account.currency, user.baseCurrency, date)`. Sum all converted balances.

### CategoryBreakdownItem
Already exists in the dashboard. Extended with `type` filter.

| Field | Type | Description |
|-------|------|-------------|
| categoryId | string | UUID or "uncategorized" |
| name | string | Category display name |
| color | string? | Hex color for chart rendering |
| icon | string? | Icon identifier |
| total | number | Sum of transactions in base currency |
| percentage | number | Percentage of total (0-100) |

### MonthlyComparisonData
Side-by-side comparison of two months.

| Field | Type | Description |
|-------|------|-------------|
| currentMonth | string | Month label (YYYY-MM) |
| previousMonth | string | Month label (YYYY-MM) |
| current | { income: number, expense: number } | Current month totals in base currency |
| previous | { income: number, expense: number } | Previous month totals in base currency |
| incomeChange | { absolute: number, percentage: number } | Delta between months |
| expenseChange | { absolute: number, percentage: number } | Delta between months |

**Derivation**: Computed client-side from the existing `spending-chart` endpoint response with `months=2`.

### TransactionExportRow
One row in the CSV export file.

| Field | Type | Description |
|-------|------|-------------|
| date | string (YYYY-MM-DD) | Transaction date |
| type | string | income / expense / transfer |
| category | string | Category name or "Uncategorized" |
| account | string | Account name |
| note | string | Transaction note or empty |
| amount | number | Original amount in account currency |
| currency | string | Original currency code |
| convertedAmount | number | Amount in base currency |
| baseCurrency | string | User's base currency code |

## Relationships

```
User (1) ──── (N) Account
  │                  │
  │                  │
  (N)               (N)
Transaction ──── Category
  │
  └── Aggregated into:
      ├── NetWorthDataPoint[] (per date)
      ├── CategoryBreakdownItem[] (per category)
      ├── MonthlyComparisonData (current vs previous)
      └── TransactionExportRow[] (CSV rows)
```

## Validation Rules

- Date range: `startDate` must be before or equal to `endDate`
- Date range: `startDate` must not be more than 5 years in the past (practical limit for personal finance)
- CSV export: maximum 10,000 rows per export
- All monetary amounts displayed with 2 decimal places (except gold: 3 decimal places)
- Transfer transactions (type=transfer) are excluded from income/expense aggregations
