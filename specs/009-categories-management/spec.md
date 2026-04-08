# Feature Specification: Categories Management

**Feature Branch**: `009-categories-management`  
**Created**: 2026-04-08  
**Status**: Draft  
**Input**: User description: "Phase 7 — Categories Management: Users can customize their transaction categories with custom names, types, icons, and colors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Categories (Priority: P1)

A user navigates to the Categories page to see all available categories for organizing their transactions. The page displays both system-provided default categories (e.g., Food, Transport, Salary) and any custom categories the user has created. Categories are visually distinguished by their icon and color, and grouped by type (income vs. expense).

**Why this priority**: Viewing categories is the foundation — users need to see what exists before they can manage it. This also replaces the current placeholder page with real functionality.

**Independent Test**: Can be fully tested by logging in, navigating to /categories, and verifying that the seeded default categories appear with their names, icons, colors, and types.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no custom categories, **When** they navigate to the Categories page, **Then** they see all system default categories grouped by type (income/expense) with their icons and colors.
2. **Given** a logged-in user with custom categories, **When** they navigate to the Categories page, **Then** they see both system defaults and their custom categories, with custom categories visually distinguishable from defaults.
3. **Given** an unauthenticated user, **When** they try to access the Categories page, **Then** they are redirected to the login page.

---

### User Story 2 - Create Custom Category (Priority: P1)

A user wants to create a custom category to better organize their transactions. They open a form, provide a name, select the category type (income or expense), choose an icon from a predefined set, and pick a color. The new category immediately appears in their list and becomes available when creating or editing transactions.

**Why this priority**: Creating categories is the core value proposition of this feature — without it, users are stuck with only system defaults.

**Independent Test**: Can be fully tested by creating a new category with all fields, verifying it appears in the categories list, and confirming it shows up in the category dropdown when adding a transaction.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Categories page, **When** they click "Add Category" and fill in a name, type, icon, and color, **Then** the category is created and appears in the list under the correct type group.
2. **Given** a logged-in user creating a category, **When** they submit without providing a required field (name or type), **Then** they see a validation error and the category is not created. Icon and color may be omitted (system assigns defaults).
3. **Given** a logged-in user, **When** they create a category with the same name as an existing category of the same type, **Then** they see an error indicating the name is already in use.
4. **Given** a logged-in user, **When** they create a new custom category, **Then** it becomes available in the category selection dropdown when creating or editing transactions.

---

### User Story 3 - Edit Custom Category (Priority: P2)

A user wants to update the name, icon, or color of a custom category they previously created. They can edit any of these fields. System default categories cannot be edited.

**Why this priority**: Editing allows users to refine their category organization over time without having to delete and recreate.

**Independent Test**: Can be tested by creating a custom category, editing its name and color, and verifying the changes persist and reflect in the categories list.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing their custom category, **When** they click edit and change the name and color, **Then** the category is updated and the changes appear immediately in the list.
2. **Given** a logged-in user viewing a system default category, **When** they look for edit options, **Then** no edit action is available for system defaults.
3. **Given** a logged-in user editing a category, **When** they try to rename it to a name already used by another category of the same type, **Then** they see a duplicate name error.

---

### User Story 4 - Delete Custom Category (Priority: P2)

A user wants to remove a custom category they no longer need. The system prevents deletion if any transactions are currently assigned to that category, protecting data integrity. System default categories cannot be deleted.

**Why this priority**: Deletion is important for housekeeping, but less critical than creation and viewing. The safeguard against deleting in-use categories is essential for data integrity.

**Independent Test**: Can be tested by creating a custom category, attempting to delete it (succeeds when unused), then assigning it to a transaction and attempting deletion again (fails with clear message).

**Acceptance Scenarios**:

1. **Given** a logged-in user with a custom category that has no transactions, **When** they click delete and confirm, **Then** the category is removed from the list.
2. **Given** a logged-in user with a custom category assigned to existing transactions, **When** they attempt to delete it, **Then** they see a message explaining the category cannot be deleted because it is in use, along with the count of associated transactions.
3. **Given** a logged-in user viewing a system default category, **When** they look for delete options, **Then** no delete action is available for system defaults.
4. **Given** a logged-in user about to delete a category, **When** the delete action is triggered, **Then** a confirmation dialog appears before the deletion is executed.

---

### Edge Cases

- What happens when a user has no custom categories and only system defaults exist? The page should still be functional, showing defaults with a prompt to create custom categories.
- How does the system handle a category name that is extremely long? Names are limited to 50 characters with validation feedback.
- What happens if two users create categories with the same name? This is allowed — category uniqueness is scoped per user within each type. However, a user cannot create a custom category with the same name and type as a system default.
- What happens if a user tries to change a category's type (income to expense)? Category type cannot be changed after creation to avoid inconsistencies with existing transactions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all categories available to the user, including system defaults (where userId is null) and user-created custom categories.
- **FR-002**: System MUST allow users to create custom categories with a name and type (income/expense). Icon and color are optional; if not provided, the system assigns a default gray color and a generic icon.
- **FR-003**: System MUST validate that category names are unique per user within each type (income/expense). Custom category names MUST NOT duplicate system default category names of the same type.
- **FR-004**: System MUST allow users to edit the name, icon, and color of their own custom categories. Category type cannot be changed after creation.
- **FR-005**: System MUST allow users to delete their own custom categories, but only if no transactions reference that category.
- **FR-006**: System MUST NOT allow users to edit or delete system default categories.
- **FR-007**: System MUST provide a predefined set of icons for users to choose from when creating or editing a category.
- **FR-008**: System MUST provide a color picker for users to assign a color to their category.
- **FR-009**: System MUST display categories grouped by type (income vs. expense) with visual indicators (icon and color).
- **FR-010**: System MUST show a clear error message with the transaction count when a user attempts to delete a category that is in use.
- **FR-011**: System MUST require a confirmation step before deleting a category.
- **FR-012**: System MUST enforce a maximum category name length of 50 characters.

### Key Entities

- **Category**: Represents a classification for transactions. Has a name, type (income or expense), icon, color, and an owner (user or system). System categories have no owner and are shared across all users. Custom categories belong to a specific user. A category can be referenced by zero or more transactions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new custom category in under 30 seconds.
- **SC-002**: Users can view all their categories (system + custom) on a single page within 2 seconds of navigation.
- **SC-003**: 100% of category deletion attempts for in-use categories are blocked with a clear explanation.
- **SC-004**: Users can visually distinguish between income and expense categories at a glance through grouping and visual cues.
- **SC-005**: Custom categories appear in transaction forms immediately after creation without requiring a page refresh.
- **SC-006**: All category operations (create, edit, delete) provide immediate visual feedback confirming success or explaining failure.

## Clarifications

### Session 2026-04-08

- Q: Should users be allowed to create custom categories with names matching system defaults of the same type? → A: No — block duplicate names against system defaults to avoid confusion in transaction dropdowns.
- Q: Are icon and color required when creating a custom category? → A: No — they are optional. System assigns a default gray color and generic icon when omitted.

## Assumptions

- The Category data model already exists in the database with the required fields (name, type, icon, color, userId).
- System default categories have already been seeded (from Phase 2).
- A read-only endpoint for listing categories already exists and will be extended with create, update, and delete operations.
- The icon set will be a curated list of common financial/lifestyle icons (predefined in the frontend), not user-uploadable images.
- Color values are stored as hex strings (e.g., "#FF5733") with a maximum of 7 characters.
