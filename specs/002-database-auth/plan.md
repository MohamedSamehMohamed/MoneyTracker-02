# Implementation Plan: Database & Authentication

**Branch**: `002-database-auth` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-database-auth/spec.md`

## Summary

Implement the complete database schema (Users, Accounts, Transactions, Categories, Exchange Rates) using Prisma ORM with PostgreSQL, and build the full authentication flow (register, login, JWT tokens, auth middleware) on both server and client. This establishes the data layer and security boundary for all subsequent phases.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**:
- Server: Express 4.x, Prisma ORM, bcrypt, jsonwebtoken, Zod
- Client: React 19, React Router 7, React Hook Form, Zod
**Storage**: PostgreSQL via Prisma ORM
**Testing**: Vitest (unit), Supertest (API integration)
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: Web service (REST API) + SPA (React)
**Performance Goals**: Auth operations complete in under 1 second
**Constraints**: Passwords stored as bcrypt hashes, JWT with 7-day absolute expiration, tokens in localStorage
**Scale/Scope**: Single-user personal finance app, minimal concurrent load

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is unconfigured (template placeholders only). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/002-database-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── prisma/
│   ├── schema.prisma         # Database schema (all 5 models)
│   └── seed.ts               # Default category seeding
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── health.ts          # (existing)
│   │   └── auth.routes.ts
│   ├── services/
│   │   └── auth.service.ts
│   ├── types/
│   │   └── express.d.ts       # Extend Express Request with user
│   ├── utils/
│   │   └── jwt.ts
│   └── index.ts               # (existing, add auth routes)
├── package.json
└── tsconfig.json

client/src/
├── contexts/
│   └── AuthContext.tsx         # Auth state, login/logout, token management
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx  # Redirect to /login if unauthenticated
├── services/
│   └── api.ts                 # Axios/fetch wrapper with auth header
├── pages/
│   ├── LoginPage.tsx          # (existing, implement form)
│   └── RegisterPage.tsx       # (existing, implement form)
├── types/
│   └── auth.ts                # User, LoginRequest, RegisterRequest types
└── App.tsx                    # (existing, wrap with AuthProvider + ProtectedRoute)
```

**Structure Decision**: Follows the existing monorepo layout from Phase 1 (`server/` + `client/`). New files are added within the established directory structure. No structural changes needed.

## Complexity Tracking

No constitution violations to justify.
