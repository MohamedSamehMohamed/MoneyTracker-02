# Implementation Plan: Transactions (Core Feature)

**Branch**: `004-transactions-core` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-transactions-core/spec.md`

## Summary

Implement full transaction management (income, expense, transfer) with balance tracking, paginated listing with filters, edit, and delete. Transactions atomically update account balances. Follows the established Express + Prisma + React patterns from Phases 2-3.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**: Express 4.18, Prisma 6.19, React 19, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4
**Storage**: PostgreSQL via Prisma ORM (Transaction model already exists)
**Testing**: Manual testing via curl and browser (no test framework configured yet)
**Target Platform**: Web application (server on :3001, client on :5173)
**Project Type**: Full-stack web application
**Performance Goals**: Transaction list loads within 2 seconds with 1000+ records; filters respond within 1 second
**Constraints**: BigInt amounts serialized as string; balance updates must be atomic (Prisma $transaction); dates must be today or past
**Scale/Scope**: Typical user may have hundreds to thousands of transactions; pagination required (default 20/page)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template -- no gates defined. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/004-transactions-core/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── transactions-api.md  # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/transaction.controller.ts  # NEW: Request handlers
│   ├── services/transaction.service.ts        # NEW: Business logic + balance updates
│   ├── routes/transaction.routes.ts           # NEW: Express router
│   ├── routes/transaction.schemas.ts          # NEW: Zod schemas
│   └── index.ts                               # MODIFY: Register transaction routes

client/
├── src/
│   ├── pages/TransactionsPage.tsx             # NEW: Transaction history + filters
│   ├── components/transactions/
│   │   ├── TransactionList.tsx                # NEW: Paginated transaction list
│   │   ├── TransactionItem.tsx                # NEW: Single transaction row
│   │   ├── TransactionFormModal.tsx           # NEW: Create/edit modal
│   │   ├── TransactionFilters.tsx             # NEW: Filter controls
│   │   └── DeleteTransactionDialog.tsx        # NEW: Confirmation dialog
│   ├── services/api.ts                        # MODIFY: Add transactionsApi + categoriesApi
│   ├── types/transaction.ts                   # NEW: TypeScript types
│   └── App.tsx                                # MODIFY: Add /transactions route
```

**Structure Decision**: Follows existing web application pattern with separate server/ and client/ directories. New files mirror the accounts module structure (schemas -> routes -> controllers -> services).
