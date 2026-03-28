# Tasks: Exchange Rates & Currency Conversion

**Input**: Design documents from `/specs/006-currency-conversion/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No test tasks included (not explicitly requested in the feature specification).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `server/src/`, `client/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New files and dependencies needed before any user story work

- [x] T001 Create TypeScript types for exchange rates in `client/src/types/exchange-rate.ts` — define ExchangeRate, NetWorthResponse, ConvertResponse, RateOverride interfaces
- [x] T002 Create Zod validation schemas for exchange rate endpoints in `server/src/routes/exchange-rate.schemas.ts` — override body, convert query params, currency pair validation
- [x] T003 [P] Add `exchangeRatesApi` section to `client/src/services/api.ts` — list rates, convert, fetch, override (set/delete), net worth endpoints

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core exchange rate service logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement core exchange rate service in `server/src/services/exchange-rate.service.ts` — include: `fetchRatesFromProvider()` (calls external API, returns USD-based rates), `storeRates()` (bulk insert into ExchangeRate table with source='auto', validate >0), `getLatestRate(from, to)` (check manual override first, then latest auto rate, then cross-rate derivation via USD), `getHistoricalRate(from, to, date)` (find auto rate closest to date, never use manual overrides), `convertAmount(amount, from, to, date?)` (use getLatestRate or getHistoricalRate)
- [x] T005 Implement gold price fetching in `server/src/services/exchange-rate.service.ts` — add `fetchGoldPrice()` that fetches USD/oz gold price, converts to EGP per gram using `(USDperOz / 31.1035) × rate(USD→EGP)`, stores as ExchangeRate with fromCurrency='XAU', toCurrency='EGP', source='auto'
- [x] T006 Implement rate scheduler in `server/src/services/rate-scheduler.ts` — `startRateScheduler()`: fetch rates immediately on call, then setInterval at RATE_FETCH_INTERVAL (env var, default 6h). Handle fetch failures gracefully (log error, retain existing rates). Export start/stop functions.
- [x] T007 Create exchange rate controller in `server/src/controllers/exchange-rate.controller.ts` — handlers for: listRates, convert, triggerFetch, setOverride, removeOverride, getNetWorth
- [x] T008 Create exchange rate routes in `server/src/routes/exchange-rate.routes.ts` — wire GET /, GET /convert, POST /fetch, PUT /override, DELETE /override, GET /net-worth with auth middleware and Zod validation
- [x] T009 Register exchange rate routes and start rate scheduler in `server/src/index.ts` — import and mount routes at `/api/exchange-rates`, call `startRateScheduler()` after server starts

**Checkpoint**: Exchange rate fetching, storage, conversion logic, and API endpoints are all functional. Rates auto-fetch on server start.

---

## Phase 3: User Story 1 - View Total Net Worth in Base Currency (Priority: P1) 🎯 MVP

**Goal**: Dashboard displays total net worth aggregated across all accounts, converted to the user's base currency

**Independent Test**: Create accounts in EGP, USD, and gold (XAU). Verify the net worth endpoint returns correct totals using current exchange rates.

### Implementation for User Story 1

- [x] T010 [US1] Implement `getNetWorth` handler logic in `server/src/controllers/exchange-rate.controller.ts` — query all user accounts, for each account: if currency matches baseCurrency use balance directly, if type is gold convert grams→EGP→baseCurrency, otherwise convert via exchange rate. Return breakdown array with accountId, name, originalCurrency, originalBalance, convertedBalance, rate, isApproximate flag. Sum for totalNetWorth.
- [x] T011 [US1] Create NetWorthCard component in `client/src/components/dashboard/NetWorthCard.tsx` — display total net worth in base currency with currency symbol, account breakdown list showing original and converted balances, "last updated" timestamp, loading/error states
- [x] T012 [US1] Update DashboardPage to show net worth in `client/src/pages/DashboardPage.tsx` — import and render NetWorthCard, fetch net worth data from `exchangeRatesApi.netWorth()` on mount, handle loading and error states

**Checkpoint**: Dashboard shows total net worth in base currency with per-account breakdown. Gold accounts convert correctly.

---

## Phase 4: User Story 2 - Automatic Exchange Rate Updates (Priority: P1)

**Goal**: System fetches and stores exchange rates automatically every 6 hours, handles provider failures gracefully

**Independent Test**: Start server, verify rates are fetched immediately. Wait or trigger manual fetch, verify new rates stored. Simulate provider failure, verify cached rates still work.

### Implementation for User Story 2

- [x] T013 [US2] Implement `triggerFetch` handler in `server/src/controllers/exchange-rate.controller.ts` — call fetchRatesFromProvider + fetchGoldPrice, return count of rates updated and fetchedAt timestamp. On provider failure return 503 with lastFetchedAt from most recent stored rate.
- [x] T014 [US2] Add rate validation in `server/src/services/exchange-rate.service.ts` — in `storeRates()`: reject rates ≤ 0, reject rates that differ from previous rate by more than 50% (anomaly detection), log rejected rates with reason
- [x] T015 [US2] Add environment variable documentation and defaults in `server/src/services/rate-scheduler.ts` — read EXCHANGE_RATE_API_KEY, EXCHANGE_RATE_BASE_URL (default: `https://open.er-api.com/v6`), GOLD_PRICE_API_KEY, RATE_FETCH_INTERVAL (default: 21600000ms = 6h) from process.env

**Checkpoint**: Rates auto-refresh on startup and every 6 hours. Invalid rates are rejected. Provider failures don't crash the system.

---

## Phase 5: User Story 3 - View Exchange Rates (Priority: P2)

**Goal**: Users can see current exchange rates for their relevant currency pairs with timestamps

**Independent Test**: Navigate to exchange rates page, verify rates display for all currency pairs in user's accounts with last-updated time.

### Implementation for User Story 3

- [x] T016 [US3] Implement `listRates` handler in `server/src/controllers/exchange-rate.controller.ts` — query user's accounts to find unique currencies, fetch latest rate for each pair relative to user's baseCurrency, include gold rate if user has gold accounts, return rates array with lastUpdated timestamp
- [x] T017 [P] [US3] Create RateList component in `client/src/components/exchange-rates/RateList.tsx` — display table of currency pairs with rate, source (auto/manual badge), and fetchedAt. Show "last updated" header. Handle empty state (no rates yet).
- [x] T018 [P] [US3] Create ExchangeRatesPage in `client/src/pages/ExchangeRatesPage.tsx` — fetch rates from `exchangeRatesApi.list()`, render RateList, add "Refresh Rates" button that calls `exchangeRatesApi.fetch()` then reloads
- [x] T019 [US3] Add ExchangeRatesPage route to `client/src/App.tsx` — add route path (e.g., `/exchange-rates`) and navigation link in sidebar (`client/src/components/layout/Sidebar.tsx`)

**Checkpoint**: Users can view all relevant exchange rates and manually trigger a refresh.

---

## Phase 6: User Story 4 - Convert Transaction Amounts for Reporting (Priority: P2)

**Goal**: Transaction list shows both original and converted amounts in the user's base currency

**Independent Test**: View transactions from a non-base-currency account, verify both original and converted amounts display with correct rates.

### Implementation for User Story 4

- [x] T020 [US4] Add conversion endpoint logic — extend transaction list response in `server/src/services/transaction.service.ts` or create a helper in `server/src/services/exchange-rate.service.ts`: for each transaction, if account currency ≠ baseCurrency, compute convertedAmount using historical rate closest to transaction date. Include convertedAmount, rate used, and isApproximate flag in response.
- [x] T021 [US4] Update transaction list endpoint in `server/src/controllers/transaction.controller.ts` — accept optional `convertToBase=true` query param, when set enrich each transaction with convertedAmount, conversionRate, isApproximate fields
- [x] T022 [US4] Update TransactionItem component in `client/src/components/transactions/TransactionItem.tsx` — when convertedAmount is present, display original amount with currency label and converted amount in base currency below it. Show approximate indicator icon when isApproximate is true.
- [x] T023 [US4] Add conversion toggle to TransactionList in `client/src/components/transactions/TransactionList.tsx` — add a "Show in base currency" toggle that passes `convertToBase=true` to the API call, re-fetches transactions with conversion data

**Checkpoint**: Transaction list optionally shows converted amounts. Historical rates used correctly. Approximate rates flagged.

---

## Phase 7: User Story 5 - Change Base Currency Preference (Priority: P3)

**Goal**: Users can change their base currency in settings, all conversions update accordingly

**Independent Test**: Change base currency from EGP to USD in settings, verify dashboard net worth and transaction conversions reflect the new currency.

### Implementation for User Story 5

- [x] T024 [US5] Add baseCurrency update to user profile endpoint in `server/src/controllers/auth.controller.ts` — extend the existing profile update (or create PATCH /api/auth/me) to accept `baseCurrency` field, validate it's a non-empty string of 3 chars
- [x] T025 [US5] Add baseCurrency to auth schema in `server/src/routes/auth.schemas.ts` — add optional `baseCurrency` field to profile update schema with Zod validation (string, length 3, uppercase)
- [x] T026 [US5] Update SettingsPage in `client/src/pages/SettingsPage.tsx` — add a base currency selector (dropdown or input) showing common currencies (EGP, USD, EUR, GBP, SAR), call profile update API on change, show success feedback
- [x] T027 [US5] Update AuthContext to expose baseCurrency in `client/src/contexts/AuthContext.tsx` — ensure user object includes baseCurrency, update context when user changes it so all components re-render with new currency

**Checkpoint**: Users can change base currency. All conversion displays (dashboard, transactions, rates) update to reflect the new base.

---

## Phase 8: User Story 6 - Manual Rate Override (Priority: P3)

**Goal**: Users can manually set exchange rate overrides for specific currency pairs

**Independent Test**: Set manual override for USD/EGP, verify net worth uses override rate. Remove override, verify system reverts to auto rate.

### Implementation for User Story 6

- [x] T028 [US6] Implement `setOverride` and `removeOverride` handlers in `server/src/controllers/exchange-rate.controller.ts` — setOverride: insert ExchangeRate row with source='manual', validate rate > 0. removeOverride: delete most recent manual rate for the pair (or mark inactive). Ensure getLatestRate() already prioritizes manual over auto.
- [x] T029 [P] [US6] Create RateOverrideModal component in `client/src/components/exchange-rates/RateOverrideModal.tsx` — form with fromCurrency, toCurrency (pre-filled if editing), rate input. Use React Hook Form + Zod validation. Submit calls `exchangeRatesApi.setOverride()`. Cancel/close dismisses.
- [x] T030 [US6] Add override actions to RateList in `client/src/components/exchange-rates/RateList.tsx` — add "Override" button per rate row that opens RateOverrideModal. For rows with active manual override, show "Remove Override" button that calls `exchangeRatesApi.removeOverride()`. Refresh rates after action.

**Checkpoint**: Users can set and remove manual rate overrides. Overrides apply to current conversions only (not historical).

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T031 Add loading skeletons and error boundaries to all new components — NetWorthCard, RateList, ExchangeRatesPage, conversion displays
- [x] T032 Add currency formatting utility in `client/src/utils/currency.ts` — helper to format amounts with currency symbol and locale-appropriate separators, handle XAU (gold grams) display
- [x] T033 Handle edge case: no rates available — ensure all conversion displays gracefully show "Rate unavailable" with unconverted amounts when no exchange rate data exists
- [x] T034 Run `tsc --noEmit` in both server/ and client/ to verify no type errors across all new and modified files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 Net Worth (Phase 3)**: Depends on Phase 2
- **US2 Auto Updates (Phase 4)**: Depends on Phase 2 — can run in parallel with US1
- **US3 View Rates (Phase 5)**: Depends on Phase 2 — can run in parallel with US1/US2
- **US4 Transaction Conversion (Phase 6)**: Depends on Phase 2 — can run in parallel with US1/US2/US3
- **US5 Change Base Currency (Phase 7)**: Depends on Phase 2 — can run in parallel with other stories
- **US6 Manual Override (Phase 8)**: Depends on Phase 2 + US3 (RateList component) — run after Phase 5
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P1)**: Independent after Phase 2
- **US3 (P2)**: Independent after Phase 2
- **US4 (P2)**: Independent after Phase 2
- **US5 (P3)**: Independent after Phase 2
- **US6 (P3)**: Depends on US3 (extends RateList component)

### Within Each User Story

- Backend logic before frontend components
- Services before controllers
- Pages/components depend on API client methods (Phase 1 T003)

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (Phase 1)
- T004, T005 run sequentially (T005 uses T004's rate fetching), then T006-T009 depend on both
- All user stories (except US6) can start in parallel after Phase 2
- Within US3: T017 and T018 can run in parallel
- Within US6: T029 can run in parallel with T028

---

## Parallel Example: Phase 2 (Foundational)

```
Sequential: T004 → T005 (gold depends on forex service)
Then parallel: T007 + T008 (controller + routes)
Then: T009 (register in index.ts)
T006 can run in parallel with T007+T008 (separate file)
```

## Parallel Example: User Stories after Phase 2

```
After Phase 2 completes:
  Track A: US1 (T010 → T011 → T012) — MVP dashboard
  Track B: US3 (T016 → T017 ∥ T018 → T019) — rates view
  Track C: US4 (T020 → T021 → T022 → T023) — transaction conversion
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: US1 Net Worth (T010-T012)
4. Complete Phase 4: US2 Auto Updates (T013-T015)
5. **STOP and VALIDATE**: Dashboard shows net worth, rates auto-refresh
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Core rate infrastructure ready
2. US1 + US2 → Dashboard net worth + auto-refresh (MVP!)
3. US3 → Exchange rates page (transparency)
4. US4 → Transaction conversion (reporting value)
5. US5 → Base currency settings (flexibility)
6. US6 → Manual overrides (power user feature)
7. Polish → Loading states, error handling, formatting

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Gold accounts use currency code "XAU" — price stored as EGP per gram
- All conversions computed on-the-fly (no stored converted balances)
- Manual overrides affect current conversions only, not historical
