# 008 Reports & Analytics — Issues & Fixes

## Issue 1: Net Worth Chart renders flat line — `netWorth` is a string, not a number

**Severity**: HIGH (chart is visually broken)

**File**: `client/src/components/reports/NetWorthChart.tsx`

**Problem**: The API returns `netWorth` as a `string` (e.g., `"15432.50"`), and Recharts' `<Line dataKey="netWorth">` plots strings as categorical data — the line renders flat at 0 or all identical Y values. The `YAxis` tick formatter also receives the raw string, not a number.

**Fix**: Convert `dataPoints` to numeric values before passing to the chart.

```tsx
// In NetWorthChart.tsx, after fetching data, transform dataPoints:
const chartData = data.dataPoints.map((dp) => ({
  date: dp.date,
  netWorth: parseFloat(dp.netWorth),
}));
// Then pass chartData (not data.dataPoints) to <LineChart data={chartData}>
```

---

## Issue 2: ReportsPage has a duplicate "Net Worth Over Time" placeholder section

**Severity**: MEDIUM (renders a useless static card below real chart)

**File**: `client/src/pages/ReportsPage.tsx` — lines 65-71

**Problem**: After the `NetWorthChart` component and the spending/income grid, there is a hardcoded placeholder section:

```tsx
<div className="mt-6 bg-white rounded-lg shadow p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Net Worth Over Time</h2>
  <div className="text-gray-500 text-sm">
    Select a date range to view your net worth history.
  </div>
</div>
```

This was the original placeholder that was never removed after the real `NetWorthChart` was integrated.

**Fix**: Delete lines 65-71 entirely (the `<div className="mt-6 bg-white ...">` block).

---

## Issue 3: Zod `.refine()` schemas fail validation when used with query params

**Severity**: HIGH (blocks API calls for category-summary, net-worth-history, and export endpoints)

**Files**:
- `server/src/routes/dashboard.schemas.ts` — `categorySummarySchema` and `netWorthHistorySchema`
- `server/src/routes/transaction.schemas.ts` — `exportTransactionsSchema`

**Problem**: Using `.refine()` on a `z.object()` produces a `ZodEffects` type, not a `ZodObject`. The `validateMiddleware` calls `schema.parseAsync(req.query)`. When the refine function accesses `data.dateFrom` and `data.dateTo`, these are the raw query string values and date comparison works — but the refined schema's output type is `ZodEffects`, and the inferred type for `CategorySummaryQuery` / `NetWorthHistoryQuery` wraps the transform, which means `req.query` gets assigned the correct parsed values.

**However**, the real problem is that the `.refine()` transform runs client-side date comparison on raw strings (`new Date(data.dateFrom) <= new Date(data.dateTo)`). If `dateFrom` or `dateTo` is `undefined` (both are optional), `new Date(undefined)` returns `Invalid Date`, and comparisons with `Invalid Date` always return `false`, causing valid requests without dates to fail validation.

Wait — there IS a guard `if (data.dateFrom && data.dateTo)` so this is safe. The schemas are fine for the optional fields.

**Actually, a real issue**: For `exportTransactionsSchema`, `dateFrom` and `dateTo` are **required** (not optional), so the refine is fine there too.

**Revised verdict**: The Zod schemas themselves are correct. No fix needed here — removing this issue.

---

## Issue 3 (revised): `convertToBase` query param not in `listTransactionsSchema` — Zod strips it

**Severity**: LOW (existing functionality, not 008-specific — but affects deployment correctness)

**File**: `server/src/routes/transaction.schemas.ts` — `listTransactionsSchema` (line 54-62)

**Problem**: The `listTransactionsHandler` reads `req.query.convertToBase` (line 28 of controller), but `listTransactionsSchema` does not include `convertToBase`. Since Zod strips unknown keys by default, after validation `req.query.convertToBase` becomes `undefined`. The controller reads it from `req.query` directly (before Zod overwrites), but the validate middleware replaces `req.query` with validated output — so `convertToBase` is always lost.

**Fix**: Add `convertToBase` to the schema:

```ts
// In server/src/routes/transaction.schemas.ts, listTransactionsSchema:
convertToBase: z.enum(["true", "false"]).optional(),
```

And update the controller to read from the validated query:
```ts
const convertToBase = filters.convertToBase === 'true';
```

---

## Issue 4: `exportTransactions` missing `orderBy` — CSV rows in unpredictable order

**Severity**: LOW (data is correct but unsorted)

**File**: `server/src/services/transaction.service.ts` — `exportTransactions()` around line 498

**Problem**: The Prisma query for export has no `orderBy`, so rows come back in database insertion order. Users expect CSV rows sorted by date.

**Fix**: Add `orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]` to the `findMany` call:

```ts
const transactions = await prisma.transaction.findMany({
  where,
  select: { ... },
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  take: 10000,
});
```

---

## Issue 5: Net worth history — `getRate()` called sequentially inside loop, very slow

**Severity**: MEDIUM (performance — can cause Railway request timeout on large date ranges)

**File**: `server/src/services/dashboard.service.ts` — `getNetWorthHistory()` lines 449-484

**Problem**: The function iterates over every data point date, and for each account at each date, calls `await getRate(...)` inside a sequential loop. While there is a `rateCache`, the first request for each `(currency, date)` pair still hits the database. For a 1-year monthly range with 5 accounts in 3 currencies, this is 12 * 3 = 36 sequential DB queries — much slower than necessary.

**Fix**: Pre-fetch all needed rates before the loop:

```ts
// Collect all unique (currency, dateString) pairs first
const ratesToFetch = new Set<string>();
for (const dataPointDate of dataPointDates) {
  const dateString = formatDateStr(dataPointDate);
  for (const account of accounts) {
    if (account.currency !== baseCurrency) {
      ratesToFetch.add(`${account.currency}_${dateString}`);
    }
  }
}

// Fetch all rates in parallel
await Promise.all(
  Array.from(ratesToFetch).map(async (key) => {
    const [currency, dateString] = key.split('_');
    await getRate(currency, dateString); // populates rateCache
  })
);

// Then the existing loop uses rateCache hits only
```

---

## Issue 6: Net worth history — `transactionsAfterDate` filter creates O(dataPoints * transactions) complexity

**Severity**: MEDIUM (performance on large datasets)

**File**: `server/src/services/dashboard.service.ts` — line 453

**Problem**: For each data point, `.filter((tx) => new Date(tx.date) > dataPointDate)` scans the entire transactions array. With 24 data points and 5000 transactions, that's 120,000 date comparisons.

**Fix**: Since transactions are sorted DESC by date, use a pointer/index approach:

```ts
// Transactions are already sorted DESC by date
// Pre-sort dataPointDates in ascending order
// Use a pointer to track which transactions are "after" the current data point

let txPointer = 0; // points into transactions (sorted DESC)
// Process dataPointDates from most recent to oldest
const sortedDataPoints = [...dataPointDates].sort((a, b) => b.getTime() - a.getTime());

for (const dataPointDate of sortedDataPoints) {
  // Advance pointer past transactions that are <= dataPointDate
  while (txPointer < transactions.length && new Date(transactions[txPointer].date) > dataPointDate) {
    txPointer++;
  }
  // transactions[0..txPointer-1] are after dataPointDate
  const transactionsAfterDate = transactions.slice(0, txPointer);
  // ... rest of reconstruction
}
```

Or simpler: reconstruct balances incrementally by walking backward through transactions.

---

## Issue 7: `IncomeBreakdown` shows "Total Spending" label instead of "Total Income"

**Severity**: LOW (cosmetic — misleading label)

**File**: `client/src/components/reports/IncomeBreakdown.tsx` — line 128

**Problem**: The API response field is `totalSpending` (same shape for both income and expense), but the component displays it as the total. The label on line 127 already says "Total Income", but the response field `data.totalSpending` is semantically misleading. This is a backend naming issue — the field should ideally be `totalAmount` or the income component should just be aware of this.

**Actually**: Looking again, line 127 does say "Total Income" as the label, and `data.totalSpending` is used for the value. The label is correct. The backend returns `totalSpending` for both income and expense queries (it reuses the same response shape). This is a naming smell but not a bug.

**Fix (optional backend rename)**: In `server/src/services/dashboard.service.ts`, rename `totalSpending` to `totalAmount` in the return type and response. Update the type in `client/src/types/dashboard.ts` (`CategorySummaryResponse.totalSpending` -> `totalAmount`). Update all frontend usages.

**Alternatively, leave as-is** since it works correctly. Mark as cosmetic.

---

## Issue 8: ~~Dockerfile copies `src/generated` but directory may not exist~~ — NOT AN ISSUE

**Severity**: N/A

**File**: `server/Dockerfile` — line 24

**Verdict**: Prisma schema has `output = "../src/generated/prisma"` in `generator client`, so `COPY --from=builder /app/src/generated ./src/generated` is correct and required. No fix needed.

---

## Issue 9: Export CSV — no ordering, and missing `orderBy` for consistent export results

**Severity**: LOW (duplicate of Issue 4 for emphasis)

See Issue 4.

---

## Issue 10: `DateRangeSelector` — `isPresetActive` relies on stale `preset` state

**Severity**: LOW (visual glitch — preset button highlight can be wrong)

**File**: `client/src/components/reports/DateRangeSelector.tsx` — line 67-70

**Problem**: `isPresetActive` checks `if (!preset) return false` first. If the user clicks a preset, then manually edits a custom date field (which sets `preset = null`), and then clicks "Apply" with the exact same dates as a preset, no preset button highlights even though the dates match a preset. This is minor UX.

**Also**: When the component first renders with the default 6-month date range (set in `ReportsPage`), no preset is highlighted even though the dates may match "Last 6 Months". The `preset` state initializes as `null`.

**Fix**: Remove the `if (!preset) return false` guard and just compare dates:

```tsx
const isPresetActive = (selectedPreset: Preset) => {
  const range = getDateRange(selectedPreset);
  return range.dateFrom === dateFrom && range.dateTo === dateTo;
};
```

---

## Issue 11: `ReportsPage` missing `mb-6` on the `NetWorthChart` wrapper

**Severity**: LOW (visual spacing)

**File**: `client/src/pages/ReportsPage.tsx` — line 42-47

**Problem**: The `NetWorthChart` `ErrorBoundary` wrapper has no bottom margin, so it sits directly against the spending/income grid below it.

**Fix**: Add `mb-6` wrapper:

```tsx
<div className="mb-6">
  <ErrorBoundary>
    <NetWorthChart dateFrom={dateFrom} dateTo={dateTo} />
  </ErrorBoundary>
</div>
```

---

## Issue 12: `MonthlyComparison` crashes when API returns only 1 month

**Severity**: MEDIUM (runtime crash for new users)

**File**: `client/src/components/reports/MonthlyComparison.tsx` — lines 96-100

**Problem**: When `sortedMonths.length === 1`, the code still accesses `previous` on lines 99-100:

```ts
const current = sortedMonths[sortedMonths.length - 1];
const previous = sortedMonths[sortedMonths.length - 2]; // undefined when length === 1
const incomeChange = computeChange(parseFloat(current.totalIncome), parseFloat(previous?.totalIncome || '0'));
```

The `previous?.totalIncome || '0'` handles `undefined` safely with optional chaining, and then `parseFloat('0')` returns 0. So `computeChange` receives `(current, 0)`. The early return on line 122 `sortedMonths.length === 1` SHOULD catch this, but it happens AFTER the computation. So computations still run but results are unused.

**Wait — re-reading**: Lines 96-100 execute unconditionally before the JSX. Line 122 checks `sortedMonths.length === 1` only in JSX rendering. So the values ARE computed but the "only 1 month" UI displays instead. This is not a crash, but it's wasteful. If `data.months` has length 0, `current` would be `undefined`, and `parseFloat(undefined.totalIncome)` WOULD crash.

The check on line 83 (`data.months.length === 0`) catches the empty case, so length 0 is safe. With length >= 1, `current` is defined. `previous` may be `undefined` but the optional chaining handles it.

**Revised verdict**: Not a crash, but the code computes unused values. Harmless — skip this.

---

## Issue 13: Server build missing `prisma generate` in `package.json` build script

**Severity**: HIGH (deployment failure on Railway Nixpacks — non-Docker builds)

**File**: `server/package.json`

**Problem**: The `"build"` script is just `"tsc"`. Railway's Nixpacks builder runs `npm install` then `npm run build`. Without `prisma generate` in the build script, the Prisma client is not generated, and `tsc` fails with "Cannot find module '@prisma/client'" (or the import of `prisma` utils fails).

The Dockerfile handles this separately, but if Railway uses Nixpacks (the default for Node.js projects without explicit Docker config), the build will fail.

**Fix**: Update the build script:

```json
"build": "npx prisma generate && tsc"
```

---

## Issue 14: Client Dockerfile — `serve` uses `PORT` env but Railway may assign port differently

**Severity**: LOW (Railway provides `PORT` env var by default, so this should work)

**File**: `client/Dockerfile` — line 20

**Problem**: `CMD ["sh", "-c", "serve -s /app/dist -l ${PORT:-3000}"]` — Railway injects `PORT` env var, so this should work. No issue here actually.

**Revised verdict**: This is fine.

---

## Issue 15: `exportTransactions` rate caching uses month key, not exact date

**Severity**: LOW (slight inaccuracy for transactions across exchange rate changes within a month)

**File**: `server/src/services/transaction.service.ts` — `exportTransactions()` line 559

**Problem**: Rate lookups are cached per `(currency, month)` pair using `getMonthKey()`. All transactions within the same month for the same currency get the same exchange rate. The spec says "each transaction is converted using the exchange rate closest to its transaction date", but the implementation groups by month.

This matches the approach used in `getCategorySummary` and `getMonthlyTotals`, so it's consistent across the app. But for CSV export which shows individual transactions, users might expect per-transaction accuracy.

**Fix (optional)**: Use the exact transaction date as the cache key instead of the month:

```ts
const dateKey = transaction.date.toISOString().split('T')[0]; // YYYY-MM-DD
const rate = await getRate(currency, dateKey);
```

This would increase DB queries but give more accurate per-transaction conversions.

---

## Summary — Priority Order for Fixes

| # | Severity | Description |
|---|----------|-------------|
| 1 | HIGH | Net worth chart string→number conversion (chart broken) |
| 13 | HIGH | Missing `prisma generate` in server build script (Nixpacks deploy fails) |
| 2 | MEDIUM | Duplicate net worth placeholder in ReportsPage |
| 5 | MEDIUM | Sequential rate fetching in net worth history (timeout risk) |
| 6 | MEDIUM | O(n*m) complexity in net worth reconstruction |
| 4 | LOW | Export CSV missing orderBy |
| 3 | LOW | `convertToBase` stripped from query params |
| 10 | LOW | DateRangeSelector preset highlight bug |
| 11 | LOW | Missing spacing between sections |
| 15 | LOW | Export rate accuracy per-transaction vs per-month |
