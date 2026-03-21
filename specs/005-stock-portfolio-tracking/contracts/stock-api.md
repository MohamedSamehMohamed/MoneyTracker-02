# API Contract: Stock Portfolio Tracking

**Feature**: 005-stock-portfolio-tracking
**Base Path**: `/api/stocks`
**Auth**: All endpoints require `Authorization: Bearer <token>` header

## Endpoints

### POST /api/stocks — Create Stock Transaction

**Request Body**:
```json
{
  "type": "buy",                    // required: "buy" | "sell"
  "company": "AAPL",               // required: string, 1-100 chars
  "shares": 10.5,                  // required: number, > 0
  "pricePerShare": 150.00,         // required: number, > 0
  "currency": "USD",               // required: string, 1-10 chars
  "date": "2026-03-15",            // required: YYYY-MM-DD, <= today
  "note": "Bought on dip",         // optional: string, max 500 chars
  "accountId": "uuid-here"         // optional: UUID of linked account
}
```

**Response 201**:
```json
{
  "stockTransaction": {
    "id": "uuid",
    "userId": "uuid",
    "type": "buy",
    "company": "AAPL",
    "shares": "10.5",
    "pricePerShare": "150.00",
    "currency": "USD",
    "date": "2026-03-15",
    "note": "Bought on dip",
    "realizedGain": null,
    "accountId": "uuid-here",
    "account": { "id": "uuid", "name": "NBE Bank", "type": "bank", "currency": "USD" },
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

**Errors**:
- `400`: Validation error (missing fields, negative values, future date, currency mismatch with existing holdings, currency mismatch with linked account, sell exceeds held shares)
- `401`: Not authenticated
- `404`: Linked account not found or not owned by user

---

### GET /api/stocks — List Stock Transactions

**Query Parameters**:
| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| company | string | — | Filter by company (exact match) |
| type | string | — | Filter by "buy" or "sell" |
| dateFrom | string | — | YYYY-MM-DD inclusive |
| dateTo | string | — | YYYY-MM-DD inclusive |

**Response 200**:
```json
{
  "stockTransactions": [
    {
      "id": "uuid",
      "type": "buy",
      "company": "AAPL",
      "shares": "10.5",
      "pricePerShare": "150.00",
      "currency": "USD",
      "date": "2026-03-15",
      "note": "Bought on dip",
      "realizedGain": null,
      "accountId": "uuid",
      "account": { "id": "uuid", "name": "NBE Bank", "type": "bank", "currency": "USD" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### GET /api/stocks/:id — Get Single Stock Transaction

**Response 200**:
```json
{
  "stockTransaction": { /* same shape as in list */ }
}
```

**Errors**:
- `401`: Not authenticated
- `404`: Not found or not owned by user

---

### PATCH /api/stocks/:id — Update Stock Transaction

Only `shares`, `pricePerShare`, `note`, and `date` are editable. `type` and `company` are locked.

**Request Body** (all fields optional):
```json
{
  "shares": 15.0,
  "pricePerShare": 155.00,
  "note": "Updated note",
  "date": "2026-03-16"
}
```

**Response 200**:
```json
{
  "stockTransaction": { /* updated transaction */ }
}
```

**Errors**:
- `400`: Validation error (negative values, future date, edit would cause oversell for existing sells)
- `401`: Not authenticated
- `404`: Not found or not owned by user

---

### DELETE /api/stocks/:id — Delete Stock Transaction

**Response 204**: No content

**Side effects**:
- If the deleted transaction was a buy, existing sell validations are NOT retroactively checked (portfolio may show zero or this is the user's responsibility)
- If a linked account exists, the balance adjustment is reversed

**Errors**:
- `401`: Not authenticated
- `404`: Not found or not owned by user

---

### GET /api/stocks/portfolio — Get Portfolio Summary

Returns aggregated holdings grouped by company.

**Response 200**:
```json
{
  "holdings": [
    {
      "company": "AAPL",
      "currency": "USD",
      "totalShares": "15.5",
      "averageCostPerShare": "153.33",
      "totalInvested": "2376.62",
      "totalRealizedGain": "133.35"
    },
    {
      "company": "GOOGL",
      "currency": "USD",
      "totalShares": "5.0",
      "averageCostPerShare": "2800.00",
      "totalInvested": "14000.00",
      "totalRealizedGain": "0.00"
    }
  ]
}
```

**Notes**:
- Only companies with `totalShares > 0` are included (fully sold positions are excluded)
- All numeric values are returned as strings for precision
- `totalRealizedGain` is the sum of `realizedGain` from all sell transactions for that company

**Errors**:
- `401`: Not authenticated

---

## Serialization Notes

- `Decimal` fields (`shares`, `pricePerShare`, `realizedGain`) are serialized as strings in JSON responses to preserve precision (matching how `BigInt` amounts are serialized as strings in the existing transaction API).
- `date` is serialized as `YYYY-MM-DD` string.
- `account` relation is included as a nested object (same select pattern as existing transactions) or `null` if not linked.
