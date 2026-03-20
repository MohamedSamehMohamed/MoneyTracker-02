# Implementation Issues - 004 Transactions Core

## Critical Issues

### 1. Server schema missing future date validation (T001)
**File**: [transaction.schemas.ts:9](server/src/routes/transaction.schemas.ts#L9)

The `createTransactionSchema` date field only validates format (`YYYY-MM-DD` regex) but does **not** reject future dates. The task spec explicitly requires: *"date: string YYYY-MM-DD must be today or past"*. The `updateTransactionSchema` date field has the same problem.

**Fix**: Add a `.refine()` to both schemas checking `new Date(val) <= today`.

---

### 2. Transfer without `transferToId` silently succeeds (T003)
**File**: [transaction.service.ts:95](server/src/services/transaction.service.ts#L95)

The guard `if (input.type === "transfer" && input.transferToId)` means if someone sends `type: "transfer"` **without** `transferToId`, the validation/destination check is skipped entirely. The transaction gets created with `transferToId: null` and only the source account balance is decremented -- the destination never gets incremented. Money vanishes.

**Fix**: The server schema should enforce `transferToId` as required when `type === "transfer"` via a `.superRefine()` or `.refine()`. Additionally, the service should throw a 400 error if `type === "transfer"` and `transferToId` is missing.

---

### 3. Account `include` leaks all fields (balance, userId, etc.) (T003)
**File**: [transaction.service.ts:36-39](server/src/services/transaction.service.ts#L36-L39)

The `include: { account: true, category: true, transferAccount: true }` returns the **full** Account model (including `balance`, `userId`, `createdAt`, `updatedAt`). The task spec says the response should only include `{id, name, type, currency}` for account and transferAccount. This is over-exposure of data.

**Fix**: Use `select` instead of `include: true` for account and transferAccount relations.

---

### 4. `listTransactions` query params bypass Zod validation (T004)
**File**: [transaction.controller.ts:24](server/src/controllers/transaction.controller.ts#L24)

```ts
const filters = req.query as any as ListTransactionsQuery;
```

This casts `req.query` directly. However, the validate middleware at [transaction.routes.ts:23](server/src/routes/transaction.routes.ts#L23) **does** run validation and replaces `req.query` with parsed data. So this works in practice, but the `as any` cast bypasses type safety. The validated/coerced values (e.g., `page` as number vs string) should already be in `req.query` after middleware.

**Severity**: Low -- functional but fragile.

---

### 5. Edit mode form doesn't reset when `initialData` changes (T009/T017)
**File**: [TransactionFormModal.tsx:87-99](client/src/components/transactions/TransactionFormModal.tsx#L87-L99)

The `useEffect` only resets the form when `isOpen` changes **and** `initialData` is falsy. When switching from editing Transaction A to Transaction B (both truthy), the form keeps showing Transaction A's data because `defaultValues` are only applied on initial mount.

**Fix**: Add a second `useEffect` that calls `reset(...)` when `initialData` changes:
```ts
useEffect(() => {
  if (initialData) {
    reset({ accountId: initialData.accountId, ... });
  }
}, [initialData, reset]);
```

---

### 6. Edit mode amount comparison is broken (T017)
**File**: [TransactionsPage.tsx:102](client/src/pages/TransactionsPage.tsx#L102)

```ts
if (data.amount !== undefined && data.amount !== editingTransaction.amount)
```

`data.amount` is a `number` (from the form, in human-readable format e.g. `150.00`) while `editingTransaction.amount` is a `string` (BigInt serialized, e.g. `"15000"`). This comparison will **always** be true, meaning every update sends the amount field even when unchanged, triggering unnecessary balance recalculations.

**Fix**: Convert to comparable units before comparison, or always send all changed fields without this optimization.

---

## Medium Issues

### 7. `TransactionFilters` causes infinite re-render loop
**File**: [TransactionFilters.tsx:24-26](client/src/components/transactions/TransactionFilters.tsx#L24-L26)

```ts
React.useEffect(() => {
  onFilterChange(watchFilters);
}, [watchFilters, onFilterChange]);
```

`watch()` returns a new object reference on every render. This triggers `onFilterChange` -> parent state update -> re-render -> `watch()` returns new ref -> repeat. This will either cause an infinite loop or excessive API calls depending on React batching.

**Fix**: Use `watch` with a callback subscription or compare filter values with a deep equality check before calling `onFilterChange`.

---

### 8. Filters hidden when transaction list is empty
**File**: [TransactionsPage.tsx:216-223](client/src/pages/TransactionsPage.tsx#L216-L223)

```tsx
{transactions.length > 0 && (
  <TransactionFiltersComponent ... />
)}
```

If the user applies a filter that returns 0 results, the filters disappear and they can't modify or clear them. The filters should always be visible (or at least visible once the user has active filters).

---

### 9. `TransactionList` empty state missing "Add Transaction" button
**File**: [TransactionList.tsx:22-30](client/src/components/transactions/TransactionList.tsx#L22-L30)

Task T014 specifies: *"Show empty state with message 'No transactions yet' **and 'Add Transaction' button**"*. The current empty state only shows text, no button.

---

### 10. `Account` type imported from wrong location
**File**: [TransactionsPage.tsx:3](client/src/pages/TransactionsPage.tsx#L3)

```ts
import type { Account, Category, ... } from '../types/transaction';
```

`Account` is redefined in `types/transaction.ts` as a minimal type `{id, name, type, currency}`. There's also `types/account.ts` with a different `Account` type. This dual definition could cause confusion if the types diverge. The `Account` in `types/transaction.ts` is intentionally minimal for transaction display, which is fine -- but it shadows the full Account type from `types/account.ts` in this page where `accountsApi.list()` returns the full type.

---

### 11. `NewTransactionPage` is a dead placeholder
**File**: [NewTransactionPage.tsx](client/src/pages/NewTransactionPage.tsx)

This page exists as a stub, is routed in App.tsx (`/transactions/new`), and linked in the Sidebar. The actual transaction creation was implemented via the modal in `TransactionsPage`. This dead page should be removed or replaced with a redirect.

---

### 12. Category `icon` and `color` can be null in DB but typed as required
**File**: [transaction.ts:13-14](client/src/types/transaction.ts#L13-L14)

The Prisma schema shows `icon String? @db.VarChar(50)` and `color String? @db.VarChar(7)` -- both nullable. But the client `Category` interface has `icon: string` and `color: string` (non-nullable). This will cause runtime issues when categories have null icons/colors.

**Fix**: Change to `icon: string | null` and `color: string | null`.

---

### 13. Account balance not serialized in included relations (T003)
**File**: [transaction.service.ts:8-12](server/src/services/transaction.service.ts#L8-L12)

`serializeTransaction` only converts `transaction.amount` to string. But `include: { account: true }` also loads the account's `balance` field which is also a `BigInt`. This will cause `JSON.stringify` to throw `"Do not know how to serialize a BigInt"` at runtime when Express tries to send the response.

**Fix**: Also serialize `account.balance` and optionally `transferAccount.balance`:
```ts
function serializeTransaction(transaction: any) {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    account: { ...transaction.account, balance: transaction.account.balance.toString() },
    transferAccount: transaction.transferAccount
      ? { ...transaction.transferAccount, balance: transaction.transferAccount.balance.toString() }
      : null,
  };
}
```

---

## Low Issues

### 14. No retry button on error banner (T020)
**File**: [TransactionsPage.tsx:189-193](client/src/pages/TransactionsPage.tsx#L189-L193)

Task T020 requires *"show error banner on API failures **with retry option**"*. The current error banner only displays the error text with no retry button.

---

### 15. `transactionsApi.list` skips `page=1` due to falsy check
**File**: [api.ts:100](client/src/services/api.ts#L100)

```ts
if (filters?.page) params.append("page", filters.page.toString());
```

`page: 0` would be skipped (though 0 isn't a valid page). More importantly, `page: 1` is truthy so it works. However `limit: 0` would also be skipped. This pattern is fragile -- should use `!== undefined` checks instead of truthiness.

---

### 16. Loading states not fully wired (T020)
**File**: [TransactionsPage.tsx](client/src/pages/TransactionsPage.tsx)

Task T020 specifies *"disable action buttons during pending operations"*. The "Add Transaction" button is never disabled during `isListLoading` or `isSubmitting`. The filter inputs are also not disabled during loading.

---

### 17. Duplicate `formatAmount` and `getTypeLabel` helpers
**Files**: [TransactionItem.tsx:23](client/src/components/transactions/TransactionItem.tsx#L23), [DeleteTransactionDialog.tsx:12](client/src/components/transactions/DeleteTransactionDialog.tsx#L12)

`formatAmount` and `getTypeLabel` are copy-pasted in both components. Should be extracted to a shared utility.

---

### 18. Category `type` filter in `listCategoriesHandler` not validated
**File**: [category.controller.ts:14](server/src/controllers/category.controller.ts#L14)

```ts
const { type } = req.query;
```

The `type` query param is used directly without validation. A user could pass `type=anything` and it would be sent to Prisma as a where clause, though Prisma's enum typing would likely reject it at runtime.

**Fix**: Validate that `type` is one of `income` | `expense` or ignore invalid values.
