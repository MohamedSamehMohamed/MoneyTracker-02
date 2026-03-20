# Research: Database & Authentication

**Feature**: 002-database-auth | **Date**: 2026-03-20

## Prisma ORM with PostgreSQL

**Decision**: Use Prisma ORM as the database access layer with PostgreSQL.
**Rationale**: Already specified in the project plan. Prisma provides type-safe queries, auto-generated TypeScript types, and declarative schema migrations. PostgreSQL is ideal for relational financial data with ACID guarantees.
**Alternatives considered**:
- TypeORM: More flexible but weaker TypeScript integration and less intuitive migration system.
- Drizzle ORM: Lighter weight but less mature ecosystem and tooling.
- Raw SQL (pg driver): Maximum control but no type safety, manual migration management.

## JWT Authentication Strategy

**Decision**: Use `jsonwebtoken` package with 7-day absolute expiration, tokens stored in localStorage.
**Rationale**: Simple stateless auth suitable for a personal finance app. No server-side session storage needed. Absolute expiration avoids complexity of refresh token rotation. localStorage persists across tabs and page refreshes.
**Alternatives considered**:
- httpOnly cookies: More secure against XSS but requires CSRF protection setup. Overkill for personal-use app.
- Refresh token rotation: Better security posture but adds significant complexity (token pairs, rotation logic, revocation). Deferred to future phase if needed.
- Session-based auth (express-session): Requires server-side session store, adds state management complexity.

## Password Hashing

**Decision**: Use `bcrypt` with default cost factor of 10.
**Rationale**: Industry standard for password hashing. Cost factor 10 provides ~100ms hash time, balancing security with responsiveness. Well-maintained `bcryptjs` package (pure JS) avoids native compilation issues.
**Alternatives considered**:
- Argon2: Newer, memory-hard algorithm. Better theoretical security but `argon2` npm package requires native compilation which can cause issues on some platforms.
- scrypt: Good alternative but less ecosystem support in Node.js.
- bcrypt (native): Faster than bcryptjs but requires node-gyp build toolchain.

**Note**: Using `bcryptjs` (pure JavaScript implementation) over `bcrypt` (native) to avoid native compilation dependencies on Windows.

## Request Validation

**Decision**: Use Zod for both server-side request validation and client-side form validation.
**Rationale**: Single validation schema language across client and server. Zod provides TypeScript-first schema declaration with automatic type inference. Integrates well with React Hook Form via `@hookform/resolvers/zod`.
**Alternatives considered**:
- Joi: Mature but TypeScript types are bolted on, not inferred.
- Yup: Popular with Formik but Zod has better TypeScript integration.
- express-validator: Server-only, different paradigm from client validation.

## Client HTTP Layer

**Decision**: Use native `fetch` wrapped in an API service module (no Axios).
**Rationale**: Reduces dependencies. Modern `fetch` API is available in all target browsers and Node.js 18+. A thin wrapper adds the auth header from localStorage and handles JSON parsing/error responses.
**Alternatives considered**:
- Axios: More features (interceptors, request cancellation) but adds a dependency for functionality achievable with fetch.
- TanStack Query: Will be added in future phases for server state management, but raw fetch is sufficient for auth flows.

## Client Form Handling

**Decision**: Use React Hook Form with Zod resolver for login/register forms.
**Rationale**: Performant (uncontrolled inputs), minimal re-renders, excellent Zod integration for validation. Industry standard for React form handling.
**Alternatives considered**:
- Controlled inputs with useState: Simpler but re-renders on every keystroke, manual validation logic.
- Formik: Heavier, slightly dated, less TypeScript-native than React Hook Form.

## Default Category Seeding

**Decision**: Seed categories as system-level records (user_id = null) via Prisma seed script.
**Rationale**: Shared system categories avoid duplication across users. Prisma's seed mechanism (`prisma db seed`) runs idempotently and integrates with the migration workflow.
**Alternatives considered**:
- Per-user category duplication on registration: More flexibility per user but wastes storage and complicates updates to default categories.
- Hardcoded categories in application code: No database overhead but loses the ability to query/filter consistently with user categories.

## Gold Balance Unit

**Decision**: Store gold balances as integer grams.
**Rationale**: Clarified with user — grams (integer) provides sufficient precision for personal gold tracking without sub-gram complexity. Consistent with the integer storage pattern used for piasters (EGP) and cents (USD/EUR).
**Alternatives considered**:
- Milligrams: Higher precision but unnecessary for personal tracking and increases number magnitude.
- Decimal type: Avoids integer conversion but introduces floating-point concerns.
