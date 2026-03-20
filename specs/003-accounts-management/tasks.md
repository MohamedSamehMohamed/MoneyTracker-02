# Tasks: Accounts Management

**Input**: Design documents from `/specs/003-accounts-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/accounts-api.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared files needed by all user stories

- [X] T001 [P] Create Zod validation schemas for account CRUD in `server/src/routes/account.schemas.ts` — define `createAccountSchema` (name: string 1-100, type: enum cash/bank/wallet/gold, currency: string, icon?: string max 50), `updateAccountSchema` (name?: string 1-100, icon?: string max 50), and export inferred types
- [X] T002 [P] Create TypeScript types for accounts in `client/src/types/account.ts` — define `Account` interface (id, name, type, currency, balance as string, icon, createdAt, updatedAt), `CreateAccountInput`, `UpdateAccountInput`, and `AccountType` union type

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side service and routing that ALL user stories depend on

- [X] T003 Implement account service in `server/src/services/account.service.ts` — create functions: `listAccounts(userId)`, `createAccount(userId, input)`, `updateAccount(userId, accountId, input)`, `deleteAccount(userId, accountId)`. Use Prisma client, enforce userId ownership on all queries, convert BigInt balance to string in return values, check balance === 0n before delete (throw error with statusCode 400 if non-zero)
- [X] T004 Implement account controller in `server/src/controllers/account.controller.ts` — create handlers: `listAccountsHandler`, `createAccountHandler`, `updateAccountHandler`, `deleteAccountHandler`. Follow auth.controller.ts pattern (try/catch, next(error), proper status codes: 200/201/204/400/404)
- [X] T005 Create account routes in `server/src/routes/account.routes.ts` — define Express Router with: GET `/` (list), POST `/` (create with validateMiddleware), PATCH `/:id` (update with validateMiddleware), DELETE `/:id` (delete). All routes use authMiddleware
- [X] T006 Register account routes in `server/src/index.ts` — import accountRoutes, add `app.use('/api/accounts', accountRoutes)` after auth routes, add console.log for accounts endpoint

**Checkpoint**: Server-side CRUD is complete and testable via curl

---

## Phase 3: User Story 1 - Create a New Account (Priority: P1) — MVP

**Goal**: Users can create accounts with name, type, currency, and optional icon

**Independent Test**: POST to `/api/accounts` with valid data returns 201 with new account; invalid data returns 400

### Implementation for User Story 1

- [X] T007 [P] [US1] Add `accountsApi` to `client/src/services/api.ts` — add object with: `list()` calling GET `/accounts`, `create(data)` calling POST `/accounts`, `update(id, data)` calling PATCH `/accounts/:id`, `delete(id)` calling DELETE `/accounts/:id`
- [X] T008 [US1] Create AccountFormModal component in `client/src/components/accounts/AccountFormModal.tsx` — modal with React Hook Form + Zod: name input (required), type select (cash/bank/wallet/gold), currency select (EGP/USD/EUR/GOLD_GRAM, defaults to GOLD_GRAM when gold type selected), icon input (optional). Props: isOpen, onClose, onSubmit, initialData (for edit mode). Show validation errors inline

**Checkpoint**: Users can create accounts via the modal form

---

## Phase 4: User Story 2 - View All Accounts with Balances (Priority: P1)

**Goal**: Users see all their accounts listed with formatted balances, type icons, and an empty state

**Independent Test**: Navigate to /accounts page, see all accounts with correct formatting; with no accounts see empty state prompt

### Implementation for User Story 2

- [X] T009 [P] [US2] Create AccountCard component in `client/src/components/accounts/AccountCard.tsx` — display card showing: account name, type icon (use emoji or text icon per type: cash/bank/wallet/gold), currency label, formatted balance (divide by 100 for currencies, 1000 for gold, show with thousand separators and 2 decimal places). Props: account, onEdit, onDelete
- [X] T010 [US2] Create AccountList component in `client/src/components/accounts/AccountList.tsx` — renders grid of AccountCard components. Props: accounts array, onEdit, onDelete callbacks. Show empty state with message "No accounts yet" and "Add Account" button when list is empty
- [X] T011 [US2] Update AccountsPage in `client/src/pages/AccountsPage.tsx` — replace placeholder with full implementation: fetch accounts on mount via `accountsApi.list()`, render AccountList, add "Add Account" button that opens AccountFormModal, handle create submission (call API, refresh list), manage loading state

**Checkpoint**: Full accounts page is functional — create and view accounts

---

## Phase 5: User Story 3 - Edit an Account (Priority: P2)

**Goal**: Users can update an account's name and icon

**Independent Test**: Click edit on an account, change name, save — updated name appears in list

### Implementation for User Story 3

- [X] T012 [US3] Add edit flow to AccountsPage in `client/src/pages/AccountsPage.tsx` — add editingAccount state, wire AccountCard onEdit to open AccountFormModal with initialData pre-filled, handle update submission (call `accountsApi.update`, refresh list, close modal)

**Checkpoint**: Edit flow works end-to-end

---

## Phase 6: User Story 4 - Delete an Account (Priority: P3)

**Goal**: Users can delete zero-balance accounts with a confirmation dialog warning about transaction cascade

**Independent Test**: Delete a zero-balance account (succeeds, removed from list); attempt on non-zero balance (error shown)

### Implementation for User Story 4

- [X] T013 [P] [US4] Create DeleteAccountDialog component in `client/src/components/accounts/DeleteAccountDialog.tsx` — confirmation dialog showing account name, warning that associated transactions will be deleted, Cancel and Delete buttons. Props: isOpen, account, onConfirm, onCancel
- [X] T014 [US4] Add delete flow to AccountsPage in `client/src/pages/AccountsPage.tsx` — add deletingAccount state, wire AccountCard onDelete to open DeleteAccountDialog, handle confirm (call `accountsApi.delete`, refresh list, close dialog), handle API error for non-zero balance (show error message to user)

**Checkpoint**: Full CRUD is working — create, view, edit, delete accounts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across all stories

- [X] T015 Add loading and error states to AccountsPage in `client/src/pages/AccountsPage.tsx` — show loading spinner during API calls, show error banner on API failures with retry option
- [X] T016 Validate end-to-end flow per `specs/003-accounts-management/quickstart.md` — register user, create accounts of each type, verify list display, edit account name, delete zero-balance account, verify non-zero balance rejection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (schemas) — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel after Phase 2
  - US3 depends on US1+US2 (needs AccountsPage and AccountFormModal)
  - US4 depends on US2 (needs AccountsPage)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P1)**: After Phase 2 — no story dependencies (but practically benefits from US1 for create flow)
- **US3 (P2)**: After US1 + US2 — reuses AccountFormModal in edit mode
- **US4 (P3)**: After US2 — adds delete flow to AccountsPage

### Within Each User Story

- Client types (T002) before client components
- Service layer (T003) before controllers (T004)
- Controllers before routes (T005)
- Routes registered (T006) before any client API calls work

### Parallel Opportunities

- T001 and T002 can run in parallel (different codebases)
- T007 and T009 can run in parallel (different files)
- T008 and T009 can run in parallel (different components)
- T013 can run in parallel with T012 (different files)

---

## Parallel Example: Phase 1

```bash
# Launch both setup tasks together:
Task: "T001 - Create Zod schemas in server/src/routes/account.schemas.ts"
Task: "T002 - Create TypeScript types in client/src/types/account.ts"
```

## Parallel Example: Phase 3+4 (US1+US2)

```bash
# After Phase 2, launch US1 and US2 client work in parallel:
Task: "T007 - Add accountsApi to client/src/services/api.ts"
Task: "T009 - Create AccountCard in client/src/components/accounts/AccountCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: US1 — Create Account (T007-T008)
4. Complete Phase 4: US2 — View Accounts (T009-T011)
5. **STOP and VALIDATE**: Users can create and view accounts
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Server CRUD ready
2. Add US1 + US2 → Create and view accounts (MVP!)
3. Add US3 → Edit accounts
4. Add US4 → Delete accounts with confirmation
5. Polish → Loading states, error handling, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- BigInt balance must be converted to string in account.service.ts before JSON serialization
- Follow existing auth module pattern: schemas → controller → service → routes
- No new npm dependencies needed
- No database migrations needed (Account model exists from Phase 2)
