# Implementation Plan: Accounts Management

**Branch**: `003-accounts-management` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-accounts-management/spec.md`

## Summary

Implement full CRUD for user accounts (money sources) — the core entity enabling financial tracking. Users can create, view, edit, and delete accounts of types cash/bank/wallet/gold with any supported currency. Follows the established Express + Prisma + React patterns from Phase 2.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**: Express 4.18, Prisma 6.19, React 19, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4
**Storage**: PostgreSQL via Prisma ORM (Account model already exists)
**Testing**: Manual testing via curl and browser (no test framework configured yet)
**Target Platform**: Web application (server on :3001, client on :5173)
**Project Type**: Full-stack web application
**Performance Goals**: Accounts list loads within 2 seconds
**Constraints**: BigInt balance must be serialized as string in JSON responses
**Scale/Scope**: Typical user has 5-20 accounts; no pagination needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no gates defined. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/003-accounts-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── accounts-api.md  # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/account.controller.ts    # NEW: Request handlers
│   ├── services/account.service.ts          # NEW: Business logic
│   ├── routes/account.routes.ts             # NEW: Express router
│   ├── routes/account.schemas.ts            # NEW: Zod schemas
│   └── index.ts                             # MODIFY: Register routes

client/
├── src/
│   ├── pages/AccountsPage.tsx               # MODIFY: Replace placeholder
│   ├── components/accounts/
│   │   ├── AccountList.tsx                  # NEW: Accounts grid
│   │   ├── AccountCard.tsx                  # NEW: Account display card
│   │   ├── AccountFormModal.tsx             # NEW: Create/edit modal
│   │   └── DeleteAccountDialog.tsx          # NEW: Confirmation dialog
│   ├── services/api.ts                      # MODIFY: Add accountsApi
│   └── types/account.ts                     # NEW: TypeScript types
```

**Structure Decision**: Follows existing web application pattern with separate server/ and client/ directories. New files mirror the auth module structure (routes -> controllers -> services).
