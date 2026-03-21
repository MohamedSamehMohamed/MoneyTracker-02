# Implementation Plan: Stock Portfolio Tracking

**Branch**: `005-stock-portfolio-tracking` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-stock-portfolio-tracking/spec.md`

## Summary

Add stock portfolio tracking to the MoneyTracker app. Users can record stock purchases and sales (company, shares, price, date), view an aggregated portfolio grouped by company with average cost and total invested, view stock transaction history with filters, and optionally link stock transactions to existing financial accounts for balance consistency. Stock transactions are a new entity separate from the existing income/expense/transfer system. Average cost method is used for gain/loss calculations.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**: Express 4.18, Prisma 6.19, React 19, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4
**Storage**: PostgreSQL via Prisma ORM (existing)
**Testing**: Manual testing (no test framework currently configured)
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: Web application (React SPA + Express REST API)
**Performance Goals**: Portfolio view < 2s with 100+ stocks, stock history < 1s with filters
**Constraints**: Fractional shares (Decimal storage), no external market data APIs
**Scale/Scope**: Single-user personal finance app, <1000 stock transactions expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is a blank template — no project-specific principles defined. No gates to enforce.

**Post-Phase 1 re-check**: N/A — no constitution gates.

## Project Structure

### Documentation (this feature)

```text
specs/005-stock-portfolio-tracking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── stock-api.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── prisma/
│   └── schema.prisma          # Add StockTransaction model + StockTransactionType enum
├── src/
│   ├── controllers/
│   │   └── stock.controller.ts
│   ├── routes/
│   │   ├── stock.routes.ts
│   │   └── stock.schemas.ts
│   └── services/
│       └── stock.service.ts

client/
├── src/
│   ├── components/
│   │   └── stocks/
│   │       ├── StockTransactionFormModal.tsx
│   │       ├── StockTransactionItem.tsx
│   │       ├── StockTransactionList.tsx
│   │       ├── StockPortfolioCard.tsx
│   │       ├── StockPortfolioList.tsx
│   │       ├── StockFilters.tsx
│   │       └── DeleteStockTransactionDialog.tsx
│   ├── pages/
│   │   └── StocksPage.tsx
│   ├── services/
│   │   └── api.ts              # Add stocksApi section
│   └── types/
│       └── stock.ts
```

**Structure Decision**: Follows the existing web application pattern with `server/` and `client/` directories. New stock files mirror the transaction feature's controller/service/routes/schemas pattern on the backend and components/pages/types pattern on the frontend. Stock portfolio is a new top-level page (`/stocks`) in the sidebar.
