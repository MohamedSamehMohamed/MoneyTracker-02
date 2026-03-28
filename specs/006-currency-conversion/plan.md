# Implementation Plan: Exchange Rates & Currency Conversion

**Branch**: `006-currency-conversion` | **Date**: 2026-03-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-currency-conversion/spec.md`

## Summary

Add multi-currency support to MoneyTracker: automatic exchange rate fetching (forex + gold), net worth aggregation in the user's base currency, transaction conversion display, manual rate overrides, and a dedicated exchange rates view. All conversions computed on-the-fly using USD-based reference rates with cross-rate derivation.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**: Express 4.18, Prisma 6.19, React 19, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4
**Storage**: PostgreSQL via Prisma ORM (ExchangeRate model already exists)
**Testing**: TypeScript compiler (`tsc --noEmit`) for type checking, ESLint for linting
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: Web application (client + server)
**Performance Goals**: Dashboard net worth loads within 2 seconds; rate fetch completes within 10 seconds
**Constraints**: Free-tier rate API (1,500 req/month); 4 fetches/day; single-server deployment
**Scale/Scope**: Personal finance tracker, single user at a time, modest data volumes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains only template placeholders (no project-specific principles defined). **No gates to evaluate.** Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/006-currency-conversion/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── exchange-rate-endpoints.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/
│   │   └── exchange-rate.controller.ts    # NEW
│   ├── services/
│   │   ├── exchange-rate.service.ts       # NEW — core conversion + fetching logic
│   │   └── rate-scheduler.ts              # NEW — startup + interval fetching
│   ├── routes/
│   │   ├── exchange-rate.routes.ts        # NEW
│   │   └── exchange-rate.schemas.ts       # NEW — Zod validation
│   ├── index.ts                           # MODIFIED — register routes + start scheduler
│   └── utils/
│       └── prisma.ts                      # EXISTING
├── prisma/
│   └── schema.prisma                      # EXISTING — no changes needed

client/
├── src/
│   ├── pages/
│   │   ├── DashboardPage.tsx              # MODIFIED — add net worth widget
│   │   ├── ExchangeRatesPage.tsx          # NEW
│   │   └── SettingsPage.tsx               # MODIFIED — add base currency selector
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── NetWorthCard.tsx           # NEW
│   │   └── exchange-rates/
│   │       ├── RateList.tsx               # NEW
│   │       └── RateOverrideModal.tsx      # NEW
│   ├── components/transactions/
│   │   └── TransactionItem.tsx            # MODIFIED — show converted amounts
│   ├── services/
│   │   └── api.ts                         # MODIFIED — add exchangeRatesApi
│   └── types/
│       └── exchange-rate.ts               # NEW
```

**Structure Decision**: Follows existing web application pattern (server/ + client/) established by prior features. New files follow existing naming conventions (e.g., `*.service.ts`, `*.controller.ts`, `*.routes.ts`).

## Complexity Tracking

No constitution violations — no entries needed.
