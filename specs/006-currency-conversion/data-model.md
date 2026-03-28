# Data Model: Exchange Rates & Currency Conversion

**Feature**: 006-currency-conversion | **Date**: 2026-03-27

## Existing Entities (Modified)

### User (existing — no schema changes)
- `baseCurrency: String` (already exists, default "EGP") — used as the target currency for all conversions

### Account (existing — no schema changes)
- `currency: String` (already exists) — determines which exchange rate pair to use for conversion
- `type: AccountType` (already exists) — `gold` type triggers gold-to-EGP conversion path

### ExchangeRate (existing — no schema changes)
- `id: UUID` (PK)
- `fromCurrency: String(10)` — source currency code (e.g., "USD") or "XAU" for gold
- `toCurrency: String(10)` — target currency code (e.g., "EGP")
- `rate: Decimal(18,6)` — conversion rate (1 unit of fromCurrency = rate units of toCurrency)
- `fetchedAt: DateTime` — when the rate was fetched/set
- `source: String(50)` — "auto" for API-fetched, "manual" for user overrides
- **Unique constraint**: `[fromCurrency, toCurrency, fetchedAt]`

## New Entities

*None — the existing schema supports all required functionality.*

## Conversion Logic (Reference)

### Standard Currency Conversion
```
convertedAmount = originalAmount × getRate(fromCurrency, toCurrency)
```

Where `getRate(A, B)`:
1. If A == B → return 1
2. Check for manual override: latest ExchangeRate where fromCurrency=A, toCurrency=B, source='manual'
3. If no override, check direct rate: latest ExchangeRate where fromCurrency=A, toCurrency=B, source='auto'
4. If no direct rate, derive cross-rate via USD: `rate(USD→B) / rate(USD→A)`
5. If no rate available → return null (conversion unavailable)

### Gold Account Conversion
```
goldValueEGP = gramsBalance × goldPricePerGramEGP
```

Where `goldPricePerGramEGP`:
1. Fetch rate where fromCurrency='XAU', toCurrency='EGP' (stored as price per gram)
2. Or derive: `(USDperOunce / 31.1035) × rate(USD→EGP)`

Then if user base currency ≠ EGP: `goldValueBase = goldValueEGP × getRate('EGP', baseCurrency)`

### Historical Rate Lookup
For transaction date `D`:
- Find ExchangeRate with `fetchedAt` closest to `D` where source='auto'
- Always use automatic rates for historical (never manual overrides)

## Entity Relationship Summary

```
User (1) ──→ (N) Account
  │                  │
  │ baseCurrency     │ currency, type
  │                  │
  └──── uses ────→ ExchangeRate ←── fetched/set
                   (fromCurrency, toCurrency, rate, source)
```

## Validation Rules

- `rate` must be > 0 (reject zero or negative)
- `fromCurrency` and `toCurrency` must be non-empty, uppercase, 3-10 chars
- `source` must be either "auto" or "manual"
- `fetchedAt` must not be in the future
- Anomaly detection: reject rates that differ from previous rate by more than 50% (configurable threshold)
