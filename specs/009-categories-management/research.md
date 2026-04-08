# Research: Categories Management

**Feature**: 009-categories-management  
**Date**: 2026-04-08

## R1: Category CRUD Backend Patterns

**Decision**: Follow the existing account CRUD pattern — separate route file with Zod schemas, controller handlers, and service layer with Prisma.

**Rationale**: The project already has a well-established pattern in `account.routes.ts` → `account.controller.ts` → `account.service.ts`. Consistency reduces cognitive load and makes the codebase predictable.

**Alternatives considered**:
- Inline controller logic (rejected — breaks separation of concerns already established)
- Combined route+controller file (rejected — doesn't match existing patterns)

## R2: Name Uniqueness Validation (Including System Defaults)

**Decision**: Validate uniqueness at the service layer by querying for categories where `(userId = currentUser OR userId IS NULL) AND name = input AND type = input`. Return 409 Conflict if found.

**Rationale**: Per clarification, custom names must not duplicate system defaults of the same type. A single query checking both user-owned and system categories is efficient and correct.

**Alternatives considered**:
- Database unique constraint (rejected — can't express "unique per user + system defaults" as a simple DB constraint since system defaults have null userId)
- Frontend-only validation (rejected — must be enforced server-side for data integrity)

## R3: Delete Protection for In-Use Categories

**Decision**: Before deleting, count transactions referencing the category. If count > 0, return 409 with the transaction count in the error message.

**Rationale**: The `categoryId` FK in Transaction has `onDelete: SetNull`, meaning Prisma would allow deletion but orphan transactions. We need explicit protection to meet FR-005 and FR-010.

**Alternatives considered**:
- Change FK to onDelete: Restrict (rejected — would require schema migration and affects existing behavior)
- Allow deletion with reassignment (rejected — spec explicitly requires blocking deletion of in-use categories)

## R4: Icon Set Implementation

**Decision**: Use emoji characters as icons (matching the existing seed data pattern: 🍔, 🚗, 💼, etc.). Define a curated icon picker in the frontend with ~30-40 common financial/lifestyle emojis.

**Rationale**: Seed data already uses emoji strings. No icon library dependency needed. Emojis render natively on all modern platforms and are stored as simple strings in the existing `icon VARCHAR(50)` column.

**Alternatives considered**:
- Lucide/Heroicons SVG library (rejected — would require changing existing seed data icons and adding a dependency)
- User-uploaded images (rejected — per spec assumption, icons are predefined)

## R5: Color Picker Implementation

**Decision**: Provide a preset palette of ~12-16 colors with a hex input fallback. Colors stored as hex strings (e.g., "#FF6B6B") in the existing `color VARCHAR(7)` column.

**Rationale**: A preset palette makes selection fast (under 30 seconds per SC-001). The hex fallback provides flexibility for power users. This matches the pattern already used in seed data.

**Alternatives considered**:
- Full HSL color picker (rejected — over-engineered for category colors)
- Named colors only (rejected — too limiting)

## R6: Frontend State Management

**Decision**: Use local component state (useState + useEffect) with direct API calls, matching the AccountsPage pattern. Use modal dialogs for create/edit forms and delete confirmation.

**Rationale**: The project uses no global state management beyond AuthContext. AccountsPage demonstrates the established pattern with loading/error states and modals.

**Alternatives considered**:
- React Query/TanStack Query (listed in plan.md but not installed or used anywhere in the project)
- Redux/Zustand (rejected — no existing usage, overkill for this scope)

## R7: System vs Custom Category Differentiation

**Decision**: In the UI, show all categories in a single list grouped by type (income/expense). Custom categories display edit/delete action buttons; system defaults show no action buttons. A subtle label or badge distinguishes "System" from "Custom" categories.

**Rationale**: Meets FR-006 (no edit/delete on system defaults) and FR-009 (grouped by type). Visual distinction helps users understand which categories they own.

**Alternatives considered**:
- Separate tabs for system vs custom (rejected — adds navigation complexity; users want to see everything together)
- Hide system defaults entirely (rejected — users need to see all available categories)
