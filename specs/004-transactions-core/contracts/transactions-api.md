# API Contract: Transactions

**Base path**: `/api/transactions`
**Authentication**: All endpoints require Bearer token (authMiddleware)

---

## GET /api/transactions

List transactions for the authenticated user with optional filters and pagination.

**Query Parameters**:

| Parameter  | Type   | Required | Default | Description                              |
|------------|--------|----------|---------|------------------------------------------|
| page       | number | no       | 1       | Page number (1-based)                    |
| limit      | number | no       | 20      | Items per page (max 100)                 |
| accountId  | string | no       |         | Filter by account UUID                   |
| categoryId | string | no       |         | Filter by category UUID                  |
| type       | string | no       |         | Filter by type: income, expense, transfer|
| dateFrom   | string | no       |         | Filter from date (YYYY-MM-DD, inclusive) |
| dateTo     | string | no       |         | Filter to date (YYYY-MM-DD, inclusive)   |

**Response 200**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "userId": "uuid",
      "accountId": "uuid",
      "type": "expense",
      "amount": "15000",
      "categoryId": "uuid",
      "note": "Lunch at restaurant",
      "date": "2026-03-20",
      "transferToId": null,
      "createdAt": "2026-03-20T12:00:00.000Z",
      "updatedAt": "2026-03-20T12:00:00.000Z",
      "account": {
        "id": "uuid",
        "name": "Cash EGP",
        "type": "cash",
        "currency": "EGP"
      },
      "category": {
        "id": "uuid",
        "name": "Food",
        "icon": "🍔",
        "color": "#FF6B6B"
      },
      "transferAccount": null
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

**Notes**:
- Amount is returned as string (BigInt serialization)
- Transactions sorted by date descending, then createdAt descending
- Includes related account, category, and transferAccount for display
- Transfer transactions include `transferAccount` with destination account info

---

## GET /api/transactions/:id

Get a single transaction by ID.

**Response 200**:
```json
{
  "transaction": {
    "id": "uuid",
    "userId": "uuid",
    "accountId": "uuid",
    "type": "income",
    "amount": "500000",
    "categoryId": "uuid",
    "note": "Monthly salary",
    "date": "2026-03-01",
    "transferToId": null,
    "createdAt": "2026-03-01T09:00:00.000Z",
    "updatedAt": "2026-03-01T09:00:00.000Z",
    "account": { "id": "uuid", "name": "NBE Bank", "type": "bank", "currency": "EGP" },
    "category": { "id": "uuid", "name": "Salary", "icon": "💼", "color": "#52C41A" },
    "transferAccount": null
  }
}
```

**Response 404**: Transaction not found or not owned by user
```json
{
  "error": "Transaction not found"
}
```

---

## POST /api/transactions

Create a new transaction and update account balance(s) atomically.

**Request body (income/expense)**:
```json
{
  "accountId": "uuid",
  "type": "expense",
  "amount": 15000,
  "categoryId": "uuid",
  "note": "Lunch at restaurant",
  "date": "2026-03-20"
}
```

**Request body (transfer)**:
```json
{
  "accountId": "uuid",
  "type": "transfer",
  "amount": 200000,
  "transferToId": "uuid",
  "note": "ATM withdrawal",
  "date": "2026-03-20"
}
```

| Field        | Type   | Required               | Validation                                       |
|--------------|--------|------------------------|--------------------------------------------------|
| accountId    | string | yes                    | Must exist and belong to user                    |
| type         | string | yes                    | One of: income, expense, transfer                |
| amount       | number | yes                    | Positive integer (> 0)                           |
| categoryId   | string | no                     | Must exist if provided                           |
| note         | string | no                     | Max 500 characters                               |
| date         | string | yes                    | YYYY-MM-DD format, must be today or in the past  |
| transferToId | string | yes (if type=transfer) | Must exist, belong to user, != accountId         |

**Response 201**:
```json
{
  "transaction": {
    "id": "uuid",
    "userId": "uuid",
    "accountId": "uuid",
    "type": "expense",
    "amount": "15000",
    "categoryId": "uuid",
    "note": "Lunch at restaurant",
    "date": "2026-03-20",
    "transferToId": null,
    "createdAt": "2026-03-20T12:00:00.000Z",
    "updatedAt": "2026-03-20T12:00:00.000Z",
    "account": { "id": "uuid", "name": "Cash EGP", "type": "cash", "currency": "EGP" },
    "category": { "id": "uuid", "name": "Food", "icon": "🍔", "color": "#FF6B6B" },
    "transferAccount": null
  }
}
```

**Response 400**: Validation error
```json
{
  "error": "Validation failed",
  "details": [{ "field": "amount", "message": "Amount must be a positive number" }]
}
```

**Response 400**: Self-transfer
```json
{
  "error": "Cannot transfer to the same account"
}
```

---

## PATCH /api/transactions/:id

Update a transaction's amount, category, note, or date. Type and account are immutable.

**Request body** (partial):
```json
{
  "amount": 20000,
  "categoryId": "uuid",
  "note": "Updated note",
  "date": "2026-03-19"
}
```

| Field      | Type   | Required | Validation                                       |
|------------|--------|----------|--------------------------------------------------|
| amount     | number | no       | Positive integer (> 0) if provided               |
| categoryId | string | no       | Must exist if provided, or null to clear          |
| note       | string | no       | Max 500 characters, or null to clear              |
| date       | string | no       | YYYY-MM-DD, must be today or past if provided     |

**Response 200**:
```json
{
  "transaction": { ... }
}
```

**Response 404**: Transaction not found or not owned by user
```json
{
  "error": "Transaction not found"
}
```

**Notes**: If amount changes, account balance(s) are recalculated atomically (reverse old effect, apply new).

---

## DELETE /api/transactions/:id

Delete a transaction and reverse its effect on account balance(s).

**Request**: No body required.

**Response 204**: No content (successful deletion)

**Response 404**: Transaction not found or not owned by user
```json
{
  "error": "Transaction not found"
}
```

**Notes**: For transfer transactions, both source and destination account balances are reversed.

---

## GET /api/categories

List categories available to the authenticated user (system defaults + user custom).

**Query Parameters**:

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| type      | string | no       | Filter by type: income, expense          |

**Response 200**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Food",
      "type": "expense",
      "icon": "🍔",
      "color": "#FF6B6B",
      "userId": null
    }
  ]
}
```

**Notes**: Returns categories where `userId` is null (system defaults) OR matches the authenticated user.
