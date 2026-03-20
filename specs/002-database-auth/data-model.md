# Data Model: Database & Authentication

**Feature**: 002-database-auth | **Date**: 2026-03-20

## Entities

### User

| Field         | Type         | Constraints                          |
|---------------|--------------|--------------------------------------|
| id            | UUID         | Primary key, auto-generated          |
| name          | String(100)  | Required                             |
| email         | String(255)  | Required, unique, valid email format |
| password      | String(255)  | Required, bcrypt hash                |
| baseCurrency  | String(3)    | Default: "EGP"                       |
| createdAt     | DateTime     | Auto-set on creation                 |
| updatedAt     | DateTime     | Auto-updated on modification         |

**Relationships**: One-to-many with Account, Transaction, Category

### Account

| Field      | Type                              | Constraints                                     |
|------------|-----------------------------------|-------------------------------------------------|
| id         | UUID                              | Primary key, auto-generated                     |
| userId     | UUID                              | Foreign key -> User, required                   |
| name       | String(100)                       | Required (e.g., "Cash EGP", "NBE Bank")         |
| type       | Enum(cash, bank, wallet, gold)    | Required                                        |
| currency   | String(10)                        | Required (e.g., "EGP", "USD", "GOLD_GRAM")      |
| balance    | BigInt                            | Default: 0, smallest unit (piasters/cents/grams) |
| icon       | String(50)                        | Optional                                        |
| createdAt  | DateTime                          | Auto-set on creation                             |
| updatedAt  | DateTime                          | Auto-updated on modification                     |

**Relationships**: Belongs to User. One-to-many with Transaction (as source). One-to-many with Transaction (as transfer destination).

### Transaction

| Field         | Type                              | Constraints                            |
|---------------|-----------------------------------|----------------------------------------|
| id            | UUID                              | Primary key, auto-generated            |
| userId        | UUID                              | Foreign key -> User, required          |
| accountId     | UUID                              | Foreign key -> Account, required       |
| type          | Enum(income, expense, transfer)   | Required                               |
| amount        | BigInt                            | Required, positive value, smallest unit |
| categoryId    | UUID                              | Foreign key -> Category, optional      |
| note          | Text                              | Optional                               |
| date          | Date                              | Required                               |
| transferToId  | UUID                              | Foreign key -> Account, optional       |
| createdAt     | DateTime                          | Auto-set on creation                   |
| updatedAt     | DateTime                          | Auto-updated on modification           |

**Relationships**: Belongs to User, Account (source), optionally Category and Account (destination for transfers).

**Rules**:
- `transferToId` is required when `type` is "transfer", null otherwise
- `amount` is always positive; the transaction `type` determines debit/credit behavior
- `categoryId` is optional for transfers

### Category

| Field   | Type                       | Constraints                                       |
|---------|----------------------------|---------------------------------------------------|
| id      | UUID                       | Primary key, auto-generated                       |
| userId  | UUID                       | Foreign key -> User, optional (null = system default) |
| name    | String(50)                 | Required (e.g., "Food", "Salary", "Rent")          |
| type    | Enum(income, expense)      | Required                                          |
| icon    | String(50)                 | Optional                                          |
| color   | String(7)                  | Optional, hex color (e.g., "#FF5733")              |

**Relationships**: Optionally belongs to User (null userId = system-level). One-to-many with Transaction.

**Rules**:
- System categories (userId = null) cannot be edited or deleted by users
- User categories can only be deleted if no transactions reference them

### ExchangeRate

| Field        | Type         | Constraints                        |
|--------------|--------------|------------------------------------|
| id           | UUID         | Primary key, auto-generated        |
| fromCurrency | String(10)   | Required (e.g., "USD", "GOLD_GRAM") |
| toCurrency   | String(10)   | Required, always "EGP"             |
| rate         | Decimal(18,6)| Required                           |
| fetchedAt    | DateTime     | Required                           |
| source       | String(50)   | Required (API name)                |

**Rules**:
- Only the most recent rate per currency pair is used for conversions
- Created in this phase but populated in Phase 5

## Default Seed Data

### System Categories

**Expense categories**:
- Food (#FF6B6B), Transport (#4ECDC4), Rent (#45B7D1), Entertainment (#96CEB4), Shopping (#FFEAA7), Health (#DDA0DD), Utilities (#87CEEB), Education (#F0E68C), Other (#C0C0C0)

**Income categories**:
- Salary (#2ECC71), Freelance (#27AE60), Investment (#3498DB), Gift (#E74C3C), Other (#95A5A6)

## Entity Relationship Diagram (text)

```
User 1──* Account
User 1──* Transaction
User 1──* Category (user-created)
Account 1──* Transaction (as source)
Account 1──* Transaction (as transfer destination)
Category 1──* Transaction
ExchangeRate (standalone, no user relationship)
```
