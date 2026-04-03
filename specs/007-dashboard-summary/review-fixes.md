# Dashboard Review — Issues & Fixes

## Issue 1: Backslash bug in category summary API URL (CRITICAL)

**File**: `client/src/services/api.ts` line ~257

**Problem**: Backslashes instead of forward slashes in template literal. `\d` and `\c` are interpreted as escape sequences, producing a broken URL when dateFrom/dateTo params are provided.

**Current code**:
```ts
const endpoint = query ? `\dashboard\category-summary?${query}` : "/dashboard/category-summary";
```

**Fix**: Replace backslashes with forward slashes:
```ts
const endpoint = query ? `/dashboard/category-summary?${query}` : "/dashboard/category-summary";
```

---

## Issue 2: N+1 query in dashboard service (PERFORMANCE)

**File**: `server/src/services/dashboard.service.ts`

**Problem**: Both `getMonthlyTotals()` and `getCategorySummary()` call `getHistoricalRate()` inside a `for` loop, once per transaction. For a user with 500 transactions across 3 currencies over 6 months, this fires 500 individual DB queries. This violates SC-004 (1,000+ transactions without degradation).

**Fix**: Before the transaction loop, collect all unique `(currency, monthEndDate)` pairs, batch-fetch rates for all of them into a `Map`, then look up from the map inside the loop.

Example approach for `getMonthlyTotals()`:
```ts
// 1. Collect unique (currency, monthEnd) pairs
const ratesToFetch = new Map<string, Date>();
for (const tx of transactions) {
  const currency = tx.account?.currency || baseCurrency;
  if (currency !== baseCurrency) {
    const endOfMonth = getEndOfMonth(tx.date);
    const key = `${currency}_${getMonthKey(tx.date)}`;
    if (!ratesToFetch.has(key)) {
      ratesToFetch.set(key, endOfMonth);
    }
  }
}

// 2. Batch fetch all rates
const rateCache = new Map<string, number>();
await Promise.all(
  Array.from(ratesToFetch.entries()).map(async ([key, endOfMonth]) => {
    const currency = key.split('_')[0];
    const result = await getHistoricalRate(currency, baseCurrency, endOfMonth);
    if (result.rate) {
      rateCache.set(key, result.rate);
    }
  })
);

// 3. Use cache in the loop
for (const transaction of transactions) {
  const currency = transaction.account?.currency || baseCurrency;
  const divisor = getDivisor(currency);
  const amountInCurrency = Number(transaction.amount) / divisor;

  let convertedAmount = amountInCurrency;
  if (currency !== baseCurrency) {
    const key = `${currency}_${getMonthKey(transaction.date)}`;
    const rate = rateCache.get(key);
    if (rate) {
      convertedAmount = amountInCurrency * rate;
    }
  }
  // ... rest of accumulation logic unchanged
}
```

Apply the same pattern to `getCategorySummary()`.

---

## Issue 3: Hardcoded account type icon in AccountBalanceCards

**File**: `client/src/components/dashboard/AccountBalanceCards.tsx` line ~102

**Problem**: `getAccountTypeIcon('bank')` is always called with the string `'bank'` instead of the actual account type. The net-worth API response (`breakdown`) does not include an `accountType` field, so the icon function's type map is dead code.

**Fix option A** (quick — remove the unused function and use a generic icon):
```tsx
// Remove the getAccountTypeIcon function entirely.
// Replace line 102:
<span className="text-2xl">{getAccountTypeIcon('bank')}</span>
// With a generic icon:
<span className="text-2xl">💰</span>
```

**Fix option B** (proper — extend the API response to include account type):

1. In `server/src/services/exchange-rate.service.ts`, in the function that builds the net-worth breakdown, add `accountType: account.type` to each breakdown item.

2. Add `accountType: string` to the `NetWorthBreakdown` interface in `AccountBalanceCards.tsx`.

3. Use the actual type:
```tsx
<span className="text-2xl">{getAccountTypeIcon(account.accountType)}</span>
```

---

## Issue 4: Duplicate net-worth API calls on dashboard load

**File**: `client/src/components/dashboard/AccountBalanceCards.tsx` and `client/src/components/dashboard/NetWorthCard.tsx`

**Problem**: Both components independently call `exchangeRatesApi.netWorth()` on mount, causing two identical API requests every time the dashboard loads.

**Fix**: Lift the fetch up to `DashboardPage.tsx` and pass the data down as props to both components.

1. In `DashboardPage.tsx`, add state and fetch:
```tsx
const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
const [netWorthLoading, setNetWorthLoading] = useState(true);
const [netWorthError, setNetWorthError] = useState<string | null>(null);

const fetchNetWorth = useCallback(async () => {
  try {
    setNetWorthLoading(true);
    setNetWorthError(null);
    const data = await exchangeRatesApi.netWorth();
    setNetWorthData(data);
  } catch (err) {
    setNetWorthError(err instanceof Error ? err.message : 'Failed to fetch');
  } finally {
    setNetWorthLoading(false);
  }
}, []);

useEffect(() => { fetchNetWorth(); }, [fetchNetWorth, refreshKey]);
```

2. Update both components to accept props instead of fetching internally:
```tsx
// NetWorthCard.tsx
interface NetWorthCardProps {
  data: NetWorthData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// AccountBalanceCards.tsx
interface AccountBalanceCardsProps {
  data: NetWorthData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}
```

3. Pass props from DashboardPage:
```tsx
<NetWorthCard data={netWorthData} loading={netWorthLoading} error={netWorthError} onRefresh={fetchNetWorth} />
<AccountBalanceCards data={netWorthData} loading={netWorthLoading} error={netWorthError} onRetry={fetchNetWorth} />
```

---

## Issue 5: Controller type casting bypasses Zod validation

**File**: `server/src/controllers/dashboard.controller.ts`

**Problem**: `req.query as unknown as SpendingChartQuery` is an unsafe double cast. If the Zod middleware attaches the validated/transformed result somewhere (e.g., `req.validatedQuery`), the controller should read from there. If not, the cast means the controller trusts raw query strings and the `default(6)` in the Zod schema has no effect at the controller level.

**Fix**: Check how `validateMiddleware` works. If it mutates `req.query` with the parsed result, the cast is cosmetically ugly but functionally OK — just clean it up. If it does NOT mutate `req.query`, then the Zod defaults (like `months` defaulting to 6) are silently lost. In that case:

1. Update `validateMiddleware` to assign parsed output back to `req.query`:
```ts
// In validate.middleware.ts, after parsing:
if (source === 'query') {
  req.query = parsed as any;
}
```

2. Or read from wherever the middleware stores the result. Then in the controller:
```ts
const query = req.query as SpendingChartQuery; // single cast is fine after middleware mutation
```

---

## Issue 6: QuickAddTransaction not wrapped in ErrorBoundary

**File**: `client/src/pages/DashboardPage.tsx` line 64

**Problem**: Every other dashboard component is wrapped in `<ErrorBoundary>` except `QuickAddTransaction`. If it throws during render, the entire dashboard crashes.

**Fix**:
```tsx
// Change:
<QuickAddTransaction onTransactionCreated={handleTransactionCreated} />

// To:
<ErrorBoundary>
  <QuickAddTransaction onTransactionCreated={handleTransactionCreated} />
</ErrorBoundary>
```
