# API Contract: Accounts

**Base path**: `/api/accounts`
**Authentication**: All endpoints require Bearer token (authMiddleware)

---

## GET /api/accounts

List all accounts for the authenticated user.

**Request**: No body required.

**Response 200**:
```json
{
  "accounts": [
    {
      "id": "uuid",
      "name": "Cash EGP",
      "type": "cash",
      "currency": "EGP",
      "balance": "0",
      "icon": "cash",
      "createdAt": "2026-03-20T00:00:00.000Z",
      "updatedAt": "2026-03-20T00:00:00.000Z"
    }
  ]
}
```

**Notes**: Balance is returned as a string (BigInt serialization). Accounts are filtered by `userId` from the auth token.

---

## POST /api/accounts

Create a new account.

**Request body**:
```json
{
  "name": "Cash EGP",
  "type": "cash",
  "currency": "EGP",
  "icon": "cash"
}
```

| Field    | Type   | Required | Validation                          |
|----------|--------|----------|-------------------------------------|
| name     | string | yes      | 1-100 characters                    |
| type     | string | yes      | One of: cash, bank, wallet, gold    |
| currency | string | yes      | Non-empty string                    |
| icon     | string | no       | Max 50 characters                   |

**Response 201**:
```json
{
  "account": {
    "id": "uuid",
    "name": "Cash EGP",
    "type": "cash",
    "currency": "EGP",
    "balance": "0",
    "icon": "cash",
    "createdAt": "2026-03-20T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z"
  }
}
```

**Response 400**: Validation error
```json
{
  "error": "Validation failed",
  "details": [{ "field": "name", "message": "Required" }]
}
```

---

## PATCH /api/accounts/:id

Update an account's name and/or icon.

**Request body** (partial):
```json
{
  "name": "NBE Savings",
  "icon": "bank"
}
```

| Field | Type   | Required | Validation       |
|-------|--------|----------|------------------|
| name  | string | no       | 1-100 characters |
| icon  | string | no       | Max 50 characters|

**Response 200**:
```json
{
  "account": { ... }
}
```

**Response 404**: Account not found or not owned by user
```json
{
  "error": "Account not found"
}
```

---

## DELETE /api/accounts/:id

Delete an account (only if balance is zero).

**Request**: No body required.

**Response 204**: No content (successful deletion)

**Response 400**: Non-zero balance
```json
{
  "error": "Cannot delete account with non-zero balance"
}
```

**Response 404**: Account not found or not owned by user
```json
{
  "error": "Account not found"
}
```
