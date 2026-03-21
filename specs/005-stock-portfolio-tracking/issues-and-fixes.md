# Stock Portfolio Tracking - Issues & Fixes

Comprehensive review of the 005-stock-portfolio-tracking implementation. Each issue includes the exact file, line numbers, problem description, and the fix to apply.

---

## CRITICAL Issues

### Issue 1: `updateStockTransaction` does NOT adjust linked account balance

**File:** `server/src/services/stock.service.ts` lines 226-293

**Problem:** When a user edits shares or pricePerShare on a stock transaction that is linked to an account, the account balance is never adjusted. The `createStockTransaction` (line 117-132) correctly adjusts balances, and `deleteStockTransaction` (line 309-333) correctly reverses them, but `updateStockTransaction` does nothing.

Example: Buy 10 shares @ $100 linked to account (balance -$1000). Edit to 20 shares @ $100. Account balance stays at -$1000 instead of -$2000.

**Fix:** Wrap the update in `prisma.$transaction` and calculate the balance difference:

```typescript
export async function updateStockTransaction(
  userId: string,
  transactionId: string,
  input: UpdateStockTransactionInput
) {
  const transaction = await prisma.stockTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    const error = new Error("Stock transaction not found") as any;
    error.statusCode = 404;
    throw error;
  }

  const updateData: any = {};
  if (input.shares !== undefined) updateData.shares = new Decimal(input.shares.toString());
  if (input.pricePerShare !== undefined)
    updateData.pricePerShare = new Decimal(input.pricePerShare.toString());
  if (input.note !== undefined) updateData.note = input.note;
  if (input.date !== undefined)
    updateData.date = new Date(input.date + "T00:00:00Z");

  // If it's a sell and shares/price changed, recalculate realized gain
  if (transaction.type === "sell" && (input.shares !== undefined || input.pricePerShare !== undefined)) {
    const avgCost = await calculateAverageCost(userId, transaction.company);
    const shares = input.shares ? new Decimal(input.shares.toString()) : transaction.shares;
    const price = input.pricePerShare ? new Decimal(input.pricePerShare.toString()) : transaction.pricePerShare;
    updateData.realizedGain = shares.times(price.minus(avgCost));

    // Validate sell quantity
    if (input.shares !== undefined) {
      const heldShares = await calculateHeldShares(userId, transaction.company, undefined, transactionId);
      const newSellShares = new Decimal(input.shares.toString());

      if (newSellShares.greaterThan(heldShares)) {
        const error = new Error(
          `Cannot sell ${input.shares} shares: Only ${heldShares.toString()} shares held`
        ) as any;
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Adjust linked account balance if shares or price changed
    if (transaction.accountId && (input.shares !== undefined || input.pricePerShare !== undefined)) {
      const oldShares = transaction.shares;
      const oldPrice = transaction.pricePerShare;
      const newShares = input.shares ? new Decimal(input.shares.toString()) : oldShares;
      const newPrice = input.pricePerShare ? new Decimal(input.pricePerShare.toString()) : oldPrice;

      const oldTotal = oldShares.times(oldPrice).times(100);
      const newTotal = newShares.times(newPrice).times(100);
      const diff = newTotal.minus(oldTotal);

      if (!diff.isZero()) {
        if (transaction.type === "buy") {
          // Buy: more shares/higher price means more deducted from account
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: diff.toNumber() } },
          });
        } else if (transaction.type === "sell") {
          // Sell: more shares/higher price means more added to account
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: diff.toNumber() } },
          });
        }
      }
    }

    return await tx.stockTransaction.update({
      where: { id: transactionId },
      data: updateData,
      select: {
        id: true, userId: true, type: true, company: true,
        shares: true, pricePerShare: true, currency: true, date: true,
        note: true, realizedGain: true, accountId: true,
        createdAt: true, updatedAt: true,
      },
    });
  });

  return serializeStockTransaction(updated);
}
```

---

### Issue 2: Portfolio `totalInvested` calculation is wrong

**File:** `server/src/services/stock.service.ts` line 390

**Problem:** `totalInvested` is calculated as `totalBuyValue - totalSellValue`, which gives the net cash outflow, not the cost basis of remaining shares.

Example: Buy 100 @ $10 ($1000), sell 50 @ $20 ($1000). Current calc: $1000 - $1000 = $0. But user still holds 50 shares worth $500 at cost.

**Fix:** Change line 390 to calculate based on remaining shares:

```typescript
// Replace line 390:
// const totalInvested = totalBuyValue.minus(totalSellValue);

// With:
const totalInvested = totalShares.times(averageCostPerShare);
```

This correctly shows the cost basis of currently held shares.

---

### Issue 3: Portfolio `totalRealizedGain` is recalculated instead of using stored values

**File:** `server/src/services/stock.service.ts` lines 403-408

**Problem:** The portfolio recalculates realized gain using current average cost for ALL sells. But `realizedGain` is already computed and stored on each sell transaction at the time of sale. The recalculation may differ from stored values if new buys changed the average cost.

**Fix:** Store the `realizedGain` from each sell transaction and sum those instead:

```typescript
// In the holdings aggregation loop (around line 356-366), also collect realizedGain:
if (tx.type === "sell") {
  holdings[tx.company].sells.push({
    shares: tx.shares,
    pricePerShare: tx.pricePerShare,
    realizedGain: tx.realizedGain,
  });
}

// Then replace lines 403-409 with:
totalRealizedGain: data.sells
  .reduce(
    (sum: Decimal, s: any) =>
      sum.plus(s.realizedGain || new Decimal(0)),
    new Decimal(0)
  )
  .toString(),
```

---

### Issue 4: Sell validation is outside the `prisma.$transaction` - race condition

**File:** `server/src/services/stock.service.ts` lines 61-72

**Problem:** The oversell check at lines 61-72 runs BEFORE `prisma.$transaction` starts at line 75. Two concurrent sell requests could both pass validation, then both execute, resulting in negative shares.

**Fix:** Move the sell validation inside the `prisma.$transaction` block:

```typescript
const transaction = await prisma.$transaction(async (tx) => {
  // Move sell validation inside transaction
  if (input.type === "sell") {
    const heldShares = await calculateHeldShares(userId, input.company, tx);
    const sellShares = new Decimal(input.shares.toString());

    if (sellShares.greaterThan(heldShares)) {
      const error = new Error(
        `Cannot sell ${input.shares} shares: Only ${heldShares.toString()} shares held`
      ) as any;
      error.statusCode = 400;
      throw error;
    }
  }

  let realizedGain = null;
  // ... rest of transaction body
});
```

Also move the currency consistency check (lines 44-58) inside the transaction for the same reason.

---

## HIGH Issues

### Issue 5: `StockTransactionItem` and `StockPortfolioCard` duplicate formatters instead of importing from utils

**File:** `client/src/components/stocks/StockTransactionItem.tsx` lines 20-27, `client/src/components/stocks/StockPortfolioCard.tsx` lines 13-21

**Problem:** Both components define local `formatNumber` and `formatShares` functions instead of importing from `client/src/utils/formatters.ts` which already has `formatCurrency`, `formatShares`, `formatPrice`, `formatDate`, and `formatCurrencyValue`.

**Fix for `StockTransactionItem.tsx`:** Remove local functions and add imports:

```typescript
import { formatShares, formatPrice, formatCurrencyValue, formatDate } from '../../utils/formatters';
```

Then replace usages:
- `formatNumber(price)` -> `formatPrice(price)`
- `formatShares(shares)` -> already matches, just import it
- `formatNumber(totalValue)` -> `formatCurrency(totalValue)` (import `formatCurrency`)
- `formatNumber(realizedGain)` -> `formatCurrency(realizedGain)`
- `new Date(transaction.date).toLocaleDateString()` -> `formatDate(transaction.date)`

**Fix for `StockPortfolioCard.tsx`:** Same approach - remove local functions, import from utils.

---

### Issue 6: Form modal closes itself AND parent closes it - double close logic

**File:** `client/src/components/stocks/StockTransactionFormModal.tsx` lines 92-109 and `client/src/pages/StocksPage.tsx` lines 85-101

**Problem:** On form submit, the modal calls `reset()` and `onClose()` at lines 104-105 inside `handleFormSubmit`. But the parent `handleFormSubmit` at StocksPage line 95-96 also sets `isFormOpen(false)` and `editingTransaction(null)`. If the parent's `onSubmit` throws (which it re-throws from API errors), the modal's catch block at line 106 catches it silently, but the parent already set `submitError`. The modal then calls `onClose()` even on error because it's after the `await`.

Wait - actually looking more carefully: the modal `await`s `onSubmit`, and if it throws, it goes to catch. So `reset()` and `onClose()` at 104-105 are only called on success. BUT the parent `handleFormSubmit` at lines 95-96 runs `setIsFormOpen(false)` and `setEditingTransaction(null)` before the `await` for refreshing data, which means the form closes before the refresh happens. This is actually correct behavior.

The real issue: the parent sets `submitError` at line 100, but the form has already been closed by the parent at line 95. The error message will never be visible.

**Fix:** In `StocksPage.tsx` `handleFormSubmit`, only close the form on success:

```typescript
const handleFormSubmit = async (data: CreateStockTransactionInput) => {
  try {
    setSubmitError(null);
    if (editingTransaction) {
      await stocksApi.update(editingTransaction.id, data);
    } else {
      await stocksApi.create(data);
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
    await Promise.all([loadPortfolio(), loadTransactions(filters)]);
  } catch (err: any) {
    setSubmitError(err.error || 'Failed to save transaction');
    throw err; // Re-throw so modal knows it failed and doesn't close
  }
};
```

AND in `StockTransactionFormModal.tsx`, don't call `reset()` and `onClose()` in the modal's `handleFormSubmit` - let the parent handle open/close state:

```typescript
const handleFormSubmit = async (data: FormData) => {
  await onSubmit({
    type: data.type,
    company: data.company,
    shares: data.shares,
    pricePerShare: data.pricePerShare,
    currency: data.currency,
    date: data.date,
    note: data.note || undefined,
    accountId: data.accountId || undefined,
  } as CreateStockTransactionInput);
};
```

---

### Issue 7: Pagination renders ALL page buttons for large datasets

**File:** `client/src/components/stocks/StockTransactionList.tsx` lines 69-81

**Problem:** If there are 100+ pages, all page number buttons render at once, breaking the layout.

**Fix:** Limit to showing a window of pages around the current page:

```typescript
{/* Replace lines 68-82 with: */}
<div className="flex items-center gap-1">
  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
    .filter((page) => {
      // Show first, last, and pages near current
      return page === 1 ||
        page === data.totalPages ||
        Math.abs(page - data.page) <= 2;
    })
    .reduce<(number | string)[]>((acc, page, idx, arr) => {
      // Add ellipsis gaps
      if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
        acc.push('...');
      }
      acc.push(page);
      return acc;
    }, [])
    .map((item, idx) =>
      typeof item === 'string' ? (
        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
      ) : (
        <button
          key={item}
          onClick={() => onPageChange(item)}
          className={`px-3 py-1 rounded-lg text-sm ${
            item === data.page
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {item}
        </button>
      )
    )}
</div>
```

---

### Issue 8: `listHandler` response shape inconsistency

**File:** `server/src/controllers/stock.controller.ts` line 50

**Problem:** The `listHandler` returns `res.status(200).json(result)` which spreads `{ items, total, page, limit, totalPages }` directly. But `createHandler` and `getHandler` wrap in `{ transaction: ... }`. The frontend `stocksApi.list` at `client/src/services/api.ts` line 158 expects `StockTransactionListResponse` directly (not wrapped), so this is actually consistent. However, the `account` relation is NOT included in the list query select, so linked account names cannot be displayed.

**File:** `server/src/services/stock.service.ts` lines 193-207

**Fix:** Add account relation to the `listStockTransactions` select to support showing linked account names:

```typescript
// In listStockTransactions, add to the select block after line 206:
account: {
  select: {
    id: true,
    name: true,
    currency: true,
  },
},
```

Then update `serializeStockTransaction` to pass through the account relation:

```typescript
function serializeStockTransaction(transaction: any) {
  return {
    ...transaction,
    shares: transaction.shares.toString(),
    pricePerShare: transaction.pricePerShare.toString(),
    realizedGain: transaction.realizedGain ? transaction.realizedGain.toString() : null,
    account: transaction.account || null,
  };
}
```

And update the `StockTransaction` type in `client/src/types/stock.ts`:

```typescript
export interface StockTransaction {
  // ... existing fields ...
  account?: { id: string; name: string; currency: string } | null;
}
```

Then in `StockTransactionItem.tsx`, replace the generic "Linked account" badge with the actual account name:

```typescript
{transaction.account && (
  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
    {transaction.account.name}
  </span>
)}
```

---

### Issue 9: `editingTransaction.date` contains ISO datetime, form expects YYYY-MM-DD

**File:** `client/src/components/stocks/StockTransactionFormModal.tsx` line 78

**Problem:** The API returns `date` as an ISO datetime string (e.g., `"2026-03-20T00:00:00.000Z"`), but the form's date input expects `YYYY-MM-DD` format. When editing, `reset({ date: editingTransaction.date })` sets the full ISO string, which won't display correctly in the date input.

**Fix:** Parse the date when resetting for edit mode:

```typescript
// Line 78, change:
date: editingTransaction.date,

// To:
date: editingTransaction.date.split('T')[0],
```

---

## MEDIUM Issues

### Issue 10: `StockTransactionFormModal` date validation differs from backend

**File:** `client/src/components/stocks/StockTransactionFormModal.tsx` lines 18-23 vs `server/src/routes/stock.schemas.ts` lines 10-14

**Problem:** Frontend uses `today.setHours(0, 0, 0, 0)` (local midnight). Backend uses `new Date(date + "T00:00:00Z")` compared against `today.setHours(0, 0, 0, 0)` (local midnight). The frontend compares a UTC-interpreted date against local midnight. Users in positive UTC offsets could have today's date rejected on the frontend but accepted on the backend, or vice versa.

**Fix:** Align both to use the same timezone approach. For the frontend form:

```typescript
date: z.string().refine(
  (v) => {
    const selected = new Date(v + 'T00:00:00');  // local time, not UTC
    const today = new Date();
    today.setHours(23, 59, 59, 999);  // end of today in local time
    return selected <= today;
  },
  { message: 'Date cannot be in the future' }
),
```

---

### Issue 11: `DeleteStockTransactionDialog` shows only company name, not transaction details

**File:** `client/src/components/stocks/DeleteStockTransactionDialog.tsx`

**Problem:** The delete confirmation only shows the company name. If a user has multiple transactions for the same company, they can't tell which one they're deleting.

**Fix:** Pass more details to the dialog:

```typescript
// Update the interface:
interface DeleteStockTransactionDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  transaction?: {
    company: string;
    type: string;
    shares: string;
    date: string;
  } | null;
}

// Update the message:
<p className="text-gray-600 mb-6">
  Are you sure you want to delete this stock transaction?
  {transaction && (
    <span className="block mt-2 text-sm font-medium">
      {transaction.type.toUpperCase()} {transaction.shares} shares of {transaction.company} on {transaction.date.split('T')[0]}
    </span>
  )}
  <span className="block mt-1 text-sm">This action cannot be undone.</span>
</p>
```

And in `StocksPage.tsx`, pass the full transaction info instead of just company:

```typescript
<DeleteStockTransactionDialog
  isOpen={!!deleteTarget}
  isLoading={isDeletingTransaction}
  transaction={deleteTarget}
  onConfirm={handleDeleteConfirm}
  onCancel={() => setDeleteTarget(null)}
/>
```

---

### Issue 12: `isLoading={false}` hardcoded on form modal

**File:** `client/src/pages/StocksPage.tsx` line 240

**Problem:** `isLoading` is always `false`. The form's submit button checks `isSubmitting || isLoading` but `isLoading` never changes. This means if the API call takes time, the only loading indicator is from react-hook-form's `isSubmitting`, which resets when the promise resolves/rejects. But the parent also does `await Promise.all([loadPortfolio(), loadTransactions(filters)])` after success, during which the form is already closed. This is acceptable but inconsistent with the transaction form pattern.

**Fix:** Either remove the `isLoading` prop entirely from the component, or track a `isSubmittingForm` state:

```typescript
// In StocksPage.tsx, add state:
const [isSubmittingForm, setIsSubmittingForm] = useState(false);

// In handleFormSubmit:
const handleFormSubmit = async (data: CreateStockTransactionInput) => {
  try {
    setSubmitError(null);
    setIsSubmittingForm(true);
    // ... rest of submit logic
  } catch (err: any) {
    setSubmitError(err.error || 'Failed to save transaction');
  } finally {
    setIsSubmittingForm(false);
  }
};

// Pass to modal:
isLoading={isSubmittingForm}
```

---

### Issue 13: `StockTransactionFilters` type allows `'all'` for type field

**File:** `client/src/types/stock.ts` line 50

**Problem:** The `StockTransactionFilters` interface defines `type?: StockTransactionType | 'all'`, but `'all'` is never sent to the API - it's converted to `undefined` in the filter component. Having `'all'` in the type makes it possible to accidentally send it to the API.

**Fix:** Remove `'all'` from the type:

```typescript
export interface StockTransactionFilters {
  company?: string;
  type?: StockTransactionType;  // Remove '| all'
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
```

The filter component already converts `'all'` to `undefined` before calling `onFilterChange`, so this is safe.

---

### Issue 14: `note` field in `StockTransaction` type uses `?` but API returns `null`

**File:** `client/src/types/stock.ts` line 14

**Problem:** The interface uses `note?: string` (optional), but the API serializes `note: null` (not undefined). TypeScript `?` means the key can be missing, but `null` and `undefined` are different values.

**Fix:**

```typescript
// Change line 14:
note?: string;

// To:
note: string | null;

// Also line 15:
realizedGain?: string;
// To:
realizedGain: string | null;

// And line 16:
accountId?: string;
// To:
accountId: string | null;
```

Then update the form modal reset to handle `null`:

```typescript
// StockTransactionFormModal.tsx line 79:
note: editingTransaction.note || '',
// This already handles null correctly with ||, so no change needed there.
```

---

### Issue 15: No error dismissal mechanism

**File:** `client/src/pages/StocksPage.tsx` lines 156-160

**Problem:** The error banner at lines 156-160 has no close/dismiss button. Once an error appears, it stays until the page is refreshed or a successful operation clears it (but `setError(null)` is never called on success for the global error).

**Fix:** Add a dismiss button and clear errors on successful operations:

```typescript
{error && (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
    <span>{error}</span>
    <button
      onClick={() => setError(null)}
      className="ml-4 text-red-500 hover:text-red-700 font-bold"
    >
      x
    </button>
  </div>
)}
```

Also add `setError(null)` at the start of `loadPortfolio` and `loadTransactions`.

---

### Issue 16: `Decimal.toNumber()` precision loss for large account balance adjustments

**File:** `server/src/services/stock.service.ts` lines 125, 131, 319, 324

**Problem:** The code converts `Decimal` to `Number` via `.toNumber()` for account balance operations. JavaScript's `Number.MAX_SAFE_INTEGER` is 9007199254740991. If a stock transaction total exceeds this (in cents), precision is lost. For example: 10,000 shares at $1,000,000/share = $10B = 1 trillion cents, which exceeds MAX_SAFE_INTEGER.

**Fix:** Use `Math.round()` to ensure integer values, or convert to BigInt if the account balance field supports it:

```typescript
// If account.balance is BigInt:
data: { balance: { decrement: BigInt(total.round().toString()) } },

// If account.balance is Int:
data: { balance: { decrement: total.round().toNumber() } },
```

For most practical use cases, `.toNumber()` is fine, but add `Math.round()` to avoid fractional cent issues from Decimal multiplication:

```typescript
data: { balance: { decrement: Math.round(total.toNumber()) } },
```

---

## LOW Issues

### Issue 17: `StockPortfolioList` uses `holding.company` as React key

**File:** `client/src/components/stocks/StockPortfolioList.tsx` line 35

**Problem:** Using company name as the key works because the backend aggregates by company, but it's fragile. If the portfolio ever returns duplicate company entries (e.g., different currencies), React would have key collisions.

**Fix:** Use a composite key:

```typescript
<StockPortfolioCard key={`${holding.company}-${holding.currency}`} holding={holding} />
```

---

### Issue 18: `StockFilters` company search triggers API on every keystroke

**File:** `client/src/components/stocks/StockFilters.tsx` lines 12-18

**Problem:** `handleCompanyChange` calls `onFilterChange` on every keystroke, which triggers an API call each time.

**Fix:** Add debouncing. In `StocksPage.tsx` or the filter component:

```typescript
// Option 1: Simple debounce in StockFilters
import { useState, useEffect } from 'react';

// Add local state for company input:
const [companyInput, setCompanyInput] = useState(filters.company || '');

useEffect(() => {
  const timer = setTimeout(() => {
    onFilterChange({
      ...filters,
      company: companyInput || undefined,
      page: 1,
    });
  }, 300);
  return () => clearTimeout(timer);
}, [companyInput]);

// Change input to use local state:
<input
  value={companyInput}
  onChange={(e) => setCompanyInput(e.target.value)}
  // ...
/>
```

---

### Issue 19: Missing `note` field in `realizedGain` display and no linked account display in `getHandler`

**File:** `server/src/services/stock.service.ts` lines 141-171

**Problem:** `getStockTransaction` doesn't include the account relation in its select. If the frontend ever uses the get endpoint to display transaction details with linked account info, it won't have the account name.

**Fix:** Add account relation:

```typescript
const transaction = await prisma.stockTransaction.findUnique({
  where: { id: transactionId },
  select: {
    // ... existing fields ...
    account: {
      select: {
        id: true,
        name: true,
        currency: true,
      },
    },
  },
});
```

---

### Issue 20: Currency input should be uppercase

**File:** `client/src/components/stocks/StockTransactionFormModal.tsx` line 199-205

**Problem:** The currency field accepts any text. The backend does case-sensitive comparison for currency consistency (line 52 in stock.service.ts). User typing "usd" vs "USD" would be treated as different currencies.

**Fix:** Add text transform to the input and/or convert to uppercase on submit:

```typescript
// In the form schema:
currency: z.string().min(1, 'Currency is required').transform(v => v.toUpperCase()),

// And/or add CSS class:
className="... uppercase"
```

---

## Summary

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | CRITICAL | stock.service.ts | Update doesn't adjust account balance |
| 2 | CRITICAL | stock.service.ts | Portfolio totalInvested formula wrong |
| 3 | CRITICAL | stock.service.ts | Portfolio realizedGain recalculated instead of using stored values |
| 4 | CRITICAL | stock.service.ts | Sell validation race condition (outside transaction) |
| 5 | HIGH | StockTransactionItem/PortfolioCard | Duplicate formatters instead of importing from utils |
| 6 | HIGH | StocksPage + FormModal | Double close logic / error not visible |
| 7 | HIGH | StockTransactionList | Pagination renders all page buttons |
| 8 | HIGH | stock.service.ts + controller | List query missing account relation |
| 9 | HIGH | StockTransactionFormModal | Edit date format mismatch (ISO vs YYYY-MM-DD) |
| 10 | MEDIUM | FormModal + stock.schemas.ts | Date validation timezone inconsistency |
| 11 | MEDIUM | DeleteStockTransactionDialog | Shows only company, not full transaction details |
| 12 | MEDIUM | StocksPage | isLoading always false on form |
| 13 | MEDIUM | types/stock.ts | StockTransactionFilters allows 'all' type |
| 14 | MEDIUM | types/stock.ts | Optional vs null mismatch for note/realizedGain/accountId |
| 15 | MEDIUM | StocksPage | No error dismissal mechanism |
| 16 | MEDIUM | stock.service.ts | Decimal.toNumber() precision for balance ops |
| 17 | LOW | StockPortfolioList | Company as React key is fragile |
| 18 | LOW | StockFilters | No debounce on company search |
| 19 | LOW | stock.service.ts | getStockTransaction missing account relation |
| 20 | LOW | StockTransactionFormModal | Currency input should be uppercase |
