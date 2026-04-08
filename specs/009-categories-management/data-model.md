# Data Model: Categories Management

**Feature**: 009-categories-management  
**Date**: 2026-04-08

## Entities

### Category (existing — no schema changes required)

The Category model already exists in `server/prisma/schema.prisma` with all required fields.

| Field    | Type         | Constraints                     | Description                                      |
|----------|--------------|---------------------------------|--------------------------------------------------|
| id       | String (UUID)| PK, auto-generated              | Unique identifier                                |
| userId   | String?      | FK → User, nullable, onDelete Cascade | null = system default, non-null = user-owned |
| name     | String       | VARCHAR(50), required           | Display name                                     |
| type     | CategoryType | enum(income, expense), required | Transaction type this category applies to        |
| icon     | String?      | VARCHAR(50), nullable           | Emoji character (e.g., "🍔"). Default: "📌"     |
| color    | String?      | VARCHAR(7), nullable            | Hex color (e.g., "#FF6B6B"). Default: "#D3D3D3"  |

**Relations**:
- `user` → User? (owner, nullable for system defaults)
- `transactions` → Transaction[] (categories referenced by transactions)

### Transaction (existing — no changes)

Relevant field: `categoryId String?` with `onDelete: SetNull`. This means if a category were deleted at the DB level, referencing transactions would have their categoryId set to null. However, the application enforces deletion blocking (FR-005) before reaching the DB.

## Validation Rules

### Create Category
- `name`: required, string, min 1 char, max 50 chars, trimmed
- `type`: required, enum("income", "expense")
- `icon`: optional, string, max 50 chars
- `color`: optional, string, must match hex pattern `/^#[0-9A-Fa-f]{6}$/`

### Update Category
- `name`: optional, string, min 1 char, max 50 chars, trimmed
- `icon`: optional, string, max 50 chars
- `color`: optional, string, must match hex pattern `/^#[0-9A-Fa-f]{6}$/`
- `type`: NOT allowed (immutable after creation per FR-004)

### Uniqueness Constraint (application-level)
- On create/update: no other category with the same `name` + `type` may exist where `userId = currentUser` OR `userId IS NULL` (system default)
- Uniqueness check excludes the category being updated (for edit operations)

## State Transitions

Categories have no explicit state machine. Lifecycle:
1. **Created** → exists with all fields set (icon/color defaulted if omitted)
2. **Updated** → name, icon, color can change; type is immutable
3. **Deleted** → only if zero transactions reference it; permanent removal

## Default Values (from seed data)

**Expense categories** (9): Food, Transport, Rent, Entertainment, Shopping, Health, Utilities, Education, Other  
**Income categories** (5): Salary, Freelance, Investment, Gift, Other

Each has an emoji icon and hex color already assigned.
