# API Contract: Exchange Rate Endpoints

**Base path**: `/api/exchange-rates`
**Auth**: All endpoints require Bearer token (JWT)

---

## GET /api/exchange-rates

Get current exchange rates relevant to the user's accounts.

**Response 200**:
```json
{
  "rates": [
    {
      "fromCurrency": "USD",
      "toCurrency": "EGP",
      "rate": "50.250000",
      "source": "auto",
      "fetchedAt": "2026-03-27T12:00:00Z"
    },
    {
      "fromCurrency": "XAU",
      "toCurrency": "EGP",
      "rate": "4250.00",
      "source": "auto",
      "fetchedAt": "2026-03-27T12:00:00Z"
    }
  ],
  "baseCurrency": "EGP",
  "lastUpdated": "2026-03-27T12:00:00Z"
}
```

---

## GET /api/exchange-rates/convert

Convert an amount between currencies.

**Query params**:
- `from` (string, required): Source currency code
- `to` (string, required): Target currency code
- `amount` (string, required): Amount to convert
- `date` (string, optional): ISO date for historical rate lookup (defaults to current)

**Response 200**:
```json
{
  "from": "USD",
  "to": "EGP",
  "originalAmount": "100.00",
  "convertedAmount": "5025.00",
  "rate": "50.250000",
  "rateDate": "2026-03-27T12:00:00Z",
  "isApproximate": false
}
```

**Response 404** (no rate available):
```json
{
  "error": "No exchange rate available for USD to XYZ"
}
```

---

## POST /api/exchange-rates/fetch

Trigger manual rate refresh (fetches latest rates from external provider).

**Response 200**:
```json
{
  "message": "Rates updated successfully",
  "ratesUpdated": 32,
  "fetchedAt": "2026-03-27T18:00:00Z"
}
```

**Response 503** (provider unavailable):
```json
{
  "error": "Rate provider unavailable. Using cached rates.",
  "lastFetchedAt": "2026-03-27T12:00:00Z"
}
```

---

## PUT /api/exchange-rates/override

Set a manual rate override for a currency pair.

**Request body**:
```json
{
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "rate": "49.500000"
}
```

**Response 200**:
```json
{
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "rate": "49.500000",
  "source": "manual",
  "fetchedAt": "2026-03-27T18:30:00Z"
}
```

**Response 400**:
```json
{
  "error": "Rate must be a positive number"
}
```

---

## DELETE /api/exchange-rates/override

Remove a manual rate override.

**Request body**:
```json
{
  "fromCurrency": "USD",
  "toCurrency": "EGP"
}
```

**Response 204**: No content

---

## GET /api/exchange-rates/net-worth

Get the user's total net worth converted to their base currency.

**Response 200**:
```json
{
  "baseCurrency": "EGP",
  "totalNetWorth": "1250000.00",
  "breakdown": [
    {
      "accountId": "uuid",
      "accountName": "Bank Account",
      "originalCurrency": "EGP",
      "originalBalance": "500000",
      "convertedBalance": "500000.00",
      "rate": "1.000000",
      "isApproximate": false
    },
    {
      "accountId": "uuid",
      "accountName": "USD Savings",
      "originalCurrency": "USD",
      "originalBalance": "10000",
      "convertedBalance": "502500.00",
      "rate": "50.250000",
      "isApproximate": false
    },
    {
      "accountId": "uuid",
      "accountName": "Gold",
      "originalCurrency": "XAU",
      "originalBalance": "50",
      "convertedBalance": "212500.00",
      "rate": "4250.000000",
      "isApproximate": false
    }
  ],
  "lastRateUpdate": "2026-03-27T12:00:00Z"
}
```

---

## PATCH /api/auth/me

Update user profile (existing endpoint — extended for base currency).

**Request body** (new field):
```json
{
  "baseCurrency": "USD"
}
```

**Response 200**: Updated user object with new `baseCurrency`.
