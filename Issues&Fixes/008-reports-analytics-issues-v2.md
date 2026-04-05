# 008 Reports & Analytics — Review v2 (Post-Fix)

## Previous Issues — Status

| # | Status | Description |
|---|--------|-------------|
| 1 | FIXED | Net worth chart string-to-number conversion |
| 2 | FIXED | Duplicate net worth placeholder removed |
| 13 | FIXED | `prisma generate` added to server build script |
| 5 | FIXED | Rates pre-fetched in parallel |
| 6 | REGRESSION | Balance reconstruction rewrite is **broken** (see Issue A below) |
| 4 | FIXED | Export CSV has orderBy |
| 3 | FIXED | `convertToBase` added to listTransactionsSchema |
| 10 | FIXED | DateRangeSelector preset highlight compares dates directly |
| 11 | FIXED | NetWorthChart wrapped in mb-6 div |
| 15 | FIXED | Export uses per-day rate key |

---

## Issue A (CRITICAL): Net worth history balance reconstruction is completely broken

**Severity**: CRITICAL (produces wrong net worth values for every data point)

**File**: `server/src/services/dashboard.service.ts` — lines 444-507

**Problem**: The optimization rewrite of the balance reconstruction algorithm introduced a fundamental logic error. The code:

1. Starts with `initialBalances` = **current** account balances (the balance RIGHT NOW, which already includes all historical transactions)
2. Sorts transactions ascending and processes data points ascending (oldest to newest)
3. For each transaction `<= dataPointDate`, **adds** income and **subtracts** expenses to the current balance

This **double-counts** every transaction. The current balance is already the result of all transactions. Re-applying them forward produces inflated/deflated values.

**Concrete example**:
- Account current balance: 1000 (which is starting 400 + income 500 + income 300 - expense 200)
- Transactions in range (sorted ASC): T1 Jan income +500, T2 Feb expense -200, T3 Mar income +300
- Data points: Jan 31, Feb 28, Mar 31

What the code produces:
- Jan 31: txPointer starts at end, no transactions processed (Mar date > Jan), balance = 1000. **Wrong** (should be 900)
- Feb 28: still no transactions processed, balance = 1000. **Wrong** (should be 700)
- Mar 31: processes T3, T2, T1 backward: 1000 + 300 - 200 + 500 = 1600. **Wrong** (should be 1000)

**Additional bug in pointer direction**: `txPointer` starts at `length - 1` and **decrements**, but the while condition checks `sortedTransactions[txPointer].date <= dataPointDate`. Since it starts at the most recent transaction and decrements to older ones, and data points go forward in time, the while loop fires **only for the last few data points** and processes transactions in **reverse chronological** order — the opposite of what forward accumulation requires.

**Fix**: Revert to the original "undo from current" approach, but use a pointer for O(n) instead of O(n*m). Process data points from **newest to oldest**, and maintain account balances starting from current, progressively undoing transactions:

```ts
// Sort data points newest-first
const sortedDataPoints = [...dataPointDates].sort((a, b) => b.getTime() - a.getTime());

// Clone current balances as working state
const workingBalances = new Map<string, bigint>();
for (const account of accounts) {
  workingBalances.set(account.id, account.balance);
}

// First: undo all transactions AFTER the date range (between endDate and now)
// These are NOT fetched in the query, so we need a separate query
const transactionsAfterRange = await prisma.transaction.findMany({
  where: {
    userId,
    date: { gt: endDate },
  },
  select: {
    type: true,
    amount: true,
    accountId: true,
    transferToId: true,
  },
});

for (const tx of transactionsAfterRange) {
  const balance = workingBalances.get(tx.accountId) || BigInt(0);
  if (tx.type === "income") {
    workingBalances.set(tx.accountId, balance - tx.amount);
  } else if (tx.type === "expense") {
    workingBalances.set(tx.accountId, balance + tx.amount);
  } else if (tx.type === "transfer") {
    workingBalances.set(tx.accountId, balance + tx.amount);
    if (tx.transferToId) {
      const destBalance = workingBalances.get(tx.transferToId) || BigInt(0);
      workingBalances.set(tx.transferToId, destBalance - tx.amount);
    }
  }
}

// transactions are already sorted DESC from the original query
// txPointer starts at 0 (most recent transaction in range)
let txPointer = 0;

const results: DataPoint[] = [];

for (const dataPointDate of sortedDataPoints) {
  const dateString = formatDateStr(dataPointDate);

  // Undo transactions that are AFTER dataPointDate (between dataPointDate and the previous data point)
  while (txPointer < transactions.length && new Date(transactions[txPointer].date) > dataPointDate) {
    const tx = transactions[txPointer];
    const balance = workingBalances.get(tx.accountId) || BigInt(0);

    if (tx.type === "income") {
      workingBalances.set(tx.accountId, balance - tx.amount);
    } else if (tx.type === "expense") {
      workingBalances.set(tx.accountId, balance + tx.amount);
    } else if (tx.type === "transfer") {
      workingBalances.set(tx.accountId, balance + tx.amount);
      if (tx.transferToId) {
        const destBalance = workingBalances.get(tx.transferToId) || BigInt(0);
        workingBalances.set(tx.transferToId, destBalance - tx.amount);
      }
    }

    txPointer++;
  }

  // Now workingBalances reflects state at dataPointDate
  let totalNetWorth = BigInt(0);

  for (const [accountId, balance] of workingBalances.entries()) {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) continue;

    const divisor = getDivisor(account.currency);
    const balanceInCurrency = Number(balance) / divisor;

    let convertedAmount = balanceInCurrency;
    if (account.currency !== baseCurrency) {
      const cacheKey = `${account.currency}_${dateString}`;
      const rate = rateCache.get(cacheKey) || 1;
      convertedAmount = balanceInCurrency * rate;
    }

    totalNetWorth += BigInt(Math.round(convertedAmount * 100));
  }

  results.push({
    date: dateString,
    netWorth: formatAmount(Number(totalNetWorth) / 100),
  });
}

// Reverse to get chronological order
const dataPoints = results.reverse();
```

**Key differences from the broken code**:
1. Process data points **newest to oldest** (not oldest to newest)
2. **Undo** transactions (subtract income, add expense) instead of re-applying them
3. Use `transactions` sorted DESC (the original query already does this) — pointer advances forward through the desc-sorted array
4. **Also undo transactions after the date range** (between endDate and now) to correctly start from the endDate balance, not today's balance

---

## Issue B (LOW): Dead `preset` state in DateRangeSelector

**Severity**: LOW (dead code, no functional impact)

**File**: `client/src/components/reports/DateRangeSelector.tsx` — lines 47, 51, 59, 65

**Problem**: The `preset` state variable is declared (line 47), set in `handlePresetClick` (line 59) and `handleCustomApply` (line 65), but never read — `isPresetActive` no longer references it. The `void preset` on line 51 is a workaround for the unused variable warning.

**Fix**: Remove the state entirely:

```tsx
// Remove line 47: const [preset, setPreset] = useState<Preset | null>(null);
// Remove line 51: void preset;
// Remove line 59: setPreset(selectedPreset);
// Remove line 65: setPreset(null);
// Remove lines 145-146: setPreset(null); (in both onChange handlers)
```

---

## Issue C (LOW): `MonthlyComparison` missing top margin

**Severity**: LOW (spacing — sits flush against the grid above it)

**File**: `client/src/pages/ReportsPage.tsx` — line 67

**Problem**: The `MonthlyComparison` `ErrorBoundary` wrapper has no top margin, so it sits directly against the spending/income grid.

**Fix**: Add `mt-6`:

```tsx
<div className="mt-6">
  <ErrorBoundary>
    <MonthlyComparison />
  </ErrorBoundary>
</div>
```

---

## Summary — Priority Order

| # | Severity | Description |
|---|----------|-------------|
| A | CRITICAL | Net worth balance reconstruction algorithm is broken — produces wrong values for every data point. Must be rewritten. |
| B | LOW | Dead `preset` state + `void preset` workaround in DateRangeSelector |
| C | LOW | Missing `mt-6` spacing before MonthlyComparison |
