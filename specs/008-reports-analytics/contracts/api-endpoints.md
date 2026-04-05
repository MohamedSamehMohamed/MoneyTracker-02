# API Contracts: Reports & Analytics

**Feature**: 008-reports-analytics  
**Date**: 2026-04-05

## Existing Endpoints (Reused)

### GET /api/dashboard/spending-chart
Already exists. Used for monthly comparison (with `months=2`) and spending trends.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| months | number (1-24) | 6 | Number of months to include |

**Response** (200):
```json
{
  "baseCurrency": "EGP",
  "months": [
    {
      "month": "2026-03",
      "totalIncome": 15000.00,
      "totalExpense": 8500.00,
      "netFlow": 6500.00
    }
  ]
}
```

### GET /api/dashboard/category-summary
Already exists. Extended with `type` parameter for income breakdown support.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| dateFrom | string (YYYY-MM-DD) | Current month start | Start date |
| dateTo | string (YYYY-MM-DD) | Now | End date |
| type | string (income\|expense) | expense | **NEW** — Transaction type to aggregate |

**Response** (200):
```json
{
  "baseCurrency": "EGP",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-03-31",
  "totalSpending": 25000.00,
  "categories": [
    {
      "categoryId": "uuid",
      "name": "Food",
      "color": "#ef4444",
      "icon": "utensils",
      "total": 8000.00,
      "percentage": 32.0
    }
  ]
}
```

### GET /api/transactions
Already exists. Used for the filtered transaction list underlying the CSV export UI.

---

## New Endpoints

### GET /api/dashboard/net-worth-history

Returns historical net worth data points for plotting the net worth trend line.

**Auth**: Required (JWT Bearer)

**Query Parameters**:
| Param | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| dateFrom | string (YYYY-MM-DD) | 6 months ago | Regex: `^\d{4}-\d{2}-\d{2}$` | Start of period |
| dateTo | string (YYYY-MM-DD) | Today | Regex: `^\d{4}-\d{2}-\d{2}$` | End of period |
| granularity | string (daily\|weekly\|monthly) | auto | Enum | Data point frequency. "auto" = daily (<1mo), weekly (1-3mo), monthly (>3mo) |

**Response** (200):
```json
{
  "baseCurrency": "EGP",
  "dateFrom": "2025-10-01",
  "dateTo": "2026-04-05",
  "granularity": "monthly",
  "dataPoints": [
    {
      "date": "2025-10-31",
      "netWorth": 45230.50
    },
    {
      "date": "2025-11-30",
      "netWorth": 48100.00
    }
  ]
}
```

**Error Responses**:
- 400: Invalid date format or dateFrom > dateTo
- 401: Not authenticated

**Implementation Notes**:
- Reconstruct account balances at each data point by replaying transactions backward from current balances
- Convert each account's balance using `getHistoricalRate(currency, baseCurrency, dataPointDate)`
- Cache rate lookups in a Map per request (same pattern as `getMonthlyTotals`)
- For "auto" granularity: daily if range < 31 days, weekly if range < 93 days, monthly otherwise

---

### GET /api/transactions/export

Exports filtered transactions as a CSV file download.

**Auth**: Required (JWT Bearer)

**Query Parameters**:
| Param | Type | Default | Validation | Description |
|-------|------|---------|------------|-------------|
| dateFrom | string (YYYY-MM-DD) | None (required) | Regex: `^\d{4}-\d{2}-\d{2}$` | Start date |
| dateTo | string (YYYY-MM-DD) | None (required) | Regex: `^\d{4}-\d{2}-\d{2}$` | End date |
| accountId | string (UUID) | All accounts | UUID format | Filter by account |
| categoryId | string (UUID) | All categories | UUID format | Filter by category |
| type | string (income\|expense\|transfer) | All types | Enum | Filter by transaction type |

**Response** (200):
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="transactions_2026-01-01_2026-03-31.csv"`
- Max rows: 10,000

**CSV Columns**:
```
Date,Type,Category,Account,Note,Amount,Currency,Converted Amount,Base Currency
2026-03-15,expense,Food,Cash EGP,Lunch,150.00,EGP,150.00,EGP
2026-03-14,income,Salary,NBE Bank,March salary,15000.00,EGP,15000.00,EGP
2026-03-10,expense,Shopping,Cash USD,Amazon,25.00,USD,1225.00,EGP
```

**Error Responses**:
- 400: Missing required dates, invalid format, or dateFrom > dateTo
- 401: Not authenticated
- 404: No transactions match filters (returns JSON error, not empty CSV)

**Implementation Notes**:
- Stream CSV rows to avoid loading all data in memory
- Use `getHistoricalRate()` for currency conversion per transaction
- Amount values in human-readable format (divided by divisor)
- Sorted by date descending, then createdAt descending
