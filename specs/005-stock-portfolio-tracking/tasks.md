# Tasks: Stock Portfolio Tracking

**Input**: Design documents from `/specs/005-stock-portfolio-tracking/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/stock-api.md, quickstart.md

**Tests**: Not requested — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `server/` (backend), `client/` (frontend)

---

## Phase 1: Setup

**Purpose**: Database schema and shared project scaffolding

- [X] T001 Add `StockTransaction` model and `StockTransactionType` enum to `server/prisma/schema.prisma` per data-model.md (include indexes, relations to User and Account)
- [X] T002 Run `npx prisma migrate dev --name add-stock-transactions` and regenerate Prisma client
- [X] T003 [P] Create stock TypeScript interfaces in `client/src/types/stock.ts` (StockTransaction, StockHolding, CreateStockTransactionInput, UpdateStockTransactionInput, StockTransactionFilters, StockTransactionListResponse, PortfolioResponse)
- [X] T004 [P] Create Zod validation schemas in `server/src/routes/stock.schemas.ts` (createStockTransactionSchema, updateStockTransactionSchema, listStockTransactionsSchema) following patterns from `server/src/routes/transaction.schemas.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend routing skeleton and frontend wiring that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create stock controller with handler stubs in `server/src/controllers/stock.controller.ts` (createHandler, listHandler, getHandler, updateHandler, deleteHandler, portfolioHandler) following patterns from `server/src/controllers/transaction.controller.ts`
- [X] T006 Create stock routes in `server/src/routes/stock.routes.ts` (POST /, GET /, GET /portfolio, GET /:id, PATCH /:id, DELETE /:id) with authMiddleware and validateMiddleware
- [X] T007 Register stock routes in `server/src/index.ts` — add `app.use('/api/stocks', stockRoutes)`
- [X] T008 Add `stocksApi` section to `client/src/services/api.ts` with methods: list, get, create, update, delete, portfolio — following the `transactionsApi` pattern
- [X] T009 Create placeholder `client/src/pages/StocksPage.tsx` with basic layout (portfolio section + transaction history section)
- [X] T010 Add `/stocks` route to `client/src/App.tsx` and add "Stocks" link to `client/src/components/layout/Sidebar.tsx`

**Checkpoint**: App compiles, `/stocks` page renders, `/api/stocks` routes registered (returning stubs)

---

## Phase 3: User Story 1 — Record a Stock Purchase (Priority: P1) MVP

**Goal**: Users can record stock purchases with company, shares, price, currency, date, and optional note

**Independent Test**: Create a stock purchase via the form and verify it appears in the API response with correct data

### Implementation for User Story 1

- [X] T011 [US1] Implement `createStockTransaction` in `server/src/services/stock.service.ts` — handle type=buy: validate input, create StockTransaction record via prisma.$transaction, serialize Decimal fields to strings in response. Include `serializeStockTransaction` helper
- [X] T012 [US1] Implement `getStockTransaction` in `server/src/services/stock.service.ts` — fetch by id with ownership check, include account relation if linked
- [X] T013 [US1] Wire up `createStockTransactionHandler` and `getStockTransactionHandler` in `server/src/controllers/stock.controller.ts` with proper error responses (400, 401, 404)
- [X] T014 [P] [US1] Create `client/src/components/stocks/StockTransactionFormModal.tsx` — form with fields: type (buy/sell selector), company, shares, pricePerShare, currency, date, note, optional accountId. Use React Hook Form + Zod validation. Initially only support type=buy
- [X] T015 [US1] Integrate buy form into `client/src/pages/StocksPage.tsx` — add "Record Purchase" button that opens the form modal, call `stocksApi.create` on submit, show success/error feedback

**Checkpoint**: Users can record a stock purchase and see it returned from the API. Form validates required fields, rejects future dates.

---

## Phase 4: User Story 2 — View Stock Portfolio (Priority: P1)

**Goal**: Users see an aggregated portfolio view grouped by company showing total shares, average cost, and total invested

**Independent Test**: After creating multiple purchases for different companies, the portfolio endpoint returns correct aggregated data and the UI displays it

### Implementation for User Story 2

- [ ] T016 [US2] Implement `getPortfolio` in `server/src/services/stock.service.ts` — aggregate StockTransactions by (userId, company): compute totalShares, averageCostPerShare, totalInvested, totalRealizedGain. Exclude companies with totalShares <= 0. Use Prisma groupBy or raw SQL
- [ ] T017 [US2] Wire up `portfolioHandler` in `server/src/controllers/stock.controller.ts`
- [ ] T018 [P] [US2] Create `client/src/components/stocks/StockPortfolioCard.tsx` — display single holding: company name, total shares, avg cost, total invested, currency
- [ ] T019 [P] [US2] Create `client/src/components/stocks/StockPortfolioList.tsx` — render list of StockPortfolioCard components, handle empty state with prompt to record first purchase
- [ ] T020 [US2] Integrate portfolio view into `client/src/pages/StocksPage.tsx` — fetch from `stocksApi.portfolio` on mount, display StockPortfolioList at the top of the page

**Checkpoint**: Portfolio section shows aggregated holdings. Multiple purchases of same company show correct average cost. Empty state displays when no holdings exist.

---

## Phase 5: User Story 3 — Record a Stock Sale (Priority: P2)

**Goal**: Users can record stock sales with oversell prevention and realized gain/loss calculation

**Independent Test**: Sell shares from an existing holding, verify holding quantity decreases, and realized gain is computed correctly

### Implementation for User Story 3

- [ ] T021 [US3] Add sell logic to `createStockTransaction` in `server/src/services/stock.service.ts` — for type=sell: calculate net shares held for company (inside prisma.$transaction), reject if sell exceeds held shares, compute realizedGain = shares * (sellPrice - avgCost), store on record
- [ ] T022 [US3] Add currency consistency validation to `createStockTransaction` in `server/src/services/stock.service.ts` — before creating any transaction, check that currency matches existing transactions for (userId, company). Return 400 if mismatch
- [ ] T023 [US3] Update `client/src/components/stocks/StockTransactionFormModal.tsx` — enable sell mode in the type selector, show current holdings for the selected company (to help user know max shares available)
- [ ] T024 [US3] Update `client/src/pages/StocksPage.tsx` — add "Record Sale" action (can reuse form modal with type=sell), refresh portfolio after sale

**Checkpoint**: Selling shares updates portfolio correctly. Oversell attempt shows error. Realized gain/loss displays on sell transactions.

---

## Phase 6: User Story 4 — View Stock Transaction History (Priority: P2)

**Goal**: Users see a paginated, filterable list of all stock buy/sell transactions

**Independent Test**: Create several buy/sell transactions, verify they appear in reverse chronological order with correct filters

### Implementation for User Story 4

- [ ] T025 [US4] Implement `listStockTransactions` in `server/src/services/stock.service.ts` — paginated list with filters (company, type, dateFrom, dateTo), ordered by date DESC then createdAt DESC. Include account relation. Return pagination metadata
- [ ] T026 [US4] Wire up `listStockTransactionsHandler` in `server/src/controllers/stock.controller.ts`
- [ ] T027 [P] [US4] Create `client/src/components/stocks/StockTransactionItem.tsx` — display single transaction row: type badge (buy/sell), company, shares, price, total value, date, realized gain (for sells), linked account name
- [ ] T028 [P] [US4] Create `client/src/components/stocks/StockFilters.tsx` — filter controls: company text input, type dropdown (all/buy/sell), date range pickers
- [ ] T029 [P] [US4] Create `client/src/components/stocks/StockTransactionList.tsx` — render list of StockTransactionItem, pagination controls, empty state
- [ ] T030 [US4] Integrate transaction history into `client/src/pages/StocksPage.tsx` — add history section below portfolio, wire up filters and pagination, fetch from `stocksApi.list`

**Checkpoint**: Transaction history shows all stock transactions with working filters and pagination. Buy/sell types are visually distinguished.

---

## Phase 7: User Story 5 — Link Stock Transactions to Funding Account (Priority: P3)

**Goal**: Users can optionally link stock purchases/sales to an existing account, adjusting that account's balance

**Independent Test**: Buy stocks linked to a bank account, verify bank balance decreases by total purchase amount

### Implementation for User Story 5

- [ ] T031 [US5] Add account linking logic to `createStockTransaction` in `server/src/services/stock.service.ts` — when accountId provided: validate account exists and belongs to user, validate currency match between stock transaction and account, compute balance adjustment (shares * pricePerShare * 100 for 2-decimal currencies), decrement on buy / increment on sell, all within prisma.$transaction
- [ ] T032 [US5] Update `client/src/components/stocks/StockTransactionFormModal.tsx` — add optional account selector dropdown (fetch user's accounts, filter by matching currency), show "Link to account" toggle or optional dropdown
- [ ] T033 [US5] Display linked account name in `client/src/components/stocks/StockTransactionItem.tsx` — show account badge/name when transaction has a linked account

**Checkpoint**: Stock purchases with linked account correctly deduct from account balance. Sales with linked account add to balance. Transactions without linked account work unchanged.

---

## Phase 8: Edit & Delete Stock Transactions

**Purpose**: Complete CRUD operations for stock transactions

- [ ] T034 [US4] Implement `updateStockTransaction` in `server/src/services/stock.service.ts` — allow editing shares, pricePerShare, note, date (company and type locked). Recalculate linked account balance adjustment if shares/price changed. For sell edits: re-validate that new share count doesn't exceed held shares
- [ ] T035 [US4] Implement `deleteStockTransaction` in `server/src/services/stock.service.ts` — reverse linked account balance if present, delete record. For buy deletes: warn/allow even if it would make net shares negative (user's responsibility)
- [ ] T036 [US4] Wire up `updateStockTransactionHandler` and `deleteStockTransactionHandler` in `server/src/controllers/stock.controller.ts`
- [ ] T037 [P] Create `client/src/components/stocks/DeleteStockTransactionDialog.tsx` — confirmation dialog before delete, following pattern from `client/src/components/transactions/DeleteTransactionDialog.tsx`
- [ ] T038 Update `client/src/components/stocks/StockTransactionItem.tsx` — add edit and delete action buttons
- [ ] T039 Update `client/src/components/stocks/StockTransactionFormModal.tsx` — support edit mode (pre-fill form, disable company and type fields, call `stocksApi.update` on submit)
- [ ] T040 Wire up edit/delete actions in `client/src/pages/StocksPage.tsx` — open form modal in edit mode, open delete dialog, refresh list and portfolio after changes

**Checkpoint**: All CRUD operations work correctly. Editing recalculates balances. Delete reverses balance effects and shows confirmation.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final quality improvements across all user stories

- [ ] T041 [P] Add loading states and error boundaries to `client/src/pages/StocksPage.tsx` — loading spinners for portfolio and history sections, error messages for failed API calls
- [ ] T042 [P] Add number formatting utility for stock amounts in `client/src/utils/formatters.ts` — format shares (up to 8 decimal places, strip trailing zeros) and prices (2 decimal places with currency symbol)
- [ ] T043 Apply formatting utility across stock components (`StockPortfolioCard.tsx`, `StockTransactionItem.tsx`, `StockTransactionFormModal.tsx`)
- [ ] T044 Verify all API error responses return consistent format and user-friendly messages in `server/src/services/stock.service.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — first story to implement
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 (backend), but benefits from US1 data for testing
- **US3 (Phase 5)**: Depends on US1 (needs existing buy transactions to sell against)
- **US4 (Phase 6)**: Depends on Phase 2 — can run in parallel with US1/US2 for backend, benefits from data for testing
- **US5 (Phase 7)**: Depends on US1 (adds account linking to existing buy/sell flow)
- **Edit/Delete (Phase 8)**: Depends on US1 + US4 (needs transactions to edit/delete)
- **Polish (Phase 9)**: Depends on all prior phases

### User Story Dependencies

- **US1 (Record Purchase)**: Independent after Phase 2 — core MVP
- **US2 (View Portfolio)**: Independent after Phase 2 — but needs US1 data to display meaningful results
- **US3 (Record Sale)**: Requires US1 — must have bought shares to sell
- **US4 (View History)**: Independent after Phase 2 — but needs US1/US3 data to display
- **US5 (Account Linking)**: Requires US1 — extends the buy/sell flow

### Within Each User Story

- Backend service before controller wiring
- Controller wiring before frontend integration
- Frontend components can be built in parallel [P] before page integration

### Parallel Opportunities

- T003 + T004 can run in parallel (different files)
- T014 can run in parallel with T011-T013 (frontend/backend separation)
- T018 + T019 can run in parallel (independent components)
- T027 + T028 + T029 can run in parallel (independent components)
- T037 can run in parallel with T034-T036 (frontend/backend separation)
- T041 + T042 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Backend (sequential — service before controller):
Task T011: "Implement createStockTransaction in server/src/services/stock.service.ts"
Task T012: "Implement getStockTransaction in server/src/services/stock.service.ts"
Task T013: "Wire up handlers in server/src/controllers/stock.controller.ts"

# Frontend (parallel with backend):
Task T014: "Create StockTransactionFormModal in client/src/components/stocks/"

# Integration (after both backend + frontend ready):
Task T015: "Integrate buy form into StocksPage"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema + migration)
2. Complete Phase 2: Foundational (routes, types, page shell)
3. Complete Phase 3: User Story 1 (record stock purchase)
4. **STOP and VALIDATE**: Create a purchase via the UI, verify it persists
5. Deploy/demo if ready — users can already track stock buys

### Incremental Delivery

1. Setup + Foundational → App compiles with stocks page skeleton
2. US1 (Record Purchase) → MVP! Users can record stock buys
3. US2 (View Portfolio) → Users see aggregated holdings
4. US3 (Record Sale) → Users can sell and see gains/losses
5. US4 (View History) → Full transaction audit trail with filters
6. US5 (Account Linking) → Financial integration with existing accounts
7. Edit/Delete → Full CRUD
8. Polish → Production-quality UX

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Decimal fields (shares, pricePerShare, realizedGain) are serialized as strings in API responses
- Average cost is computed on-the-fly, not stored as a separate table
- realizedGain is computed and stored at sell time, not retroactively updated
- Currency consistency is enforced per (userId, company) pair
- All balance adjustments use prisma.$transaction for atomicity
