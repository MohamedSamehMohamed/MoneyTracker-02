# Quickstart: Exchange Rates & Currency Conversion

**Feature**: 006-currency-conversion

## Prerequisites

- Node.js 18+
- PostgreSQL running with existing MoneyTracker schema
- Server and client dev environments set up

## New Environment Variables

Add to `server/.env`:
```
# Exchange Rate API (optional — uses free open endpoint if not set)
EXCHANGE_RATE_API_KEY=your_key_here
EXCHANGE_RATE_BASE_URL=https://open.er-api.com/v6

# Gold price derivation uses forex rates + gold oz price
GOLD_PRICE_API_KEY=your_key_here

# Fetch interval in milliseconds (default: 6 hours)
RATE_FETCH_INTERVAL=21600000
```

## Development Steps

### 1. Backend — Exchange Rate Service
New files:
- `server/src/services/exchange-rate.service.ts` — core conversion logic, rate fetching, override management
- `server/src/controllers/exchange-rate.controller.ts` — endpoint handlers
- `server/src/routes/exchange-rate.routes.ts` — route definitions
- `server/src/routes/exchange-rate.schemas.ts` — Zod validation schemas

### 2. Backend — Scheduled Fetching
- Rate fetch on server startup + setInterval for periodic refresh
- Added in `server/src/index.ts` or separate `server/src/services/rate-scheduler.ts`

### 3. Frontend — Exchange Rates View
New files:
- `client/src/pages/ExchangeRatesPage.tsx` — rates view page
- `client/src/components/exchange-rates/RateList.tsx` — display current rates
- `client/src/components/exchange-rates/RateOverrideModal.tsx` — manual override form
- `client/src/types/exchange-rate.ts` — TypeScript types
- `client/src/services/api.ts` — add `exchangeRatesApi` section

### 4. Frontend — Dashboard Net Worth
- Update `client/src/pages/DashboardPage.tsx` — add net worth widget
- New `client/src/components/dashboard/NetWorthCard.tsx`

### 5. Frontend — Transaction Conversion Display
- Update `client/src/components/transactions/TransactionItem.tsx` — show converted amounts

### 6. Frontend — Settings Base Currency
- Update `client/src/pages/SettingsPage.tsx` — add base currency selector

## Testing

```bash
# Backend
cd server && npm run lint

# Client
cd client && npm run lint
```

## Key Patterns

- **Conversion is always computed on-the-fly** — no stored converted balances
- **Gold accounts use XAU currency code** — converted to EGP via gold spot price, then to base currency
- **Manual overrides** stored as ExchangeRate rows with `source='manual'`, prioritized for current conversions only
- **Historical conversions** always use automatic rates closest to transaction date
- **Cross-rates** derived from USD-base rates: `rate(A→B) = rate(USD→B) / rate(USD→A)`
