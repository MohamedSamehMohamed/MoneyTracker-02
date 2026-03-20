# Feature Specification: Transactions (Core Feature)

**Feature Branch**: `004-transactions-core`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Phase 4 -- Transactions (Core Feature)"

## Clarifications

### Session 2026-03-20

- Q: Can users change the transaction type or account when editing? → A: No. Only amount, category, note, and date are editable. Type and account are locked after creation.
- Q: Should the system enforce that category type matches transaction type? → A: Soft filter -- show matching categories first (income categories for income, expense categories for expense) but allow selecting any category.
- Q: Can users create transactions with future dates? → A: No. Transaction dates must be today or in the past. Future dates are rejected with a validation error.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record an Income or Expense (Priority: P1)

A logged-in user wants to record a financial transaction against one of their accounts. For example, they receive their salary (income to "NBE Bank") or buy groceries (expense from "Cash EGP"). They select the account, choose income or expense, enter the amount, pick a category, set the date, and optionally add a note. After saving, the account balance updates immediately.

**Why this priority**: Recording income and expenses is the fundamental action of a finance tracker. Without this, the app provides no value beyond showing empty accounts.

**Independent Test**: Can be fully tested by creating a transaction and verifying it appears in the transaction list and the source account balance changes accordingly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a "Cash EGP" account (balance 0), **When** they create an income transaction of 5,000.00 EGP with category "Salary" and date 2026-03-20, **Then** the transaction is saved, appears in the transaction list, and the account balance becomes 5,000.00 EGP.
2. **Given** an authenticated user with a "Cash EGP" account (balance 5,000.00 EGP), **When** they create an expense transaction of 150.00 EGP with category "Food", **Then** the transaction is saved and the account balance becomes 4,850.00 EGP.
3. **Given** an authenticated user creating a transaction, **When** they submit with a missing required field (amount, account, or type), **Then** the system shows a validation error and does not create the transaction.
4. **Given** an authenticated user creating an expense, **When** the expense amount exceeds the account balance, **Then** the system allows it (balances can go negative) and the transaction is saved.

---

### User Story 2 - View Transaction History (Priority: P1)

A logged-in user wants to see all their transactions in a chronological list so they can review their spending and income. They can filter by date range, account, category, and transaction type. The list is paginated for performance.

**Why this priority**: Viewing past transactions is essential for financial awareness. Users need to see where their money went. Tied with recording as the core experience.

**Independent Test**: Can be fully tested by viewing the transaction list after creating several transactions, applying filters, and verifying pagination works.

**Acceptance Scenarios**:

1. **Given** an authenticated user with 25 transactions, **When** they navigate to the Transactions page, **Then** transactions are displayed in reverse chronological order (newest first), paginated (e.g., 20 per page).
2. **Given** an authenticated user viewing transactions, **When** they filter by account "Cash EGP", **Then** only transactions for that account are shown.
3. **Given** an authenticated user viewing transactions, **When** they filter by date range March 1-15, **Then** only transactions within that range are shown.
4. **Given** an authenticated user viewing transactions, **When** they filter by category "Food", **Then** only food-related transactions are shown.
5. **Given** an authenticated user viewing transactions, **When** they filter by type "expense", **Then** only expense transactions are shown.
6. **Given** an authenticated user with no transactions, **When** they visit the Transactions page, **Then** they see an empty state prompting them to add their first transaction.

---

### User Story 3 - Transfer Between Accounts (Priority: P2)

A user wants to move money between their accounts. For example, withdrawing cash from the bank (transfer from "NBE Bank" to "Cash EGP") or depositing money into a wallet. The transfer deducts from the source account and adds to the destination account atomically.

**Why this priority**: Transfers are a common real-world action but depend on the income/expense flow being stable first. They add significant value by keeping balances accurate across accounts.

**Independent Test**: Can be fully tested by creating a transfer between two accounts and verifying both balances update correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with "NBE Bank" (balance 10,000.00 EGP) and "Cash EGP" (balance 0), **When** they create a transfer of 2,000.00 EGP from "NBE Bank" to "Cash EGP", **Then** "NBE Bank" balance becomes 8,000.00 EGP and "Cash EGP" balance becomes 2,000.00 EGP.
2. **Given** an authenticated user creating a transfer, **When** they select the same account as both source and destination, **Then** the system shows an error preventing self-transfers.
3. **Given** an authenticated user creating a transfer, **When** the transfer completes, **Then** a single transaction record is created linking both the source and destination accounts.

---

### User Story 4 - Edit a Transaction (Priority: P2)

A user realizes they made a mistake in a past transaction (wrong amount, wrong category, etc.) and wants to correct it. When a transaction is edited, the account balance is recalculated to reflect the change. The transaction type and account cannot be changed after creation -- if the user chose the wrong type or account, they must delete and recreate.

**Why this priority**: Mistakes are inevitable. Without edit capability, users would need to delete and recreate transactions, which is error-prone and frustrating.

**Independent Test**: Can be fully tested by editing a transaction's amount and verifying the account balance adjusts correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an expense of 100.00 EGP, **When** they edit the amount to 150.00 EGP, **Then** the transaction is updated and the account balance is adjusted by the 50.00 EGP difference.
2. **Given** an authenticated user editing a transaction, **When** they change the category from "Food" to "Transport", **Then** the category is updated but the balance remains unchanged.
3. **Given** an authenticated user editing a transaction, **When** the edit form is shown, **Then** the type and account fields are read-only / disabled.
4. **Given** an authenticated user, **When** they attempt to edit a transaction belonging to another user, **Then** the system denies the request.

---

### User Story 5 - Delete a Transaction (Priority: P3)

A user wants to remove a transaction they entered by mistake. Deleting a transaction reverses its effect on the account balance.

**Why this priority**: Deletion is a less frequent action and is destructive. It's lower priority because most corrections can be handled via editing.

**Independent Test**: Can be fully tested by deleting a transaction and verifying the account balance reverts.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an income transaction of 500.00 EGP, **When** they delete it, **Then** the transaction is removed and the account balance decreases by 500.00 EGP.
2. **Given** an authenticated user deleting a transfer transaction, **When** the deletion completes, **Then** both the source account (debited) and destination account (credited) balances are reversed.
3. **Given** an authenticated user, **When** they click delete, **Then** a confirmation dialog appears before the transaction is actually removed.

---

### Edge Cases

- What happens when a user edits a transfer transaction's amount? Both the source and destination account balances must be recalculated atomically.
- What happens when an account referenced by a transfer is deleted? The transaction remains but the transfer link becomes null (per existing cascade behavior: onDelete: SetNull on transferToId).
- How does the system handle very large amounts (billions of piasters)? The system uses BigInt storage; the display layer formats large numbers with thousand separators.
- What happens if two transactions are submitted simultaneously for the same account? The system uses database-level transactions to ensure balance consistency.
- What happens when a user tries to create a transaction for an account they don't own? The system rejects the request with an authorization error.
- What happens when a transfer involves accounts with different currencies? The system allows it -- the amount is recorded in the source account's currency unit. Cross-currency conversion is out of scope for this phase (handled in Phase 5).
- What happens when a user enters a future date? The system rejects it with a validation error. Scheduled/recurring transactions are out of scope (Phase 10).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create income transactions that increase the associated account balance by the transaction amount.
- **FR-002**: System MUST allow authenticated users to create expense transactions that decrease the associated account balance by the transaction amount.
- **FR-003**: System MUST allow authenticated users to create transfer transactions that atomically decrease the source account balance and increase the destination account balance.
- **FR-004**: System MUST prevent transfers where the source and destination accounts are the same.
- **FR-005**: System MUST list transactions with pagination support (configurable page size, default 20 items per page).
- **FR-006**: System MUST support filtering transactions by: date range, account, category, and transaction type.
- **FR-007**: System MUST display transactions in reverse chronological order (newest first) by default.
- **FR-008**: System MUST allow users to edit a transaction's amount, category, note, and date, recalculating account balances to reflect the change. Type and account are locked after creation.
- **FR-009**: System MUST allow users to delete a transaction, reversing its effect on account balance(s).
- **FR-010**: System MUST show a confirmation dialog before deleting a transaction.
- **FR-011**: System MUST validate all transaction input (amount must be positive, account must exist and belong to the user, type must be income/expense/transfer, transfer requires a destination account, date must be today or in the past).
- **FR-012**: System MUST ensure users can only view, edit, and delete their own transactions (ownership enforcement).
- **FR-013**: System MUST format transaction amounts for display in human-readable form (e.g., piasters to EGP with two decimal places, milligrams to grams with three decimal places).
- **FR-014**: System MUST display appropriate visual indicators for each transaction type (income, expense, transfer).
- **FR-015**: System MUST show an empty state when a user has no transactions, with guidance to create one.
- **FR-016**: System MUST display the associated account name and category name for each transaction in the list.
- **FR-017**: System MUST store transaction amounts as positive integers in the smallest currency unit (piasters, cents, milligrams).
- **FR-018**: System MUST allow negative account balances (expenses can exceed the current balance).

### Key Entities

- **Transaction**: Represents a single financial event. Key attributes: type (income, expense, or transfer), amount (positive, in smallest unit), date, optional note, optional category. Each transaction belongs to exactly one user and one source account. Transfer transactions additionally reference a destination account.
- **Account** (existing): The source or destination of a transaction. Balance is updated atomically whenever a transaction is created, edited, or deleted.
- **Category** (existing): Optional classification for a transaction (e.g., Food, Salary, Transport). Categories have a type (income or expense). The UI soft-filters categories by matching type (showing matching first) but allows selecting any category.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a transaction (income, expense, or transfer) in under 30 seconds.
- **SC-002**: The transaction list loads and displays within 2 seconds, even with 1,000+ transactions.
- **SC-003**: 100% of transaction operations maintain balance consistency -- no account balance ever drifts from the sum of its transactions.
- **SC-004**: 100% of transaction operations enforce ownership -- no user can access another user's transactions.
- **SC-005**: Users see clear, actionable feedback for every validation error (missing amount, invalid account, self-transfer attempt).
- **SC-006**: Filters and pagination work correctly, returning accurate results within 1 second.
- **SC-007**: Editing or deleting a transaction correctly adjusts all affected account balances with no manual intervention.

## Assumptions

- The Transaction database model already exists in the Prisma schema (confirmed from Phase 2).
- The Category model and seeded default categories already exist (confirmed from Phase 2).
- Accounts management (Phase 3) is complete -- users can create and manage accounts.
- Authentication and protected routes are already implemented (confirmed from Phase 2).
- Transaction amounts are always stored as positive BigInt values in the smallest unit. The transaction type (income/expense/transfer) determines the direction of the balance change.
- Cross-currency transfers are allowed but no automatic conversion is performed (Phase 5 scope).
- Category selection is optional for all transaction types.
- The default page size for transaction listings is 20 items.
- Transfer transactions use a single record with both accountId (source) and transferToId (destination), not two separate records.
