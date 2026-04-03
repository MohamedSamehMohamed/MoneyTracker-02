# API Contract: Dashboard Endpoints

**Feature**: 007-dashboard-summary | **Date**: 2026-04-03

All endpoints require authentication (JWT Bearer token). All monetary amounts are returned as strings.

---

## GET /api/dashboard/spending-chart

Returns monthly income and expense totals for the dashboard bar chart and line chart.

### Query Parameters

| Parameter | Type    | Required | Default | Description                            |
| --------- | ------- | -------- | ------- | -------------------------------------- |
| months    | integer | No       | 6       | Number of past months to include (1-24)|

### Response 200

```json
{
  "baseCurrency": "EGP",
  "months": [
    {
      "month": "2026-03",
      "totalIncome": "15000.00",
      "totalExpense": "8500.00",
      "netFlow": "6500.00"
    },
    {
      "month": "2026-02",
      "totalIncome": "14000.00",
      "totalExpense": "9200.00",
      "netFlow": "4800.00"
    }
  ]
}
```

### Response 401

```json
{
  "error": "Unauthorized"
}
```

### Notes
- Months are ordered chronologically (oldest first)
- Transfer transactions are excluded
- Amounts converted to user's base currency using end-of-month historical exchange rates
- Months with no transactions are included with zero values
- Current (partial) month is included

---

## GET /api/dashboard/category-summary

Returns spending breakdown by category for the donut chart.

### Query Parameters

| Parameter | Type   | Required | Default              | Description                              |
| --------- | ------ | -------- | -------------------- | ---------------------------------------- |
| dateFrom  | string | No       | First day of current month | Start date (YYYY-MM-DD)            |
| dateTo    | string | No       | Today                | End date (YYYY-MM-DD)                    |

### Response 200

```json
{
  "baseCurrency": "EGP",
  "dateFrom": "2026-03-01",
  "dateTo": "2026-03-31",
  "totalSpending": "8500.00",
  "categories": [
    {
      "categoryId": "uuid-1",
      "name": "Food",
      "color": "#ef4444",
      "icon": "utensils",
      "total": "3200.00",
      "percentage": 37.65
    },
    {
      "categoryId": "uuid-2",
      "name": "Transport",
      "color": "#3b82f6",
      "icon": "car",
      "total": "1500.00",
      "percentage": 17.65
    },
    {
      "categoryId": null,
      "name": "Uncategorized",
      "color": "#9ca3af",
      "icon": "circle",
      "total": "800.00",
      "percentage": 9.41
    }
  ]
}
```

### Response 400

```json
{
  "error": "Validation error",
  "details": [
    { "path": "dateFrom", "message": "Invalid date format" }
  ]
}
```

### Notes
- Only expense transactions are included (income and transfers excluded)
- Categories sorted by total descending (highest spending first)
- Uncategorized transactions (null categoryId) grouped as "Uncategorized" with gray color
- Percentages sum to 100 (rounded)
- Amounts converted using historical rates for each transaction's month

---

## GET /api/dashboard/income-vs-expense

Returns income and expense totals by time period for the trend line chart.

### Query Parameters

| Parameter | Type    | Required | Default | Description                            |
| --------- | ------- | -------- | ------- | -------------------------------------- |
| months    | integer | No       | 6       | Number of past months to include (1-24)|

### Response 200

```json
{
  "baseCurrency": "EGP",
  "data": [
    {
      "month": "2025-10",
      "income": "12000.00",
      "expense": "9800.00"
    },
    {
      "month": "2025-11",
      "income": "13500.00",
      "expense": "8900.00"
    }
  ]
}
```

### Notes
- Identical data shape to spending-chart but named differently for semantic clarity
- Server implementation may reuse the same aggregation logic internally
- Data ordered chronologically (oldest first)
- Transfer transactions excluded
- Historical exchange rates used for conversion

---

## Existing Endpoints Used by Dashboard

### GET /api/exchange-rates/net-worth (existing, no changes)

Returns total net worth and account breakdown. Used by NetWorthCard.

### GET /api/transactions (existing, no changes)

Used with `?limit=10&page=1` for the recent transactions component. Already supports all needed fields including account and category includes.

### GET /api/exchange-rates (existing, no changes)

Used to get the `fetchedAt` timestamp for the exchange rate freshness indicator.

### POST /api/transactions (existing, no changes)

Used by the quick-add transaction modal. Reuses existing transaction creation flow.
