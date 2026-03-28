# Fixes Needed: 006-Currency-Conversion

Review of all implemented tasks against spec and tasks.md requirements.

---

## CRITICAL (Blocks core functionality)

### FIX-001: `formatAmount()` called with wrong parameter types in TransactionItem
**File**: `client/src/components/transactions/TransactionItem.tsx:73,79`
**Problem**: `formatAmount(amountInCents, decimals)` expects a number for `decimals`, but the component passes currency strings:
```typescript
formatAmount(transaction.amount, transaction.account.currency)  // passes string like "USD" as decimals
formatAmount(transaction.convertedAmount, 'converted')          // passes string 'converted' as decimals
```
The function in `client/src/utils/formatters.ts:57` divides by 100 (assumes cents) and calls `.toFixed(decimals)` — passing a string causes `NaN` or wrong output.
**Fix**: Use `formatCurrency()` from `client/src/utils/currency.ts` instead, or fix the call to pass numeric decimals and display currency separately.

### FIX-002: `getNetWorth()` tracks `lastRateUpdate` backwards
**File**: `server/src/controllers/exchange-rate.controller.ts:312,358`
**Problem**: `lastRateUpdate` is initialized to `new Date()` (current time), then only updated when `rateRecord.fetchedAt < lastRateUpdate`. This finds the OLDEST rate, not the most recent.
**Fix**: Initialize to `new Date(0)` and compare with `>` to track the most recent rate:
```typescript
let lastRateUpdate = new Date(0);
// ...
if (rateRecord && rateRecord.fetchedAt > lastRateUpdate) {
  lastRateUpdate = rateRecord.fetchedAt;
}
```

### FIX-003: "Show in base currency" toggle not wired to API
**File**: `client/src/components/transactions/TransactionList.tsx:26-33`, `client/src/pages/TransactionsPage.tsx:94-101`
**Problem**: The toggle sets `showConverted` state and calls `onConvertToBaseToggle`, but TransactionsPage stores `convertToBase` in filters via spread. The `TransactionFilters` type doesn't have a `convertToBase` field and the API call in TransactionsPage doesn't pass it as a query parameter to the backend.
**Fix**:
1. Add `convertToBase?: boolean` to the `TransactionFilters` type
2. Pass `convertToBase` as a query param when calling `transactionsApi.list()`
3. Ensure the backend `GET /api/transactions` reads this param and calls the conversion logic

---

## HIGH (Incorrect data / wrong results)

### FIX-004: `convertAmount()` always returns `isApproximate: false` for latest rates
**File**: `server/src/services/exchange-rate.service.ts:371`
**Problem**: When no `date` param is provided, `isApproximate` is hardcoded to `false`. It should be `true` when the rate is derived via cross-rate or when the latest rate is stale.
**Fix**: `getLatestRate()` should return metadata (whether the rate is direct or derived). Use that to set `isApproximate`.

### FIX-005: `getNetWorth()` never sets `isApproximate: true`
**File**: `server/src/controllers/exchange-rate.controller.ts:319,369`
**Problem**: `isApproximate` is initialized to `false` and never changed. When conversion fails (no rate), the balance is used as-is with `rate=1` and `isApproximate` stays `false`.
**Fix**: Set `isApproximate = true` when:
- No rate is available (conversion failed silently)
- Rate is derived via cross-rate
- Rate used for gold is multi-step (XAU→EGP→base)

### FIX-006: Transaction `isApproximate` compares full timestamps instead of dates
**File**: `server/src/services/transaction.service.ts:106`
**Problem**: `result.rateDate?.getTime() !== transaction.date.getTime()` compares exact millisecond timestamps. A rate fetched on the same calendar day but at a different hour would be marked approximate.
**Fix**: Compare date portions only:
```typescript
isApproximate: !result.rateDate ||
  result.rateDate.toDateString() !== new Date(transaction.date).toDateString()
```

### FIX-007: Converted amount in TransactionItem doesn't show base currency symbol
**File**: `client/src/components/transactions/TransactionItem.tsx:77-85`
**Problem**: The converted amount line shows the numeric value but no currency code/symbol. Users can't tell what currency the converted amount is in.
**Fix**: Display the user's base currency code next to the converted amount.

### FIX-008: NetWorthCard uses wrong symbol for EGP
**File**: `client/src/components/dashboard/NetWorthCard.tsx:51`
**Problem**: EGP maps to `'£'` which is the GBP symbol. EGP should use `'E£'` or `'ج.م'`.
**Fix**: Change the symbols map: `EGP: 'E£'` (also note GBP and EGP both map to `'£'` creating ambiguity).

### FIX-009: NetWorthCard duplicates currency formatting instead of using shared utility
**File**: `client/src/components/dashboard/NetWorthCard.tsx:46-61`
**Problem**: Local `formatCurrency` function duplicates logic from `client/src/utils/currency.ts` with fewer currency symbols and the EGP bug above.
**Fix**: Import and use `formatCurrency` from `client/src/utils/currency.ts` instead of the local version.

---

## MEDIUM (Robustness / edge cases)

### FIX-010: `currencyCodeSchema` too permissive
**File**: `server/src/routes/exchange-rate.schemas.ts:3`
**Problem**: `z.string().min(3).max(10).toUpperCase()` allows non-alphabetic characters, strings up to 10 chars, and `.toUpperCase()` is a transform not a validator.
**Fix**:
```typescript
const currencyCodeSchema = z.string().min(3).max(4).regex(/^[A-Za-z]{3,4}$/).transform(s => s.toUpperCase());
```

### FIX-011: RateOverrideModal has same permissive currency validation
**File**: `client/src/components/exchange-rates/RateOverrideModal.tsx:7-8`
**Problem**: Same issue as FIX-010 — `z.string().min(3).max(10).toUpperCase()`. Additionally, `.toUpperCase()` on Zod string may not work as expected without `.transform()`.
**Fix**: Use `.transform(val => val.toUpperCase())` and add regex validation.

### FIX-012: `convertQuerySchema` date validation too strict
**File**: `server/src/routes/exchange-rate.schemas.ts:24`
**Problem**: `z.string().datetime()` requires full ISO 8601 with timezone (e.g., `2026-01-15T00:00:00Z`). Simple date strings like `"2026-01-15"` are rejected even though `new Date("2026-01-15")` works fine.
**Fix**: Use a custom refine:
```typescript
date: z.string().refine(val => !isNaN(new Date(val).getTime()), "Invalid date").optional(),
```

### FIX-013: `fetchRatesFromProvider()` doesn't validate API response structure
**File**: `server/src/services/exchange-rate.service.ts:33`
**Problem**: `data` is type-asserted as `ExternalRateResponse` without runtime validation. If `data.rates` is undefined/null, `Object.entries(data.rates)` throws.
**Fix**: Add runtime check:
```typescript
if (!data.rates || typeof data.rates !== 'object') {
  throw new Error('Invalid API response: missing rates object');
}
```

### FIX-014: `triggerFetch()` uses unnecessary dynamic import for `fetchGoldPrice`
**File**: `server/src/controllers/exchange-rate.controller.ts:164-165`
**Problem**: `fetchGoldPrice` is already importable from `exchange-rate.service.ts` at the top of the file. The dynamic import is unnecessary overhead.
**Fix**: Import `fetchGoldPrice` statically at the top of the file alongside `fetchRatesFromProvider`.

### FIX-015: Cross-rate derivation doesn't try bidirectional lookups
**File**: `server/src/services/exchange-rate.service.ts:214-236`
**Problem**: Step 4 (cross-rate via USD) only looks for `from→USD` and `USD→to` directly. If the DB only stores `USD→from` (which is the typical storage format from the API), step 4 fails because it can't find `from→USD`.
**Fix**: In the cross-rate step, also try inverting: look for `USD→from` (invert to get `from→USD`), and `to→USD` (invert to get `USD→to`).

### FIX-016: Pagination slice off by one
**File**: `client/src/components/transactions/TransactionList.tsx:100-104`
**Problem**: The array `[1, 2, ..., totalPages]` is sliced with `Math.max(0, page - 3)` as start index. Since array values are 1-based but indices are 0-based, page 1 would slice from index `max(0, -2)=0` showing correctly, but page 5 would slice from index 2, showing pages `[3,4,5,6,7]` — always skipping the first 2 pages.
**Fix**: Adjust to `Math.max(0, pagination.page - 1 - 2)` to properly center the window.

### FIX-017: `getNetWorth()` silently uses unconverted balance when rate unavailable
**File**: `server/src/controllers/exchange-rate.controller.ts:338-345`
**Problem**: When `getLatestRate()` returns null, `convertedBalance` stays equal to `balance` and `rate` stays `1`. This silently adds an unconverted foreign-currency amount to the total, producing an incorrect net worth without any indication.
**Fix**: When rate is unavailable, set `isApproximate = true` and either exclude from total or clearly mark the account as "rate unavailable" in the breakdown.

---

## LOW (Code quality / UX polish)

### FIX-018: NetWorthCard `lastRateUpdate` shows only time, not date
**File**: `client/src/components/dashboard/NetWorthCard.tsx:117`
**Problem**: Uses `toLocaleTimeString()` which shows only time. If rates haven't been updated today, users won't see how old they are.
**Fix**: Use `toLocaleString()` or show both date and time.

### FIX-019: SettingsPage has limited currency selection
**File**: `client/src/pages/SettingsPage.tsx`
**Problem**: Only 7 currencies listed (EGP, USD, EUR, GBP, SAR, AED, KWD). Missing common currencies like JPY, CHF, CAD, AUD, NZD.
**Fix**: Add more currency options or allow text input with validation.

### FIX-020: RateList hardcodes 6 decimal places for all rates
**File**: `client/src/components/exchange-rates/RateList.tsx:97`
**Problem**: `parseFloat(rate.rate).toFixed(6)` for all rates. Major pairs like USD/EUR need fewer, while gold may need different precision.
**Fix**: Use adaptive precision based on rate magnitude.

### FIX-021: Rate input in RateOverrideModal can't handle very small decimals
**File**: `client/src/components/exchange-rates/RateOverrideModal.tsx:131-145`
**Problem**: `step="0.01"` limits input to 2 decimal places. Precious metal or exotic rates may need higher precision.
**Fix**: Use `step="any"` to allow arbitrary precision.

### FIX-022: Decimal precision loss in cross-rate calculations
**File**: `server/src/services/exchange-rate.service.ts:234`
**Problem**: `fromToUsd.rate.toNumber() * usdToTo.rate.toNumber()` converts Prisma Decimals to JS numbers before multiplication, losing precision.
**Fix**: Use Prisma Decimal's `.mul()` method: `fromToUsd.rate.mul(usdToTo.rate).toNumber()`.

### FIX-023: Hard-coded string replace for gold currency display
**File**: `client/src/components/transactions/TransactionItem.tsx:74`
**Problem**: `transaction.account.currency.replace('GOLD_GRAM', 'g')` is fragile. Gold accounts use "XAU" per spec, not "GOLD_GRAM".
**Fix**: Use the `getCurrencySymbol()` utility from `currency.ts`.

### FIX-024: No "Rate unavailable" handling in frontend components (T033)
**Files**: `NetWorthCard.tsx`, `RateList.tsx`, `TransactionItem.tsx`
**Problem**: No graceful handling when a rate pair isn't available. Components could show NaN, blank values, or crash.
**Fix**: Add checks for null/undefined rates and display "Rate unavailable" with the unconverted amount.

### FIX-025: `currency.ts` has no per-currency decimal configuration
**File**: `client/src/utils/currency.ts`
**Problem**: All currencies formatted with 2 decimal places. JPY typically uses 0 decimals, XAU needs more precision.
**Fix**: Add a decimals config per currency code.

---

## Summary

| Priority | Count | Issues |
|----------|-------|--------|
| CRITICAL | 3 | FIX-001, FIX-002, FIX-003 |
| HIGH | 6 | FIX-004 through FIX-009 |
| MEDIUM | 8 | FIX-010 through FIX-017 |
| LOW | 8 | FIX-018 through FIX-025 |
| **Total** | **25** | |

## Recommended Fix Order

1. **FIX-001** — Broken amount display (visible to every user on every transaction)
2. **FIX-002** — Wrong lastRateUpdate on dashboard
3. **FIX-003** — Toggle feature non-functional
4. **FIX-005, FIX-017** — isApproximate + silent conversion failures in net worth
5. **FIX-007, FIX-008, FIX-009** — Currency display issues
6. **FIX-010, FIX-011, FIX-012** — Validation fixes
7. **FIX-015** — Cross-rate derivation improvement
8. **FIX-006, FIX-013, FIX-014** — Backend correctness
9. **FIX-004** — isApproximate for latest rates
10. Everything else (FIX-016 through FIX-025)
