# Research: Dashboard & Summary

**Feature**: 007-dashboard-summary | **Date**: 2026-04-03

## R1: Charting Library Selection

**Decision**: Recharts

**Rationale**: Already specified in the project plan (plan.md Phase 6.5). Recharts is the most popular React charting library, built on D3 with declarative React components. It supports bar charts, pie/donut charts, and line charts — all three chart types needed. It has first-class React 19 support, TypeScript types, and responsive containers.

**Alternatives considered**:
- **Chart.js + react-chartjs-2**: Good performance but less React-idiomatic; requires imperative config objects
- **Nivo**: Beautiful defaults but larger bundle size; overkill for 3 chart types
- **Victory**: Good API but slower development pace and smaller community

## R2: Historical Rate Aggregation Strategy

**Decision**: Query historical rates from ExchangeRate table using end-of-month timestamps, with fallback to closest available rate

**Rationale**: The ExchangeRate model stores rates with `fetchedAt` timestamps and the existing `getHistoricalRate()` service function already handles finding the closest rate <= a given date. For monthly aggregation, we query using the last day of each month as the reference date. The `@@unique([fromCurrency, toCurrency, fetchedAt])` constraint means multiple historical snapshots exist. Since rates are fetched every 4 hours, there will be many data points per month — we use the one closest to month-end.

**Alternatives considered**:
- **Snapshot table**: Store a separate monthly rate snapshot — adds schema complexity with no real benefit since historical rates already exist
- **Current rates only**: Simpler but contradicts the clarified requirement for historical accuracy

## R3: Server-Side Aggregation Approach

**Decision**: Perform aggregation in application code using Prisma queries with date-range filtering, then convert amounts using historical rates per-month

**Rationale**: Prisma doesn't support complex GROUP BY with conditional SUM well (especially with BigInt amounts needing currency conversion at different rates per account). The approach is:
1. Query transactions for the date range, filtered by type (excluding transfers), grouped by month
2. For each month, look up the historical exchange rate for each account's currency
3. Convert and sum in application code

This matches the existing pattern in `getNetWorth()` which also does conversion in application code.

**Alternatives considered**:
- **Raw SQL with GROUP BY**: Better performance for large datasets but breaks Prisma abstraction and makes cross-database testing harder
- **Materialized views**: Over-engineered for a single-user app with ~1,000 transactions

## R4: Dashboard Data Fetching Strategy

**Decision**: Multiple independent API calls from the client, each component fetches its own data

**Rationale**: Each chart has different data requirements and refresh frequencies. Independent fetching allows:
- Parallel loading (faster perceived performance)
- Individual loading states per component
- Independent error handling (one failing chart doesn't block the dashboard)
- Simpler server endpoints (single responsibility)

This matches the existing pattern where `NetWorthCard` fetches independently via `exchangeRatesApi.netWorth()`.

**Alternatives considered**:
- **Single aggregated endpoint**: One `/api/dashboard` call returning everything — couples all data, slower initial response, harder to cache
- **GraphQL**: Over-engineered for this use case; would require adding an entirely new server layer

## R5: Category Breakdown Time Period Selector

**Decision**: Client-side period selector with presets (current month, last 3/6/12 months) plus custom date range picker. Server endpoint accepts `dateFrom` and `dateTo` query parameters.

**Rationale**: Presets are computed client-side as date ranges, then passed to a single flexible server endpoint. The custom date range picker reuses existing date filtering patterns from the transactions list. This keeps the server endpoint generic and avoids encoding preset logic server-side.

**Alternatives considered**:
- **Server-side presets via enum**: Less flexible; forces server changes for new presets
- **Client-only filtering**: Would require fetching all transactions client-side; doesn't scale

## R6: Transfer Exclusion Implementation

**Decision**: Filter by transaction type in the WHERE clause at query time (`type IN ('income', 'expense')`)

**Rationale**: The Transaction model has a `type` enum with values `income`, `expense`, `transfer`. Excluding transfers is a simple WHERE clause filter. This is the most performant and cleanest approach — no post-query filtering needed.

**Alternatives considered**:
- **Post-query filter**: Wastes database bandwidth fetching then discarding transfers
- **Separate transaction tables**: Over-engineered; would require schema migration
