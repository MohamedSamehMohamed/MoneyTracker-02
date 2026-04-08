# Tasks: Categories Management

**Input**: Design documents from `/specs/009-categories-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/categories-api.md, quickstart.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared backend service layer and validation schemas that all user stories depend on.

- [ ] T001 [P] Create category Zod validation schemas (createCategorySchema, updateCategorySchema) in `server/src/routes/category.schemas.ts`
- [ ] T002 [P] Create category service with Prisma operations (list, create, update, delete, uniqueness check, transaction count) in `server/src/services/category.service.ts`
- [ ] T003 [P] Add `userId: string | null` field to Category interface in `client/src/types/transaction.ts`

**Checkpoint**: Shared schemas and service layer ready — route and UI work can proceed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the existing category routes and API client with all CRUD endpoints. This MUST complete before UI stories can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Add POST, PATCH /:id, DELETE /:id routes with validateMiddleware to `server/src/routes/category.routes.ts`
- [ ] T005 Add createCategoryHandler, updateCategoryHandler, deleteCategoryHandler to `server/src/controllers/category.controller.ts`
- [ ] T006 Add create, update, delete methods to categoriesApi in `client/src/services/api.ts`

**Checkpoint**: Full CRUD API operational and client can call all endpoints.

---

## Phase 3: User Story 1 — View All Categories (Priority: P1) 🎯 MVP

**Goal**: Replace the placeholder CategoriesPage with a functional page that displays all system default and custom categories grouped by type (income/expense) with icons and colors.

**Independent Test**: Log in, navigate to /categories, verify seeded default categories appear grouped by type with icons and colors. Custom categories (if any) appear visually distinct from system defaults.

### Implementation for User Story 1

- [ ] T007 [US1] Build CategoriesPage layout with income/expense group sections, loading state, error banner, and empty state prompt in `client/src/pages/CategoriesPage.tsx`
- [ ] T008 [US1] Display each category as a card/row with icon (emoji), color swatch, name, and system/custom badge in `client/src/pages/CategoriesPage.tsx`
- [ ] T009 [US1] Wire up data fetching using categoriesApi.list() on mount and render category groups in `client/src/pages/CategoriesPage.tsx`

**Checkpoint**: CategoriesPage displays all categories grouped by type. MVP is functional and testable.

---

## Phase 4: User Story 2 — Create Custom Category (Priority: P1)

**Goal**: Users can create a custom category with name, type, and optional icon/color via a modal form. New category appears immediately in the list and in transaction form dropdowns.

**Independent Test**: Click "Add Category", fill in name and type (leave icon/color empty to test defaults), submit. Verify it appears in the categories list under the correct type group. Navigate to add transaction and verify it appears in the category dropdown.

### Implementation for User Story 2

- [ ] T010 [P] [US2] Create IconPicker component with curated emoji grid (~30-40 financial/lifestyle emojis) in `client/src/components/IconPicker.tsx`
- [ ] T011 [P] [US2] Create ColorPicker component with ~16 preset colors and hex input fallback in `client/src/components/ColorPicker.tsx`
- [ ] T012 [US2] Create CategoryForm modal component with name input (max 50 chars), type select (income/expense), IconPicker, ColorPicker, and validation using React Hook Form + Zod in `client/src/components/CategoryForm.tsx`
- [ ] T013 [US2] Add "Add Category" button and create modal state to CategoriesPage, call categoriesApi.create() on submit, refresh list on success, show error on duplicate name (409) in `client/src/pages/CategoriesPage.tsx`

**Checkpoint**: Users can create categories. Combined with US1, the full create-and-view flow works.

---

## Phase 5: User Story 3 — Edit Custom Category (Priority: P2)

**Goal**: Users can edit the name, icon, and color of their own custom categories. System defaults show no edit option. Type is immutable.

**Independent Test**: Create a custom category, click edit, change name and color, submit. Verify changes appear in the list. Verify system default categories have no edit button.

### Implementation for User Story 3

- [ ] T014 [US3] Add edit button (visible only on custom categories where userId is not null) to each category card in `client/src/pages/CategoriesPage.tsx`
- [ ] T015 [US3] Reuse CategoryForm in edit mode — pre-populate fields, hide type selector (immutable), call categoriesApi.update() on submit, refresh list on success, show duplicate name error in `client/src/pages/CategoriesPage.tsx`

**Checkpoint**: Edit flow works for custom categories. System defaults remain read-only.

---

## Phase 6: User Story 4 — Delete Custom Category (Priority: P2)

**Goal**: Users can delete unused custom categories with a confirmation dialog. In-use categories show a blocking message with transaction count. System defaults have no delete option.

**Independent Test**: Create a custom category with no transactions, click delete, confirm — verify removal. Assign it to a transaction, try deleting — verify blocked with count message. Verify system defaults have no delete button.

### Implementation for User Story 4

- [ ] T016 [US4] Add delete button (visible only on custom categories) to each category card in `client/src/pages/CategoriesPage.tsx`
- [ ] T017 [US4] Add confirmation dialog before deletion — show category name, call categoriesApi.delete() on confirm, refresh list on success, show in-use error (409) with transaction count in `client/src/pages/CategoriesPage.tsx`

**Checkpoint**: Full CRUD cycle complete — view, create, edit, delete all functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [ ] T018 [P] Add toast notifications for all category operations (create success, edit success, delete success, errors) in `client/src/pages/CategoriesPage.tsx`
- [ ] T019 [P] Verify categories page is accessible via sidebar/navigation and route is correctly configured in `client/src/App.tsx`
- [ ] T020 Run full quickstart.md verification steps end-to-end (all 8 steps)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. T001, T002, T003 are parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 (schemas and service). T004, T005, T006 are sequential (routes → controllers → client).
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - US1 (Phase 3): No dependencies on other stories.
  - US2 (Phase 4): Depends on US1 (needs CategoriesPage structure to add modal).
  - US3 (Phase 5): Depends on US2 (reuses CategoryForm component).
  - US4 (Phase 6): Depends on US1 (needs CategoriesPage structure to add delete button). Sequential after US3 (both modify same file sections in CategoriesPage.tsx).
- **Polish (Phase 7)**: Depends on all user stories complete.

### User Story Dependencies

- **US1 (View)**: Foundation only — independent MVP.
- **US2 (Create)**: Depends on US1 (page must exist to add create modal). Creates CategoryForm and pickers reused by US3.
- **US3 (Edit)**: Depends on US2 (reuses CategoryForm in edit mode).
- **US4 (Delete)**: Depends on US1 (page structure). Independent of US2/US3.

### Within Each User Story

- Backend tasks (schemas, service, routes, controllers) before frontend tasks
- Shared components (IconPicker, ColorPicker) before form component
- Form component before page integration

### Parallel Opportunities

- T001, T002, and T003 can run in parallel (different files)
- T010 and T011 can run in parallel (IconPicker and ColorPicker are independent components)
- T018 and T019 can run in parallel (different concerns)
- US3 then US4 sequentially (both modify CategoriesPage.tsx category card section)

---

## Parallel Example: User Story 2

```text
# Launch both picker components in parallel:
Task T010: "Create IconPicker component in client/src/components/IconPicker.tsx"
Task T011: "Create ColorPicker component in client/src/components/ColorPicker.tsx"

# Then sequentially:
Task T012: "Create CategoryForm modal (depends on T010, T011)"
Task T013: "Integrate create flow into CategoriesPage (depends on T012)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T009)
4. **STOP and VALIDATE**: Navigate to /categories, verify all default categories display correctly
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Full CRUD API ready
2. Add US1 (View) → Categories page shows all categories → **MVP!**
3. Add US2 (Create) → Users can add custom categories
4. Add US3 (Edit) + US4 (Delete) → Full management capability
5. Polish → Toasts, navigation verification, end-to-end validation

---

## Notes

- No database migrations needed — Category model already exists with all required fields
- Follow existing AccountsPage pattern for UI structure (modals, loading/error states)
- Follow existing account.routes.ts → account.controller.ts → account.service.ts pattern for backend
- Emoji icons match existing seed data pattern (no new icon library)
- Commit after each task or logical group
