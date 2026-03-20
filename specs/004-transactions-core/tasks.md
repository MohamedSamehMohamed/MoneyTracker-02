# Tasks: Transactions (Core Feature)

**Input**: Design documents from `/specs/004-transactions-core/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/transactions-api.md

**Tests**: Not requested -- test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared files needed by all user stories

- [ ] T001 [P] Create Zod validation schemas for transaction CRUD in `server/src/routes/transaction.schemas.ts` -- define `createTransactionSchema` (accountId: string uuid, type: enum income/expense/transfer, amount: number positive int, categoryId?: string uuid, note?: string max 500, date: string YYYY-MM-DD must be today or past, transferToId?: string uuid required when type=transfer), `updateTransactionSchema` (amount?: number positive int, categoryId?: string uuid or null, note?: string max 500 or null, date?: string YYYY-MM-DD must be today or past), `listTransactionsSchema` for query params (page?: number default 1, limit?: number default 20 max 100, accountId?: string, categoryId?: string, type?: enum, dateFrom?: string, dateTo?: string), and export inferred types
- [ ] T002 [P] Create TypeScript types for transactions in `client/src/types/transaction.ts` -- define `Transaction` interface (id, userId, accountId, type, amount as string, categoryId, note, date, transferToId, createdAt, updatedAt, account: {id, name, type, currency}, category: {id, name, icon, color} | null, transferAccount: {id, name, type, currency} | null), `CreateTransactionInput`, `UpdateTransactionInput`, `TransactionType` union, `TransactionFilters` interface (page, limit, accountId, categoryId, type, dateFrom, dateTo), and `PaginationInfo` interface (page, limit, total, totalPages)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side service, controller, routing, and categories endpoint that ALL user stories depend on

- [ ] T003 Implement transaction service in `server/src/services/transaction.service.ts` -- create functions: `listTransactions(userId, filters)` with pagination (offset-based, default 20/page) and optional filters (accountId, categoryId, type, dateFrom, dateTo), include related account, category, and transferAccount in query, return {transactions, pagination}; `getTransaction(userId, transactionId)` with ownership check; `createTransaction(userId, input)` using Prisma `$transaction` to atomically create the record and update account balance (income: +=amount, expense: -=amount, transfer: source -=amount and dest +=amount), verify account ownership, verify transferToId != accountId for transfers; `updateTransaction(userId, transactionId, input)` using `$transaction` to atomically reverse old balance effect and apply new if amount changed; `deleteTransaction(userId, transactionId)` using `$transaction` to atomically delete record and reverse balance effect. Convert BigInt amounts to string in all return values. Sort by date desc, createdAt desc.
- [ ] T004 Implement transaction controller in `server/src/controllers/transaction.controller.ts` -- create handlers: `listTransactionsHandler` (parse query params, call service, return 200), `getTransactionHandler` (return 200 or 404), `createTransactionHandler` (return 201 or 400), `updateTransactionHandler` (return 200 or 400/404), `deleteTransactionHandler` (return 204 or 404). Follow account.controller.ts pattern (try/catch, next(error), proper status codes)
- [ ] T005 Create transaction routes in `server/src/routes/transaction.routes.ts` -- define Express Router with: GET `/` (list with validateMiddleware on query), GET `/:id` (get single), POST `/` (create with validateMiddleware), PATCH `/:id` (update with validateMiddleware), DELETE `/:id` (delete). All routes use authMiddleware
- [ ] T006 Implement category list endpoint -- create `server/src/controllers/category.controller.ts` with `listCategoriesHandler` that returns categories where userId is null (system defaults) OR matches authenticated user, with optional type filter; create `server/src/routes/category.routes.ts` with GET `/` route using authMiddleware
- [ ] T007 Register routes in `server/src/index.ts` -- import transactionRoutes and categoryRoutes, add `app.use('/api/transactions', transactionRoutes)` and `app.use('/api/categories', categoryRoutes)` after account routes, add console.log for both endpoints

**Checkpoint**: Server-side transaction CRUD + categories list complete and testable via curl

---

## Phase 3: User Story 1 - Record an Income or Expense (Priority: P1) -- MVP

**Goal**: Users can create income and expense transactions against their accounts, with balance updating immediately

**Independent Test**: POST to `/api/transactions` with valid income/expense data returns 201 and account balance changes; invalid data returns 400

### Implementation for User Story 1

- [ ] T008 [P] [US1] Add `transactionsApi` and `categoriesApi` to `client/src/services/api.ts` -- transactionsApi with: `list(filters)` calling GET `/transactions` with query params, `get(id)` calling GET `/transactions/:id`, `create(data)` calling POST `/transactions`, `update(id, data)` calling PATCH `/transactions/:id`, `delete(id)` calling DELETE `/transactions/:id`; categoriesApi with: `list(type?)` calling GET `/categories` with optional type query param. Use proper TypeScript types from `types/transaction.ts`
- [ ] T009 [US1] Create TransactionFormModal component in `client/src/components/transactions/TransactionFormModal.tsx` -- modal with React Hook Form + Zod: type select (income/expense only for this phase, transfer added in US3), account select (populated from user's accounts via accountsApi.list), amount input (user enters human-readable amount e.g. "150.00", convert to smallest unit on submit by multiplying by 100 for currencies or 1000 for gold based on selected account's currency), category select (soft-filtered: show matching-type categories first via categoriesApi.list, then remaining categories in separate group), date input (native date picker, default today, reject future dates), note textarea (optional, max 500). Props: isOpen, onClose, onSubmit, accounts list, initialData (for edit mode in US4). Show validation errors inline
- [ ] T010 [US1] Create TransactionsPage in `client/src/pages/TransactionsPage.tsx` -- initial implementation with: "Add Transaction" button that opens TransactionFormModal, fetch accounts on mount for the form's account selector, handle create submission (call transactionsApi.create, show success), manage loading/error states. Add route in `client/src/App.tsx` for `/transactions` path
- [ ] T011 [US1] Add navigation link to transactions in the app layout -- update the navigation/sidebar (if exists) or header to include a link to `/transactions`

**Checkpoint**: Users can create income/expense transactions via the modal form and account balances update

---

## Phase 4: User Story 2 - View Transaction History (Priority: P1)

**Goal**: Users see all their transactions listed with formatted amounts, filters, and pagination

**Independent Test**: Navigate to /transactions page, see all transactions with correct formatting; apply filters and verify results; test pagination with 25+ transactions

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create TransactionItem component in `client/src/components/transactions/TransactionItem.tsx` -- display row/card showing: transaction type with visual indicator (green arrow up for income, red arrow down for expense, blue arrows for transfer), formatted amount (divide by 100 for currencies, 1000 for gold, with thousand separators and 2-3 decimal places), account name, category name and icon, date, note (truncated if long), transfer destination account name (if transfer). Props: transaction, onEdit, onDelete
- [ ] T013 [P] [US2] Create TransactionFilters component in `client/src/components/transactions/TransactionFilters.tsx` -- filter controls: date range (from/to date inputs), account dropdown (populated from accounts list), category dropdown (from categories list), type dropdown (all/income/expense/transfer). Props: filters, accounts, categories, onFilterChange. Filters should update on change (no separate apply button)
- [ ] T014 [US2] Create TransactionList component in `client/src/components/transactions/TransactionList.tsx` -- renders list of TransactionItem components. Props: transactions array, onEdit, onDelete, pagination info, onPageChange. Show empty state with message "No transactions yet" and "Add Transaction" button when list is empty. Show pagination controls (Previous/Next buttons with page info "Page X of Y") when totalPages > 1
- [ ] T015 [US2] Update TransactionsPage in `client/src/pages/TransactionsPage.tsx` -- add full implementation: fetch transactions with filters on mount and on filter change via `transactionsApi.list(filters)`, fetch accounts and categories for filter dropdowns, render TransactionFilters and TransactionList, manage filter state with URL query params or local state, handle pagination (page navigation triggers new fetch), retain "Add Transaction" button and create flow from US1

**Checkpoint**: Full transaction list with filters and pagination is functional

---

## Phase 5: User Story 3 - Transfer Between Accounts (Priority: P2)

**Goal**: Users can create transfer transactions moving money between accounts

**Independent Test**: Create a transfer between two accounts, verify both balances update correctly; attempt self-transfer, verify error

### Implementation for User Story 3

- [ ] T016 [US3] Add transfer mode to TransactionFormModal in `client/src/components/transactions/TransactionFormModal.tsx` -- add "transfer" option to type select, when transfer is selected: show destination account dropdown (filtered to exclude source account), hide category field (transfers typically don't need categories), validate source != destination. On submit with type=transfer, include transferToId in the payload

**Checkpoint**: Transfer flow works end-to-end, both account balances update atomically

---

## Phase 6: User Story 4 - Edit a Transaction (Priority: P2)

**Goal**: Users can update a transaction's amount, category, note, and date (type and account are locked)

**Independent Test**: Edit a transaction's amount, verify account balance adjusts by the difference

### Implementation for User Story 4

- [ ] T017 [US4] Add edit flow to TransactionsPage in `client/src/pages/TransactionsPage.tsx` -- add editingTransaction state, wire TransactionItem onEdit to open TransactionFormModal with initialData pre-filled, type and account fields disabled/read-only in edit mode, handle update submission (call `transactionsApi.update`, refresh list, close modal). In the TransactionFormModal, when initialData is provided: disable type select and account select, use `useEffect` to reset form when initialData changes

**Checkpoint**: Edit flow works end-to-end, balance recalculates correctly

---

## Phase 7: User Story 5 - Delete a Transaction (Priority: P3)

**Goal**: Users can delete a transaction with confirmation, reversing its balance effect

**Independent Test**: Delete an income transaction, verify account balance decreases; delete a transfer, verify both accounts reverse

### Implementation for User Story 5

- [ ] T018 [P] [US5] Create DeleteTransactionDialog component in `client/src/components/transactions/DeleteTransactionDialog.tsx` -- confirmation dialog showing transaction details (type, amount, account name), warning that this will affect account balance(s) (and both accounts for transfers), Cancel and Delete buttons, loading state during deletion. Props: isOpen, transaction, onConfirm, onCancel, isLoading
- [ ] T019 [US5] Add delete flow to TransactionsPage in `client/src/pages/TransactionsPage.tsx` -- add deletingTransaction state and isDeletingLoading state, wire TransactionItem onDelete to open DeleteTransactionDialog, handle confirm (call `transactionsApi.delete`, refresh list, close dialog), handle API error (show error message to user)

**Checkpoint**: Full CRUD is working -- create, view, edit, delete transactions with correct balance tracking

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all stories

- [ ] T020 Add loading and error states across TransactionsPage in `client/src/pages/TransactionsPage.tsx` -- show loading spinner during initial fetch and filter changes, show error banner on API failures with retry option, disable action buttons during pending operations
- [ ] T021 Validate end-to-end flow per `specs/004-transactions-core/quickstart.md` -- register user, create accounts, create income/expense/transfer transactions of each type, verify list display with filters, edit transaction amount, delete transaction, verify all account balances are correct throughout

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies -- can start immediately
- **Foundational (Phase 2)**: Depends on T001 (schemas) -- BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel after Phase 2
  - US3 depends on US1 (needs TransactionFormModal)
  - US4 depends on US1+US2 (needs TransactionsPage and TransactionFormModal)
  - US5 depends on US2 (needs TransactionsPage with list)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 -- no story dependencies
- **US2 (P1)**: After Phase 2 -- no story dependencies (but practically benefits from US1 for create flow)
- **US3 (P2)**: After US1 -- extends TransactionFormModal with transfer mode
- **US4 (P2)**: After US1 + US2 -- reuses TransactionFormModal in edit mode, needs list for edit trigger
- **US5 (P3)**: After US2 -- adds delete flow to TransactionsPage

### Within Each User Story

- Client types (T002) before client components
- Service layer (T003) before controllers (T004)
- Controllers before routes (T005)
- Routes registered (T007) before any client API calls work

### Parallel Opportunities

- T001 and T002 can run in parallel (server vs client)
- T008, T012, and T013 can run in parallel (different files)
- T012 and T013 can run in parallel (different components)
- T018 can run in parallel with T017 (different files)

---

## Parallel Example: Phase 1

```bash
# Launch both setup tasks together:
Task: "T001 - Create Zod schemas in server/src/routes/transaction.schemas.ts"
Task: "T002 - Create TypeScript types in client/src/types/transaction.ts"
```

## Parallel Example: Phase 3+4 (US1+US2)

```bash
# After Phase 2, launch US1 and US2 client work in parallel:
Task: "T008 - Add transactionsApi to client/src/services/api.ts"
Task: "T012 - Create TransactionItem in client/src/components/transactions/TransactionItem.tsx"
Task: "T013 - Create TransactionFilters in client/src/components/transactions/TransactionFilters.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T007)
3. Complete Phase 3: US1 -- Record Income/Expense (T008-T011)
4. Complete Phase 4: US2 -- View Transaction History (T012-T015)
5. **STOP and VALIDATE**: Users can create and view transactions with filters
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational -> Server CRUD ready
2. Add US1 + US2 -> Create and view transactions (MVP!)
3. Add US3 -> Transfer between accounts
4. Add US4 -> Edit transactions with balance recalculation
5. Add US5 -> Delete transactions with confirmation
6. Polish -> Loading states, error handling, end-to-end validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- BigInt amount must be converted to string in transaction.service.ts before JSON serialization
- All balance-changing operations MUST use Prisma `$transaction` for atomicity
- Amount is stored as positive integer; type determines direction (income adds, expense subtracts)
- Follow existing account module pattern: schemas -> controller -> service -> routes
- Category endpoint is new (no existing categories API) -- needed for transaction form
- No new npm dependencies needed
- No database migrations needed (Transaction model exists from Phase 2)
- Date validation: server rejects future dates; client date picker should also restrict to today/past
- Transfer form: hide category, show destination account, validate source != destination
- Edit form: type and account fields are read-only/disabled
