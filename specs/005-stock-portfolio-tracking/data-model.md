# Data Model: Stock Portfolio Tracking

**Feature**: 005-stock-portfolio-tracking
**Date**: 2026-03-20

## New Entities

### StockTransaction

Represents a single stock buy or sell event.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique identifier |
| userId | UUID | FK → User.id, NOT NULL | Owner of this transaction |
| type | StockTransactionType | NOT NULL | `buy` or `sell` |
| company | String(100) | NOT NULL | Company name or ticker (free-text, exact match for grouping) |
| shares | Decimal(18,8) | NOT NULL, > 0 | Number of shares (supports fractional) |
| pricePerShare | Decimal(18,2) | NOT NULL, > 0 | Price per share at time of transaction |
| currency | String(10) | NOT NULL | Currency code (e.g., "USD", "EGP") |
| date | Date | NOT NULL, <= today | Date of the transaction |
| note | String(500) | nullable | Optional user note |
| realizedGain | Decimal(18,2) | nullable | Gain/loss for sell transactions (computed at creation, stored for display) |
| accountId | UUID | FK → Account.id, nullable | Optional linked funding account |
| createdAt | DateTime | auto, NOT NULL | Record creation timestamp |
| updatedAt | DateTime | auto, NOT NULL | Last update timestamp |

**Indexes**:
- `(userId, company)` — for portfolio aggregation queries
- `(userId, date DESC)` — for transaction history listing

**Relationships**:
- `StockTransaction.userId` → `User.id` (CASCADE on delete)
- `StockTransaction.accountId` → `Account.id` (SET NULL on delete)

### StockTransactionType (Enum)

| Value | Description |
| ----- | ----------- |
| `buy` | Stock purchase |
| `sell` | Stock sale |

## Modified Entities

### User (existing)

Add relation:
- `stockTransactions: StockTransaction[]` — one-to-many

### Account (existing)

Add relation:
- `stockTransactions: StockTransaction[]` — one-to-many (for linked stock transactions)

## Derived Data (not stored)

### Stock Holding (computed per company)

Aggregated from StockTransaction records per user + company combination:

| Field | Computation |
| ----- | ----------- |
| company | Group key |
| currency | From transactions (enforced same per company) |
| totalShares | `SUM(shares) WHERE type=buy` - `SUM(shares) WHERE type=sell` |
| totalInvested | `SUM(shares * pricePerShare) WHERE type=buy` - `SUM(shares * pricePerShare) WHERE type=sell` |
| averageCost | `totalInvested / totalShares` (only from active buy positions) |
| totalRealizedGain | `SUM(realizedGain) WHERE type=sell` |

**Note**: Holdings are computed on-the-fly, not stored as a separate table. This avoids consistency issues when transactions are edited or deleted.

## Validation Rules

1. **Company currency consistency**: All transactions for the same `(userId, company)` must have the same `currency`. Enforced at application level before insert.
2. **Sell quantity limit**: A sell transaction's `shares` must not exceed the net shares held (`total bought - total sold`) for that company. Checked inside a database transaction.
3. **Date constraint**: `date <= today` (same pattern as existing transactions).
4. **Positive values**: `shares > 0` and `pricePerShare > 0`.
5. **Edit constraints**: After creation, `company` and `type` fields are immutable. Only `shares`, `pricePerShare`, `note`, and `date` can be updated.
6. **Account currency match**: If `accountId` is provided, the stock transaction's `currency` must match the linked account's `currency`.

## Prisma Schema Addition

```prisma
model StockTransaction {
  id              String                @id @default(uuid())
  userId          String
  type            StockTransactionType
  company         String                @db.VarChar(100)
  shares          Decimal               @db.Decimal(18, 8)
  pricePerShare   Decimal               @db.Decimal(18, 2)
  currency        String                @db.VarChar(10)
  date            DateTime              @db.Date
  note            String?               @db.VarChar(500)
  realizedGain    Decimal?              @db.Decimal(18, 2)
  accountId       String?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  // Relations
  user            User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  account         Account?              @relation(fields: [accountId], references: [id], onDelete: SetNull)

  @@index([userId, company])
  @@index([userId, date(sort: Desc)])
  @@map("stock_transactions")
}

enum StockTransactionType {
  buy
  sell
}
```
