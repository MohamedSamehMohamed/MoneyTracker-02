# Data Model: Accounts Management

**Feature**: 003-accounts-management
**Date**: 2026-03-20

## Entities

### Account (existing — no schema changes needed)

| Field     | Type        | Constraints                        | Notes                              |
|-----------|-------------|------------------------------------|------------------------------------|
| id        | UUID        | PK, auto-generated                 |                                    |
| userId    | UUID        | FK -> users.id, NOT NULL           | Ownership enforcement              |
| name      | VARCHAR(100)| NOT NULL                           | User-provided label                |
| type      | AccountType | NOT NULL, enum                     | cash, bank, wallet, gold           |
| currency  | VARCHAR(10) | NOT NULL                           | EGP, USD, EUR, GOLD_GRAM           |
| balance   | BIGINT      | NOT NULL, default 0                | Smallest unit (piasters/cents/mg)  |
| icon      | VARCHAR(50) | nullable                           | Optional icon identifier           |
| createdAt | TIMESTAMP   | auto-generated                     |                                    |
| updatedAt | TIMESTAMP   | auto-updated                       |                                    |

### AccountType Enum (existing)

- `cash`
- `bank`
- `wallet`
- `gold`

## Relationships

- User 1:N Account (cascade delete on user deletion)
- Account 1:N Transaction via `sourceTransactions` (cascade delete on account deletion)
- Account 1:N Transaction via `transferTransactions` (set null on account deletion)

## Validation Rules

| Field    | Rule                                                       |
|----------|------------------------------------------------------------|
| name     | Required, 1-100 characters                                 |
| type     | Required, must be one of: cash, bank, wallet, gold         |
| currency | Required, must be a supported currency string              |
| icon     | Optional, max 50 characters                                |

## Business Rules

- Balance starts at 0 on creation; modified only via transactions (Phase 4)
- Account can only be deleted when balance === 0 (BigInt comparison)
- Users can create multiple accounts with the same name, type, or currency
- All CRUD operations enforce userId ownership
- Deletion cascades to associated transactions
