# Implementation Plan: Reports & Analytics

**Branch**: `008-reports-analytics` | **Date**: 2026-04-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-reports-analytics/spec.md`

## Summary

Add a comprehensive Reports & Analytics page that provides detailed financial insights beyond the existing dashboard. Includes net worth tracking over time, spending/income breakdowns by category, month-over-month comparison, and CSV transaction export — all controlled by a unified date range selector. Leverages existing dashboard aggregation infrastructure (`dashboard.service.ts`) and Recharts charting library. Requires 2 new backend endpoints (net worth history, CSV export) and 1 extension to an existing endpoint (category summary with type filter).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (server), TypeScript 5.9 + React 19 (client)  
**Primary Dependencies**: Express 4.18, Prisma 6.19, Recharts 3.8.1, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4.2, React Router 7  
**Storage**: PostgreSQL via Prisma ORM (existing models: User, Account, Transaction, Category, ExchangeRate)  
**Testing**: Manual verification (no test framework configured)  
**Target Platform**: Web browser (desktop + mobile responsive)  
**Project Type**: Web application (client-server)  
**Performance Goals**: All reports render within 3 seconds of date range selection  
**Constraints**: No new database migrations; all report data derived from existing tables  
**Scale/Scope**: Personal finance app — hundreds to low thousands of transactions per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not configured (template only). No gates to enforce. Proceeding.

**Post-Phase 1 re-check**: No constitution violations — N/A.

## Project Structure

### Documentation (this feature)

```text
specs/008-reports-analytics/
├── plan.md              # This file
├── research.md          # Phase 0 output — 8 decisions documented
├── data-model.md        # Phase 1 output — derived data structures
├── quickstart.md        # Phase 1 output — dev setup & key files
├── contracts/
│   └── api-endpoints.md # Phase 1 output — API contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── routes/
│   │   ├── dashboard.routes.ts      # Add GET /net-worth-history
│   │   ├── dashboard.schemas.ts     # Add net-worth-history schema, extend category-summary
│   │   ├── transaction.routes.ts    # Add GET /export
│   │   └── transaction.schemas.ts   # Add export schema
│   ├── controllers/
│   │   ├── dashboard.controller.ts  # Add getNetWorthHistory handler
│   │   └── transaction.controller.ts # Add exportTransactions handler
│   └── services/
│       ├── dashboard.service.ts     # Add getNetWorthHistory(), extend getCategorySummary()
│       └── transaction.service.ts   # Add exportTransactions()

client/
├── src/
│   ├── pages/
│   │   └── ReportsPage.tsx          # Build out (currently stub)
│   ├── components/
│   │   └── reports/                 # New directory
│   │       ├── DateRangeSelector.tsx
│   │       ├── NetWorthChart.tsx
│   │       ├── SpendingBreakdown.tsx
│   │       ├── MonthlyComparison.tsx
│   │       ├── IncomeBreakdown.tsx
│   │       └── ExportButton.tsx
│   └── services/
│       └── api.ts                   # Add netWorthHistory() and export() methods
```

**Structure Decision**: Follows existing web app structure (server/ + client/). New frontend components go under `components/reports/` mirroring the existing `components/dashboard/` pattern. No new top-level directories needed.

## Complexity Tracking

No constitution violations to justify — N/A.
