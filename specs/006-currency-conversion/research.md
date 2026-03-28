# Research: Exchange Rates & Currency Conversion

**Feature**: 006-currency-conversion | **Date**: 2026-03-27

## Decision 1: Exchange Rate API Provider

**Decision**: Use ExchangeRate-API (exchangerate-api.com) free tier as primary provider.

**Rationale**: Free tier supports 1,500 requests/month, covers 160+ currencies, returns JSON with simple REST calls. At 4 fetches/day = ~120/month, well within limits. No API key required for open endpoints; optional key for higher limits. Alternative: Open Exchange Rates (similar free tier, USD-base only on free plan — acceptable since we use single-reference-currency strategy).

**Alternatives considered**:
- Fixer.io: Free tier limited to 100 requests/month (insufficient for 4x/day)
- Currency Layer: Free tier is HTTP-only (no HTTPS), security concern
- ECB XML feed: Only covers major currencies, XML parsing overhead, no gold prices

## Decision 2: Gold Spot Price Source

**Decision**: Use a gold price API (e.g., goldapi.io or metals-api.com) to fetch gold price per gram in EGP, or derive from USD gold price + USD/EGP rate.

**Rationale**: Gold is priced globally in USD per troy ounce. We can fetch USD/oz price from a commodity API and convert: `pricePerGramEGP = (USDperOz / 31.1035) × USDtoEGP`. This avoids needing a separate gold-in-EGP provider and reuses our forex rates.

**Alternatives considered**:
- Dedicated Egyptian gold price scraper: Fragile, no official API
- Manual-only gold pricing: Defeats automation goal
- Store gold in USD: User expects EGP pricing for local gold market

## Decision 3: Rate Storage Strategy

**Decision**: Store all fetched rates as `fromCurrency → toCurrency` with the reference currency (USD) as `fromCurrency`. Derive cross-rates at query time using: `A→B = (USD→B) / (USD→A)`.

**Rationale**: The existing `ExchangeRate` model stores `fromCurrency`, `toCurrency`, `rate`, `fetchedAt`, and `source`. Storing ~30 USD-based rates per fetch keeps storage lean. Cross-rate computation is simple division with negligible overhead. Historical rates are preserved since each fetch creates new rows timestamped with `fetchedAt`.

**Alternatives considered**:
- Store all N×N pairs: Massive storage growth, redundant data
- Store only user-relevant pairs: Requires re-fetching when new currencies added

## Decision 4: Rate Override Model

**Decision**: Store manual overrides in the same `ExchangeRate` table with `source = 'manual'`. The conversion service prioritizes manual overrides (most recent where source='manual') over automatic rates for current conversions.

**Rationale**: Reuses existing model without schema changes for overrides. The `source` field already distinguishes automatic vs manual. Query logic: for current rate, check for active manual override first, fall back to latest automatic rate. For historical conversions, always use the automatic rate closest to the transaction date (per clarification).

**Alternatives considered**:
- Separate `RateOverride` table: Additional complexity, schema migration, for minimal benefit
- Flag field on ExchangeRate: The `source` field already serves this purpose

## Decision 5: Scheduled Fetching Mechanism

**Decision**: Use a simple interval-based approach with `setInterval` in the server process, triggering rate fetch every 6 hours. Also provide a manual trigger endpoint for on-demand refresh.

**Rationale**: The app is a personal finance tracker — not a high-availability system needing distributed job scheduling. A server-side interval is simple, reliable, and sufficient. If the server restarts, the first fetch triggers immediately on startup.

**Alternatives considered**:
- node-cron: Extra dependency for a simple interval
- External cron job (OS-level): Harder to deploy and manage
- Database-based job queue: Over-engineered for this use case

## Decision 6: Conversion Computation Approach

**Decision**: All conversions are computed on-the-fly at query time. No pre-computed converted balances are stored.

**Rationale**: Storing converted balances would require updating them every time rates change (4x/day × all accounts). On-the-fly computation is simpler, always uses the latest rate, and avoids stale data. For a personal finance app with modest data volumes, the performance impact is negligible.

**Alternatives considered**:
- Materialized converted balances: Complexity of keeping them in sync outweighs benefit
- Caching layer: Premature optimization for single-user queries
