# Implementation Plan: Dashboard & Summary

**Branch**: `007-dashboard-summary` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-dashboard-summary/spec.md`

## Summary

Build a comprehensive dashboard that provides users a complete financial overview on a single page. This includes: net worth display (existing), account balance cards, recent transactions list, monthly income vs. expense bar chart, spending-by-category donut chart, income vs. expense trend line chart, quick-add transaction modal, and exchange rate freshness indicator. Requires 3 new server endpoints for aggregated chart data (with historical rate conversion and transfer exclusion) and Recharts-based chart components on the client.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (server), TypeScript 5.9 + React 19 (client)
**Primary Dependencies**: Express 4.18, Prisma 6.19, Recharts (to install), React Hook Form 7.71, Zod 4.3, Tailwind CSS 4.2
**Storage**: PostgreSQL via Prisma ORM (existing models: User, Account, Transaction, Category, ExchangeRate)
**Testing**: No test framework configured yet; manual testing via browser + API
**Target Platform**: Web application (browser)
**Project Type**: Web application (full-stack: Express API + React SPA)
**Performance Goals**: Dashboard loads within 3 seconds; charts render for 1,000+ transactions without degradation
**Constraints**: Historical chart aggregations must use end-of-month exchange rates; transfers excluded from income/expense charts
**Scale/Scope**: Single-user personal finance app; ~1,000+ transactions typical

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no gates defined. Proceeding without violations.

## Project Structure

### Documentation (this feature)

```text
specs/007-dashboard-summary/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── dashboard-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/
│   │   └── dashboard.controller.ts     # NEW: spending-chart, income-vs-expense, category-summary
│   ├── services/
│   │   └── dashboard.service.ts        # NEW: aggregation queries with historical rate conversion
│   ├── routes/
│   │   ├── dashboard.routes.ts         # NEW: /api/dashboard/* endpoints
│   │   └── dashboard.schemas.ts        # NEW: Zod validation schemas
│   └── index.ts                        # UPDATE: mount dashboard router

client/
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       ├── NetWorthCard.tsx             # EXISTS: enhance with stale rate warning
│   │       ├── AccountBalanceCards.tsx       # NEW: individual account cards grid
│   │       ├── RecentTransactions.tsx        # NEW: last 10 transactions list
│   │       ├── SpendingChart.tsx             # NEW: monthly income vs expense bar chart
│   │       ├── CategoryBreakdown.tsx         # NEW: donut chart with period selector
│   │       ├── IncomeExpenseTrend.tsx        # NEW: line chart
│   │       ├── QuickAddTransaction.tsx       # NEW: modal trigger + form
│   │       └── ExchangeRateIndicator.tsx     # NEW: last-updated with stale warning
│   ├── pages/
│   │   └── DashboardPage.tsx               # UPDATE: compose all dashboard components
│   ├── services/
│   │   └── api.ts                          # UPDATE: add dashboard API functions
│   └── types/
│       └── dashboard.ts                    # NEW: dashboard response types
```

**Structure Decision**: Follows existing web application pattern with server/ and client/ directories. New dashboard endpoints get their own route/controller/service triplet on the server. Client components are organized under the existing `components/dashboard/` directory.

## Complexity Tracking

No constitution violations to justify.
