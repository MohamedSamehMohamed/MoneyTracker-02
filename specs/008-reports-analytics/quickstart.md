# Quickstart: Reports & Analytics

**Feature**: 008-reports-analytics  
**Date**: 2026-04-05

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running with existing schema migrated
- Both `server/` and `client/` dependencies installed (`npm install`)
- Seed data with users, accounts, transactions, categories, and exchange rates

## Development Setup

```bash
# Terminal 1 - Backend
cd server && npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Frontend
cd client && npm run dev
# Runs on http://localhost:5173
```

## Key Files to Modify

### Backend (server/src/)

| File | Action | Purpose |
|------|--------|---------|
| `services/dashboard.service.ts` | Modify | Add `getNetWorthHistory()` function; extend `getCategorySummary()` with `type` param |
| `routes/dashboard.routes.ts` | Modify | Add `GET /net-worth-history` route |
| `routes/dashboard.schemas.ts` | Modify | Add Zod schemas for new endpoint params |
| `controllers/dashboard.controller.ts` | Modify | Add `getNetWorthHistory` handler |
| `services/transaction.service.ts` | Modify | Add `exportTransactions()` function (CSV generation) |
| `routes/transaction.routes.ts` | Modify | Add `GET /export` route |
| `routes/transaction.schemas.ts` | Modify | Add Zod schema for export params |
| `controllers/transaction.controller.ts` | Modify | Add `exportTransactions` handler |

### Frontend (client/src/)

| File | Action | Purpose |
|------|--------|---------|
| `pages/ReportsPage.tsx` | Modify | Build out full reports page (currently a stub) |
| `components/reports/DateRangeSelector.tsx` | Create | Reusable date range picker with presets |
| `components/reports/NetWorthChart.tsx` | Create | Line chart for net worth over time |
| `components/reports/SpendingBreakdown.tsx` | Create | Table + donut chart for expense categories |
| `components/reports/MonthlyComparison.tsx` | Create | Current vs previous month comparison cards |
| `components/reports/IncomeBreakdown.tsx` | Create | Table + chart for income sources |
| `components/reports/ExportButton.tsx` | Create | CSV export trigger with filter awareness |
| `services/api.ts` | Modify | Add `dashboardApi.netWorthHistory()` and `transactionsApi.export()` |

## Patterns to Follow

### Backend Service Pattern
```typescript
// In dashboard.service.ts — follow existing getMonthlyTotals() pattern:
// 1. Fetch user's baseCurrency
// 2. Query transactions with Prisma where clause
// 3. Build rateCache Map for currency conversion
// 4. Aggregate and return typed result
```

### Frontend Component Pattern
```typescript
// In each report component — follow existing dashboard component pattern:
// 1. useState for data, loading, error
// 2. useEffect triggered by date range prop changes
// 3. Fetch from API, handle loading/error states
// 4. Render Recharts chart inside <ResponsiveContainer>
```

### API Call Pattern
```typescript
// In services/api.ts — follow existing dashboardApi pattern:
// export const dashboardApi = {
//   netWorthHistory: (params) => apiFetch<T>(`/dashboard/net-worth-history?${qs}`),
// };
```

## Testing Approach

1. **Backend**: Test new service functions with various date ranges, multi-currency accounts, and edge cases (no data, single transaction, transfers)
2. **Frontend**: Verify components render with mock data, handle loading/error/empty states, and respond to date range changes
3. **Integration**: End-to-end flow — login, navigate to Reports, select date ranges, verify charts update, export CSV

## Verification

After implementation, verify:
- [ ] Reports page loads at `/reports` with date range selector
- [ ] Net worth line chart renders with correct historical data
- [ ] Spending breakdown shows categories with percentages
- [ ] Monthly comparison shows current vs previous month
- [ ] Income breakdown shows income sources
- [ ] CSV export downloads with correct filtered data
- [ ] All reports respect the selected date range
- [ ] Empty states display when no data available
