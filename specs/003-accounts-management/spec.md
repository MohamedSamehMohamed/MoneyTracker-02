# Feature Specification: Accounts Management

**Feature Branch**: `003-accounts-management`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "i wanna implement ph3"

## Clarifications

### Session 2026-03-20

- Q: What happens to associated transactions when an account is deleted (zero balance)? → A: Transactions are cascade-deleted along with the account (matches existing schema behavior).
- Q: Are currency options restricted by account type? → A: No restrictions — all account types can use any supported currency (EGP, USD, EUR, GOLD_GRAM). Gold accounts still auto-suggest GOLD_GRAM but users can override.

## User Scenarios & Testing

### User Story 1 - Create a New Account (Priority: P1)

A logged-in user wants to add a new money source (e.g., "Cash EGP", "NBE Bank", "Vodafone Cash", "Gold Savings") so they can start tracking their finances across different sources. They select the account type (cash, bank, wallet, or gold), choose the appropriate currency, give it a name, and optionally pick an icon.

**Why this priority**: Without accounts, no financial tracking is possible. This is the foundational action for the entire app.

**Independent Test**: Can be fully tested by creating an account and verifying it appears in the accounts list with correct details.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Accounts page, **When** they click "Add Account" and fill in name ("Cash EGP"), type (cash), and currency (EGP), **Then** the account is created and appears in the accounts list with a zero balance.
2. **Given** an authenticated user creating a new account, **When** they select type "gold", **Then** the currency field defaults to "GOLD_GRAM" but can be changed to any supported currency.
3. **Given** an authenticated user creating a new account, **When** they submit the form with a missing required field (name or type), **Then** the system shows a validation error and does not create the account.

---

### User Story 2 - View All Accounts with Balances (Priority: P1)

A logged-in user wants to see all their accounts at a glance, including account name, type, currency, and current balance, so they can understand where their money is distributed.

**Why this priority**: Viewing accounts is the most frequent interaction and essential for financial awareness. Tied with creation as the core experience.

**Independent Test**: Can be fully tested by viewing the accounts list after creating one or more accounts, verifying all details display correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated user with multiple accounts, **When** they navigate to the Accounts page, **Then** all accounts are displayed with name, type icon, currency, and formatted balance.
2. **Given** an authenticated user with no accounts, **When** they navigate to the Accounts page, **Then** they see an empty state with a prompt to create their first account.
3. **Given** an authenticated user, **When** they view an account with a balance of 150000 piasters, **Then** the balance is displayed as "1,500.00 EGP" (formatted for human readability).

---

### User Story 3 - Edit an Account (Priority: P2)

A user wants to update an account's name or icon to better organize their financial sources. For example, renaming "Bank Account" to "NBE Savings" or changing the icon.

**Why this priority**: Important for personalization but not blocking core functionality.

**Independent Test**: Can be fully tested by editing an account's name and verifying the change persists.

**Acceptance Scenarios**:

1. **Given** an authenticated user with an existing account, **When** they edit the account name from "Bank" to "NBE Savings", **Then** the updated name is saved and displayed.
2. **Given** an authenticated user editing an account, **When** they change the icon, **Then** the new icon is saved and displayed in the accounts list.
3. **Given** an authenticated user, **When** they attempt to edit an account that belongs to another user, **Then** the system denies the request.

---

### User Story 4 - Delete an Account (Priority: P3)

A user wants to remove an account they no longer use. To prevent accidental data loss, accounts can only be deleted when their balance is zero. Deleting an account also removes all associated transactions (cascade delete).

**Why this priority**: Deletion is a less frequent action and has a guard (zero balance requirement) that depends on transactions being properly managed first.

**Independent Test**: Can be fully tested by attempting to delete an account with zero balance (succeeds) and non-zero balance (fails with clear message).

**Acceptance Scenarios**:

1. **Given** an authenticated user with an account that has a zero balance, **When** they delete the account, **Then** the account and all its associated transactions are removed and no longer appear in the system.
2. **Given** an authenticated user with an account that has a non-zero balance, **When** they attempt to delete it, **Then** the system shows an error message explaining the account must have a zero balance before deletion.
3. **Given** an authenticated user, **When** they click delete, **Then** a confirmation dialog appears (warning that associated transactions will also be deleted) before the account is actually removed.

---

### Edge Cases

- What happens when a user tries to create an account with a duplicate name? The system allows it — users may have multiple accounts with the same name.
- What happens when a user tries to delete an account that has associated transactions? If the balance is zero, the account and all associated transactions are cascade-deleted.
- How does the system handle very large balances (e.g., billions of piasters)? The display formats large numbers with appropriate thousand separators.
- What happens if the user's session expires while editing an account? The system redirects to login.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to create accounts with a name, type (cash, bank, wallet, gold), and currency (any supported currency for any account type).
- **FR-002**: System MUST display all of a user's accounts with their name, type, currency, current balance, and icon.
- **FR-003**: System MUST allow users to update an account's name and icon.
- **FR-004**: System MUST allow users to delete an account only when its balance is zero. Deletion cascade-removes all associated transactions.
- **FR-005**: System MUST show a clear error message when a user attempts to delete an account with a non-zero balance.
- **FR-006**: System MUST validate all account input (name is required, type must be one of: cash, bank, wallet, gold, currency must be a supported value).
- **FR-007**: System MUST ensure users can only view, edit, and delete their own accounts (ownership enforcement).
- **FR-008**: System MUST format balances for display in human-readable form (e.g., piasters to EGP with two decimal places).
- **FR-009**: System MUST display appropriate icons or visual indicators for each account type (cash, bank, wallet, gold).
- **FR-010**: System MUST show an empty state when a user has no accounts, with guidance to create one.
- **FR-011**: System MUST show a confirmation dialog before deleting an account, warning that associated transactions will also be removed.
- **FR-012**: System MUST default the currency field to "GOLD_GRAM" when account type "gold" is selected, while still allowing the user to choose a different currency.

### Key Entities

- **Account**: Represents a single money source owned by a user. Key attributes: name, type (cash/bank/wallet/gold), currency (any supported currency — EGP, USD, EUR, GOLD_GRAM), balance (stored in smallest unit), and optional icon. Each account belongs to exactly one user. Deleting an account cascade-deletes its transactions.
- **User**: The owner of accounts. A user can have multiple accounts of any type and currency combination.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a new account in under 30 seconds.
- **SC-002**: The accounts list loads and displays all accounts within 2 seconds.
- **SC-003**: 100% of account operations (create, read, update, delete) enforce ownership — no user can access another user's accounts.
- **SC-004**: Users see clear, actionable feedback for every validation error (missing name, invalid type, non-zero balance on delete).
- **SC-005**: Account balances are displayed in correctly formatted, human-readable form with appropriate currency symbols.

## Assumptions

- The Account database model already exists in the Prisma schema (confirmed from Phase 2).
- Authentication and protected routes are already implemented (confirmed from Phase 2).
- Supported account types are: cash, bank, wallet, gold (as defined in the AccountType enum).
- Supported currencies include at minimum: EGP, USD, EUR, GOLD_GRAM. All currencies are available for all account types.
- Balances are stored in the smallest unit (piasters for EGP, cents for USD/EUR, milligrams for gold) to avoid floating-point issues.
- Account balances start at zero on creation and are modified only through transactions (Phase 4).
- Users may create multiple accounts of the same type and currency.
- Account deletion uses cascade delete for associated transactions (existing schema behavior).
