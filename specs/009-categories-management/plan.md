# Implementation Plan: Categories Management

**Branch**: `009-categories-management` | **Date**: 2026-04-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-categories-management/spec.md`

## Summary

Users can fully manage their transaction categories — view system defaults and custom categories, create new categories with name/type/icon/color, edit custom categories, and delete unused custom categories. The implementation extends the existing read-only category endpoint with full CRUD operations on the backend, and replaces the placeholder CategoriesPage with a functional UI following the established AccountsPage pattern.

## Technical Context

**Language/Version**: TypeScript 5.3 (server) / TypeScript 5.9 (client)  
**Primary Dependencies**: Express 4.18, Prisma 6.19, React 19, Zod 4.3, React Hook Form 7.71, Tailwind CSS 4.2, React Router 7  
**Storage**: PostgreSQL via Prisma ORM (Category model already exists)  
**Testing**: No testing framework configured  
**Target Platform**: Web application (Node.js server + React SPA)  
**Project Type**: Web service (Express API) + Web application (React SPA)  
**Performance Goals**: Page load within 2 seconds (SC-002), category creation under 30 seconds (SC-001)  
**Constraints**: Category name max 50 chars, color max 7 chars (hex), icon max 50 chars  
**Scale/Scope**: Single-user personal finance app, ~14 default categories + user customs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is an unfilled template — no principles or gates defined. No violations possible. Gate passes.

**Post-Phase 1 re-check**: Still passes (no constitution gates to evaluate).

## Project Structure

### Documentation (this feature)

```text
specs/009-categories-management/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── categories-api.md # API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── routes/
│   │   ├── category.routes.ts      # MODIFY: Add POST, PATCH, DELETE routes
│   │   └── category.schemas.ts     # CREATE: Zod validation schemas
│   ├── controllers/
│   │   └── category.controller.ts  # MODIFY: Add create, update, delete handlers
│   └── services/
│       └── category.service.ts     # CREATE: Category business logic
└── prisma/
    └── schema.prisma               # NO CHANGES (model exists)

client/
├── src/
│   ├── pages/
│   │   └── CategoriesPage.tsx      # MODIFY: Full CRUD UI (replace placeholder)
│   ├── components/
│   │   ├── CategoryForm.tsx        # CREATE: Modal form for create/edit
│   │   ├── IconPicker.tsx          # CREATE: Emoji icon selection grid
│   │   └── ColorPicker.tsx         # CREATE: Color preset palette + hex input
│   ├── services/
│   │   └── api.ts                  # MODIFY: Add categoriesApi CRUD methods
│   └── types/
│       └── transaction.ts          # NO CHANGES (Category type exists)
```

**Structure Decision**: Follows existing web application structure with `server/` and `client/` directories. 4 files modified, 5 files created. No new directories needed beyond adding component files.

## Complexity Tracking

No constitution violations to justify.
