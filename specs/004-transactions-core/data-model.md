# Data Model: Transactions (Core Feature)

**Feature**: 004-transactions-core
**Date**: 2026-03-20

## Entities

### Transaction (existing -- no schema changes needed)

| Field        | Type            | Constraints                           | Notes                                    |
|--------------|-----------------|---------------------------------------|------------------------------------------|
| id           | UUID            | PK, auto-generated                    |                                          |
| userId       | UUID            | FK -> users.id, NOT NULL              | Ownership enforcement                    |
| accountId    | UUID            | FK -> accounts.id, NOT NULL           | Source account (immutable after creation) |
| type         | TransactionType | NOT NULL, enum                        | income, expense, transfer (immutable)    |
| amount       | BIGINT          | NOT NULL, must be positive            | Smallest unit (piasters/cents/mg)        |
| categoryId   | UUID            | FK -> categories.id, nullable         | Optional category classification         |
| note         | TEXT            | nullable                              | User-provided description                |
| date         | DATE            | NOT NULL                              | Must be today or in the past             |
| transferToId | UUID            | FK -> accounts.id, nullable           | Destination account (transfers only)     |
| createdAt    | TIMESTAMP       | auto-generated                        |                                          |
| updatedAt    | TIMESTAMP       | auto-updated                          |                                          |

### TransactionType Enum (existing)

- `income` -- adds to account balance
- `expense` -- deducts from account balance
- `transfer` -- deducts from source, adds to destination

### Account (existing -- no changes, balance updated via transactions)

Relevant fields for this feature:
- `balance` (BIGINT): Updated atomically on transaction create/edit/delete
- `currency` (VARCHAR): Used for display formatting (piasters vs milligrams)
- `type` (AccountType): Used for display formatting (gold vs currency)

### Category (existing -- no changes, queried for transaction form)

Relevant fields for this feature:
- `id`, `name`, `type` (CategoryType: income/expense), `icon`, `color`
- `userId` (nullable): null = system default, non-null = user custom
- Used in soft-filter: matching transaction type shown first

## Relationships

- User 1:N Transaction (cascade delete on user deletion)
- Account 1:N Transaction via `accountId` (cascade delete on account deletion)
- Account 1:N Transaction via `transferToId` (set null on account deletion)
- Category 1:N Transaction (set null on category deletion)

## Validation Rules

| Field        | Rule                                                              |
|--------------|-------------------------------------------------------------------|
| accountId    | Required, must exist and belong to the authenticated user         |
| type         | Required, must be one of: income, expense, transfer               |
| amount       | Required, must be a positive integer (> 0)                        |
| categoryId   | Optional, must exist if provided                                  |
| note         | Optional, max 500 characters                                      |
| date         | Required, must be today or in the past (no future dates)          |
| transferToId | Required if type is transfer, must not equal accountId            |

## Business Rules

### Balance Updates (atomic via database transaction)

| Operation        | Source Account Effect  | Destination Account Effect |
|------------------|-----------------------|----------------------------|
| Create income    | balance += amount     | N/A                        |
| Create expense   | balance -= amount     | N/A                        |
| Create transfer  | balance -= amount     | balance += amount          |
| Edit amount      | Reverse old + apply new on source (and dest for transfers) | |
| Delete income    | balance -= amount     | N/A                        |
| Delete expense   | balance += amount     | N/A                        |
| Delete transfer  | balance += amount     | balance -= amount          |

### Edit Constraints
- Only amount, category, note, and date are editable
- Type and account (accountId, transferToId) are immutable after creation
- Editing amount triggers atomic balance recalculation (reverse old, apply new)

### Ownership & Access
- All CRUD operations enforce userId ownership
- Transactions can only reference accounts owned by the same user
- Transfer destination must also belong to the same user

### Pagination
- Default page size: 20 items
- Response includes total count for pagination controls
- Sorted by date descending (newest first), then by createdAt descending as tiebreaker
