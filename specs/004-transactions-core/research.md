# Research: Transactions (Core Feature)

**Feature**: 004-transactions-core
**Date**: 2026-03-20

## Existing Infrastructure

### Decision: Follow existing module patterns (schemas -> routes -> controller -> service)
- **Rationale**: The codebase has a clear pattern established in auth and accounts modules. Following it ensures consistency.
- **Alternatives considered**: Adding a repository layer, using class-based controllers. Rejected -- unnecessary abstraction for this scope.

### Decision: Use existing Prisma Transaction model as-is
- **Rationale**: The Transaction model (schema.prisma lines 56-76) already defines all needed fields: id, userId, accountId, type (TransactionType enum), amount (BigInt), categoryId, note, date, transferToId, timestamps. No schema changes needed.
- **Alternatives considered**: Adding a `status` field for pending transactions, adding a `description` field. Rejected -- not in spec requirements; YAGNI.

### Decision: Use Prisma interactive transactions for balance atomicity
- **Rationale**: Creating/editing/deleting transactions must atomically update account balances. Prisma's `$transaction` API provides a single database transaction that rolls back on failure, ensuring balance consistency.
- **Alternatives considered**: Sequential queries with manual rollback, database triggers. Rejected -- Prisma `$transaction` is the idiomatic approach and simpler to maintain.

### Decision: Offset-based pagination
- **Rationale**: Transaction lists use `page` + `limit` parameters (offset-based). This is simple, well-understood, and adequate for the expected scale (thousands of records). The client can display page numbers.
- **Alternatives considered**: Cursor-based pagination. Rejected -- adds complexity with no practical benefit at this scale; cursor-based is better for infinite scroll which isn't in scope.

### Decision: BigInt balance formatting follows accounts pattern
- **Rationale**: Same approach as accounts -- server converts BigInt to string, client handles display formatting (dividing by 100 for currencies, 1000 for gold).
- **Alternatives considered**: Server-side formatting. Rejected -- client needs raw values; formatting is a presentation concern.

### Decision: Type and account are immutable after creation
- **Rationale**: Per clarification, editing a transaction's type or account is not allowed. This avoids complex balance recalculation across multiple accounts (e.g., changing from transfer to expense).
- **Alternatives considered**: Full mutability. Rejected -- the complexity of reversing a transfer and applying an expense to a different account is disproportionate to the value; users can delete and recreate.

### Decision: Soft-filter categories by transaction type
- **Rationale**: Per clarification, the category dropdown shows matching-type categories first (income categories for income transactions, expense categories for expenses) but allows selecting any category.
- **Alternatives considered**: Strict enforcement (only matching type). Rejected -- too rigid for edge cases like refunds.

### Decision: Date validation rejects future dates
- **Rationale**: Per clarification, transaction dates must be today or in the past. Scheduled/recurring transactions are Phase 10 scope.
- **Alternatives considered**: Allowing future dates with immediate balance impact. Rejected -- confuses balance accuracy with scheduling.

## Technology Choices

### Server-side
- **Prisma $transaction** for atomic balance updates (already available)
- **Zod** for request validation with date coercion (already installed, v4.3.6)
- **Express Router** with auth middleware (existing pattern)
- No new dependencies needed

### Client-side
- **React Hook Form + Zod** for transaction form (already installed)
- **apiFetch** utility for API calls (existing in services/api.ts)
- Date input using native HTML date picker (no additional library)
- No new dependencies needed

## Key Implementation Notes

### Balance Update Logic

```
Income:  account.balance += amount
Expense: account.balance -= amount
Transfer:
  sourceAccount.balance -= amount
  destAccount.balance   += amount
```

On edit (amount change only, type/account locked):
```
oldEffect = computeEffect(oldType, oldAmount)
newEffect = computeEffect(newType, newAmount)
account.balance += (newEffect - oldEffect)
```

On delete:
```
Reverse the original effect (negate the balance change)
```

### Filter Query Strategy

All filters are optional and combine with AND logic:
- `accountId`: exact match
- `categoryId`: exact match
- `type`: exact match (income/expense/transfer)
- `dateFrom` / `dateTo`: range filter on `date` field
- Pagination: `page` (default 1) + `limit` (default 20)

Response includes `total` count for pagination UI.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Balance drift from non-atomic updates | All balance changes wrapped in Prisma `$transaction` |
| BigInt serialization in JSON responses | Convert to string in service layer (same as accounts) |
| Concurrent transaction creation race | Prisma `$transaction` with serializable isolation level if needed |
| Large transaction lists slow to load | Offset pagination with default 20/page; DB index on (userId, date) already implicit via queries |
| Transfer to deleted account | transferToId uses `onDelete: SetNull` -- transfer record preserved, destination link becomes null |
