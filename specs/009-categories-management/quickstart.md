# Quickstart: Categories Management

**Feature**: 009-categories-management  
**Date**: 2026-04-08

## Prerequisites

- PostgreSQL running with existing MoneyTrackerNew database
- Node.js 18+
- Existing seed data applied (default categories exist)

## Development Setup

```bash
# Terminal 1 - Backend
cd server
npm run dev    # Runs on :3001

# Terminal 2 - Frontend
cd client
npm run dev    # Runs on :5173
```

## Key Files to Create/Modify

### Backend (server/)

| File | Action | Purpose |
|------|--------|---------|
| `src/routes/category.routes.ts` | Modify | Add POST, PATCH /:id, DELETE /:id routes |
| `src/routes/category.schemas.ts` | Create | Zod validation schemas for create/update |
| `src/controllers/category.controller.ts` | Modify | Add create, update, delete handlers |
| `src/services/category.service.ts` | Create | Business logic: CRUD, uniqueness, delete protection |

### Frontend (client/)

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/CategoriesPage.tsx` | Modify | Full categories UI (currently placeholder) |
| `src/services/api.ts` | Modify | Add create, update, delete to categoriesApi |
| `src/components/CategoryForm.tsx` | Create | Modal form for create/edit with icon & color pickers |
| `src/components/IconPicker.tsx` | Create | Emoji icon selection grid |
| `src/components/ColorPicker.tsx` | Create | Preset color palette with hex input |

### No Changes Needed

- `prisma/schema.prisma` — Category model already has all required fields
- `prisma/seed.ts` — Default categories already seeded
- `src/middleware/` — Existing auth and validate middleware reused as-is

## Verification Steps

1. Login to the app
2. Navigate to `/categories`
3. Verify system defaults display grouped by income/expense
4. Create a custom category with name, type, icon, color
5. Verify it appears in the list and in transaction form dropdowns
6. Edit the custom category's name and color
7. Try to delete it (should succeed if no transactions)
8. Assign it to a transaction, then try deleting (should be blocked with count)

## Patterns to Follow

- **Routes**: See `account.routes.ts` for CRUD route pattern
- **Schemas**: See `account.schemas.ts` for Zod validation pattern
- **Controller**: See `account.controller.ts` for handler pattern (extract userId, call service, return response)
- **Service**: See `account.service.ts` for Prisma operations with error handling
- **Page**: See `AccountsPage.tsx` for modal-based CRUD UI pattern
- **API client**: See `api.ts` `accountsApi` object for fetch wrapper pattern
