# Phase 1 Implementation Review

**Reviewed**: 2026-03-28
**Files**: `client/src/types/exchange-rate.ts`, `server/src/routes/exchange-rate.schemas.ts`, `client/src/services/api.ts`
**Compared against**: `specs/006-currency-conversion/contracts/exchange-rate-endpoints.md`, `specs/006-currency-conversion/data-model.md`, `server/prisma/schema.prisma`

---

## Issues Found

### Issue 1: `ConvertResponse` fields don't match API contract (T001)

**File**: `client/src/types/exchange-rate.ts` lines 12-20
**Severity**: Breaking — will cause undefined values on the client

The contract (`GET /api/exchange-rates/convert`) returns:
```json
{ "from", "to", "originalAmount", "convertedAmount", "rate", "rateDate", "isApproximate" }
```

The implementation defines:
```json
{ "fromCurrency", "toCurrency", "originalAmount", "convertedAmount", "rate", "timestamp", "isApproximate" }
```

**Fix**: Rename fields to match the contract:
- `fromCurrency` → `from`
- `toCurrency` → `to`
- `timestamp` → `rateDate`

---

### Issue 2: `NetWorthBreakdown.name` should be `accountName` (T001)

**File**: `client/src/types/exchange-rate.ts` line 24
**Severity**: Breaking — will cause undefined on client

The contract (`GET /api/exchange-rates/net-worth`) returns `"accountName"` per breakdown item.

**Fix**: Rename `name` → `accountName` in the `NetWorthBreakdown` interface.

---

### Issue 3: `NetWorthResponse.lastUpdated` should be `lastRateUpdate` (T001)

**File**: `client/src/types/exchange-rate.ts` line 36
**Severity**: Breaking — will cause undefined on client

The contract returns `"lastRateUpdate"`, not `"lastUpdated"`.

**Fix**: Rename `lastUpdated` → `lastRateUpdate` in `NetWorthResponse`.

---

### Issue 4: `ExchangeRate` type has fields not in the DB model (T001)

**File**: `client/src/types/exchange-rate.ts` lines 1-10
**Severity**: Minor — phantom fields that will always be undefined

The Prisma `ExchangeRate` model has: `id`, `fromCurrency`, `toCurrency`, `rate`, `fetchedAt`, `source`. There is **no** `createdAt` or `updatedAt` column.

The list endpoint contract also omits `id`, `createdAt`, `updatedAt` from its response shape.

**Fix**: Remove `createdAt` and `updatedAt` from the `ExchangeRate` interface. Decide whether to keep `id` (it exists in DB but is not in the list contract response — keep it only if other endpoints will return it).

---

### Issue 5: `list()` return type missing `baseCurrency` and `lastUpdated` (T003)

**File**: `client/src/services/api.ts` line 201
**Severity**: Breaking — important response fields are inaccessible

Contract for `GET /api/exchange-rates` returns:
```json
{ "rates": [...], "baseCurrency": "EGP", "lastUpdated": "2026-03-27T12:00:00Z" }
```

Implementation types it as `{ rates: ExchangeRate[] }` — missing `baseCurrency` and `lastUpdated`.

**Fix**: Change return type to `{ rates: ExchangeRate[]; baseCurrency: string; lastUpdated: string }`. Consider adding a `ListRatesResponse` type to `exchange-rate.ts`.

---

### Issue 6: `fetch()` return type fields don't match contract (T003)

**File**: `client/src/services/api.ts` line 216
**Severity**: Breaking — client will read wrong field names

Contract for `POST /api/exchange-rates/fetch` returns:
```json
{ "message": "Rates updated successfully", "ratesUpdated": 32, "fetchedAt": "..." }
```

Implementation types it as `{ count: number; fetchedAt: string }` — `count` should be `ratesUpdated` and `message` is missing.

**Fix**: Change return type to `{ message: string; ratesUpdated: number; fetchedAt: string }`. Consider adding a `FetchRatesResponse` type.

---

### Issue 7: `setOverride()` return type has incorrect wrapper (T003)

**File**: `client/src/services/api.ts` line 221
**Severity**: Breaking — client will look for `result.rate.fromCurrency` instead of `result.fromCurrency`

Contract for `PUT /api/exchange-rates/override` returns a flat object:
```json
{ "fromCurrency": "USD", "toCurrency": "EGP", "rate": "49.500000", "source": "manual", "fetchedAt": "..." }
```

Implementation types it as `{ rate: ExchangeRate }` — an unnecessary wrapper.

**Fix**: Change return type to `ExchangeRate` (or a narrower type matching the contract shape).

---

### Issue 8: `removeOverride()` sends query params but contract specifies request body (T003)

**File**: `client/src/services/api.ts` lines 226-228
**Severity**: Breaking — server will not receive the currency pair data

Contract for `DELETE /api/exchange-rates/override` specifies a **request body**:
```json
{ "fromCurrency": "USD", "toCurrency": "EGP" }
```

Implementation sends query params: `/exchange-rates/override?fromCurrency=USD&toCurrency=EGP`

**Fix**: Send a JSON body instead of query params:
```ts
removeOverride: (fromCurrency: string, toCurrency: string) =>
  apiFetch<void>("/exchange-rates/override", {
    method: "DELETE",
    body: JSON.stringify({ fromCurrency, toCurrency }),
  }),
```

---

### Issue 9: Currency code validation too strict — rejects codes outside exactly 3 chars (T002)

**File**: `server/src/routes/exchange-rate.schemas.ts` — all schemas
**Severity**: Low — all current currencies (USD, EGP, EUR, XAU, GBP, SAR) are 3 chars

The data model specifies `fromCurrency: String(10)` and validation rules say "3-10 chars". The Zod schemas use `.length(3)` which enforces exactly 3.

This works for current use cases but is more restrictive than the data model allows. Note: the existing `account.schemas.ts` also uses a fixed enum, so this is consistent with the codebase pattern.

**Fix (optional)**: Change `.length(3)` to `.min(3).max(10)` to match the data model, or leave as-is if the project will only ever use ISO 4217 codes.

---

### Issue 10: Unused import `RateOverride` in api.ts (T003)

**File**: `client/src/services/api.ts` line 4
**Severity**: Lint warning — no functional impact

`RateOverride` is imported but never used in any API call signature or return type.

**Fix**: Remove `RateOverride` from the import, or use it in `setOverride()` parameter type instead of the inline object type.

---

## Summary

| # | File | Severity | Category |
|---|------|----------|----------|
| 1 | exchange-rate.ts | Breaking | Field name mismatch (ConvertResponse) |
| 2 | exchange-rate.ts | Breaking | Field name mismatch (NetWorthBreakdown.name) |
| 3 | exchange-rate.ts | Breaking | Field name mismatch (NetWorthResponse.lastUpdated) |
| 4 | exchange-rate.ts | Minor | Phantom fields (createdAt, updatedAt) |
| 5 | api.ts | Breaking | Missing fields in list() return type |
| 6 | api.ts | Breaking | Wrong field names in fetch() return type |
| 7 | api.ts | Breaking | Incorrect wrapper in setOverride() return type |
| 8 | api.ts | Breaking | DELETE sends query params instead of body |
| 9 | exchange-rate.schemas.ts | Low | Currency validation stricter than data model |
| 10 | api.ts | Lint | Unused import |

**7 breaking issues** that will cause runtime mismatches between client and server if not fixed before Phase 2 implementation.
