# Accounts Management - Implementation Review Issues

**Reviewed**: 2026-03-20
**Branch**: `003-accounts-management`
**Scope**: All tasks T001-T016

---

## Critical Issues

### ISSUE-01: Gold balance formatting uses wrong decimal padding (AccountCard.tsx:27)

**File**: `client/src/components/accounts/AccountCard.tsx` line 27
**Severity**: Critical (incorrect data display)

The `formatBalance` function uses `padStart(2, '0')` for the decimal part regardless of the divisor. For gold (divisor = 1000), the remainder can be up to 3 digits, but only 2 are shown. For example, a gold balance of `1500` (1.500 grams) would show as `1.500` by luck, but `1001` (1.001 grams) would compute `wholeAmount=1`, `decimalAmount=1`, then `padStart(2,'0')` = `"01"`, displaying `1.01` instead of the correct `1.001`.

**Fix**: Use `padStart(3, '0')` when type is gold, and `padStart(2, '0')` for currencies.

---

### ISSUE-02: BigInt.toLocaleString() not supported in all environments (AccountCard.tsx:30)

**File**: `client/src/components/accounts/AccountCard.tsx` line 30
**Severity**: Critical (potential runtime error)

`BigInt.toLocaleString('en-US')` is not universally supported across all browsers/environments. Some environments will throw a `TypeError`. The whole part should be converted to `Number` or formatted manually for safety.

**Fix**: Use `Number(wholeAmount).toLocaleString('en-US')` or implement manual thousand-separator formatting.

---

### ISSUE-03: AccountFormModal does not auto-switch currency to GOLD_GRAM when gold is selected (AccountFormModal.tsx)

**File**: `client/src/components/accounts/AccountFormModal.tsx`
**Severity**: Critical (violates FR-012)

Per the spec (FR-012): "System MUST default the currency field to GOLD_GRAM when account type gold is selected." The form watches the `type` field and conditionally renders the GOLD_GRAM option (line 133), but it never programmatically sets the currency value to `GOLD_GRAM` when the user switches the type to gold. The user must manually change the currency dropdown.

Additionally, if the user selects gold type and GOLD_GRAM currency, then switches back to another type, the GOLD_GRAM option disappears from the dropdown but the form value remains `GOLD_GRAM`, which would submit an invalid/unexpected currency.

**Fix**: Use `useEffect` watching `selectedType` to call `setValue('currency', 'GOLD_GRAM')` when type becomes `'gold'`, and reset to `'EGP'` when switching away from gold if current currency is `GOLD_GRAM`.

---

## Medium Issues

### ISSUE-04: AccountFormModal uses `defaultValues` which don't update on prop change (AccountFormModal.tsx:37-51)

**File**: `client/src/components/accounts/AccountFormModal.tsx` lines 37-51
**Severity**: Medium (broken edit flow)

React Hook Form's `defaultValues` are only applied on initial mount. When `initialData` changes (e.g., user clicks edit on different accounts without unmounting the modal), the form will still show the first account's data. The `reset()` call in `handleClose` only runs on close, not when `initialData` changes.

**Fix**: Add a `useEffect` that calls `reset(...)` with the new values whenever `initialData` changes, or use `key={editingAccount?.id}` on the modal to force remount.

---

### ISSUE-05: DeleteAccountDialog has a hardcoded `isLoading = false` (DeleteAccountDialog.tsx:20)

**File**: `client/src/components/accounts/DeleteAccountDialog.tsx` line 20
**Severity**: Medium (poor UX)

`const isLoading = false;` is hardcoded, so the delete button never shows "Deleting..." and the user can click it multiple times during the async operation. This can cause duplicate delete requests.

**Fix**: Either accept `isLoading` as a prop from the parent, or manage internal loading state within `handleConfirm` using `useState`.

---

### ISSUE-06: `createAccountSchema` does not validate currency against allowed values (account.schemas.ts:6)

**File**: `server/src/routes/account.schemas.ts` line 6
**Severity**: Medium (weak server validation)

The `currency` field is validated as `z.string().max(10)` but does not enforce the allowed values (EGP, USD, EUR, GOLD_GRAM). Any arbitrary string up to 10 characters would pass validation.

**Fix**: Use `z.enum(["EGP", "USD", "EUR", "GOLD_GRAM"])` or at minimum `z.string().min(1).max(10)` (currently missing `min(1)` too, allowing empty string).

---

### ISSUE-07: `updateAccount` service performs two database queries (account.service.ts:41-56)

**File**: `server/src/services/account.service.ts` lines 41-56
**Severity**: Medium (unnecessary DB round-trip)

The update function first does `findUnique` to verify ownership, then `update`. This could be a single query using Prisma's `updateMany` with a `where: { id: accountId, userId }` clause, or use a single `update` wrapped in a try-catch for the not-found case.

**Fix**: Consider using `prisma.account.updateMany({ where: { id: accountId, userId }, data: ... })` and checking `count === 0` for the not-found case, or accept the two-query approach as intentional for clarity.

---

## Low Issues

### ISSUE-08: `accountsApi` methods are not typed with the client-side types (api.ts:69-88)

**File**: `client/src/services/api.ts` lines 69-88
**Severity**: Low (type safety gap)

The `accountsApi` object defines inline types for `create` and `update` parameters instead of using the `CreateAccountInput` and `UpdateAccountInput` types from `client/src/types/account.ts`. The `list` return type is `any`.

**Fix**: Import and use the client-side types: `create: (data: CreateAccountInput) => ...`, `list: () => apiFetch<{ accounts: Account[] }>(...)`.

---

### ISSUE-09: `Content-Type: application/json` is set even for DELETE requests with no body (api.ts:21)

**File**: `client/src/services/api.ts` line 21
**Severity**: Low (minor)

The `apiFetch` function always sets `Content-Type: application/json`, even for DELETE/GET requests that have no body. While generally harmless, it's unnecessary and some strict proxies/servers may behave unexpectedly.

---

### ISSUE-10: Delete error toast has no auto-dismiss or close button (AccountsPage.tsx:152-156)

**File**: `client/src/pages/AccountsPage.tsx` lines 152-156
**Severity**: Low (UX)

The `deleteError` banner at the bottom-right has no close button and no auto-dismiss timeout. Once an error appears, it stays forever (until a successful delete clears the state or the user navigates away).

**Fix**: Add a close button and/or `setTimeout` to auto-dismiss after a few seconds.

---

### ISSUE-11: No keyboard handling for modal dismissal (AccountFormModal.tsx, DeleteAccountDialog.tsx)

**File**: `client/src/components/accounts/AccountFormModal.tsx`, `client/src/components/accounts/DeleteAccountDialog.tsx`
**Severity**: Low (accessibility)

Neither modal handles Escape key to close or click-outside-to-dismiss. This is a common UX/accessibility expectation for modals.

---

### ISSUE-12: Redundant error handling in `createAccountHandler` (account.controller.ts:38-43)

**File**: `server/src/controllers/account.controller.ts` lines 38-43
**Severity**: Low (dead code)

The `createAccountHandler` catches `statusCode === 400` errors, but the `createAccount` service function never throws a 400 error. The only service functions that throw 400 are `deleteAccount` (non-zero balance) and potentially `updateAccount`. This catch block is unreachable dead code.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3     |
| Medium   | 4     |
| Low      | 5     |
| **Total**| **12**|

### Recommended Fix Priority
1. ISSUE-01 (gold formatting) - incorrect data display
2. ISSUE-03 (gold currency auto-select) - spec violation
3. ISSUE-02 (BigInt.toLocaleString) - potential runtime crash
4. ISSUE-04 (form defaultValues stale) - broken edit flow
5. ISSUE-05 (delete loading state) - double-click risk
6. ISSUE-06 (currency validation) - weak server validation
