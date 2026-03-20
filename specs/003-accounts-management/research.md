# Research: Accounts Management

**Feature**: 003-accounts-management
**Date**: 2026-03-20

## Existing Infrastructure

### Decision: Follow existing auth module patterns
- **Rationale**: The codebase already has a clear pattern: Zod schemas -> validate middleware -> controller -> service -> Prisma. Following this pattern ensures consistency and reduces cognitive load.
- **Alternatives considered**: Adding a repository layer, using class-based controllers. Rejected — unnecessary abstraction for this scope.

### Decision: Use existing Prisma Account model as-is
- **Rationale**: The Account model (schema.prisma lines 36-53) already defines all needed fields: id, userId, name, type (AccountType enum), currency, balance (BigInt), icon, timestamps. No schema changes needed.
- **Alternatives considered**: Adding a `description` field, adding `isActive` for soft delete. Rejected — not in spec requirements; YAGNI.

### Decision: BigInt balance formatting on the client
- **Rationale**: Prisma returns BigInt which JSON cannot serialize natively. The server will convert BigInt to string in responses. The client will handle display formatting (dividing by 100 for currencies, 1000 for gold).
- **Alternatives considered**: Server-side formatting. Rejected — client needs raw values for calculations; formatting is a presentation concern.

### Decision: No pagination for accounts list
- **Rationale**: A typical user will have 5-20 accounts. Pagination adds complexity with no practical benefit at this scale.
- **Alternatives considered**: Cursor-based pagination. Rejected — overkill for the expected data volume.

## Technology Choices

### Server-side
- **Zod** for request validation (already installed, v4.3.6)
- **Prisma** for database operations (already configured)
- **Express Router** with auth middleware (existing pattern)

### Client-side
- **React Hook Form + Zod** for form handling (already installed)
- **apiFetch** utility for API calls (existing in services/api.ts)
- No additional dependencies needed

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| BigInt serialization in JSON responses | Convert to string in service layer before returning |
| Concurrent delete + transaction creation race | Balance-zero check is server-side; database constraints enforce integrity |
