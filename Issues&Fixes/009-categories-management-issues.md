# 009 - Categories Management: Issues & Fixes

Review date: 2026-04-08

---

## Issue 1: Duplicate emoji key in IconPicker causes React warning

**File**: `client/src/components/IconPicker.tsx:6-13`
**Severity**: Medium

The `ICONS` array contains `'💰'` twice (index 0 and index 8). Since the emoji is used as the `key` prop in the `.map()`, React will emit a duplicate key warning and may behave unpredictably with selection/rendering.

**Fix**: Remove the duplicate `'💰'` at index 8 or replace it with a different emoji (e.g., `'🧾'`).

```diff
 const ICONS = [
-  '💰', '💵', '💸', '📈', '💳', '🏦', '🪙', '💎', '💰',
+  '💰', '💵', '💸', '📈', '💳', '🏦', '🪙', '💎', '🧾',
```

---

## Issue 2: ColorPicker hex text input doesn't update live — only accepts final valid value

**File**: `client/src/components/ColorPicker.tsx:42-47`
**Severity**: Low

The text input `onChange` only calls `onChange(color)` if the input exactly matches `#RRGGBB`. This means:
- The user cannot see intermediate typing (e.g., `#FF` won't reflect in the field since the `value` prop is driven by `value || ''` which won't update until a full 7-char hex is typed).
- If the user types an invalid hex and tabs away, the field silently rejects it with no feedback.

**Fix**: Track local text state separately so the user can type freely, and only propagate the valid color upstream:

```tsx
const [localText, setLocalText] = useState(value || '');

useEffect(() => { setLocalText(value || ''); }, [value]);

<input
  type="text"
  value={localText}
  onChange={(e) => {
    setLocalText(e.target.value);
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      onChange(e.target.value);
    }
  }}
/>
```

---

## Issue 3: CategoryForm doesn't reset when reopened for a different category

**File**: `client/src/components/CategoryForm.tsx:34-53`
**Severity**: High

`useForm` `defaultValues` are only applied on initial mount. When the user edits category A, closes the modal, then edits category B, the form still shows category A's data because React reuses the same component instance (the `key` prop is not changed).

**Fix**: Add a `key` prop to force remount when the editing target changes:

```tsx
// In CategoriesPage.tsx where CategoryForm is rendered:
<CategoryForm
  key={editingCategory ? editingCategory.id : 'create'}
  isOpen={isFormOpen}
  onClose={handleCloseForm}
  onSubmit={handleFormSubmit}
  initialData={...}
  mode={editingCategory ? 'edit' : 'create'}
/>
```

---

## Issue 4: `listCategoriesHandler` does not validate the `type` query parameter

**File**: `server/src/controllers/category.controller.ts:21-24`
**Severity**: Medium

The `type` query parameter is cast directly as `"income" | "expense" | undefined` with no validation. If a user sends `?type=foo`, it gets passed to the service and ultimately to Prisma, which will either return empty results silently or throw an unexpected error depending on the Prisma version.

**Fix**: Validate the query param before passing it:

```ts
const { type } = req.query;
const validTypes = ['income', 'expense'];
const categoryType = typeof type === 'string' && validTypes.includes(type)
  ? (type as 'income' | 'expense')
  : undefined;
const categories = await listCategories(req.userId, categoryType);
```

---

## Issue 5: Service uses `any` type for Prisma `where` clauses

**File**: `server/src/services/category.service.ts:6, 51`
**Severity**: Low

Both `listCategories` and `checkCategoryNameExists` declare `where: any`, losing Prisma's type safety. If the schema changes, these queries won't produce compile-time errors.

**Fix**: Use Prisma's generated types:

```ts
import { Prisma } from "@prisma/client";

const where: Prisma.CategoryWhereInput = {
  OR: [{ userId: null }, { userId }],
};
```

---

## Issue 6: Controller error handling is repetitive and inconsistent

**File**: `server/src/controllers/category.controller.ts`
**Severity**: Low

Each handler manually checks `error.statusCode` for 403, 404, and 409. `createCategoryHandler` only handles 409 but misses 404 (would fall to the global error handler with a generic 500). `deleteCategoryHandler` handles all three. If a new error code is added in the service, every controller must be updated.

**Fix**: Either:
1. **Centralize**: Let the global error handler check for `statusCode` on thrown errors and respond accordingly (consistent with Express patterns).
2. **Or at minimum**: Add the missing 404 handler to `createCategoryHandler` for consistency.

---

## Issue 7: `updateCategory` name uniqueness check uses truthy check instead of `undefined`

**File**: `server/src/services/category.service.ts:107`
**Severity**: Medium

```ts
if (input.name) {
```

This skips the uniqueness check if `input.name` is an empty string `""`. While the Zod schema enforces `min(1)`, if the schema is ever adjusted or the service is called directly, an empty name could bypass the check. More importantly, this is inconsistent with the data spread on line 124 which correctly uses `input.name !== undefined`.

**Fix**: Use `input.name !== undefined` for consistency:

```ts
if (input.name !== undefined) {
```

---

## Issue 8: Empty state message is misleading

**File**: `client/src/pages/CategoriesPage.tsx:157-159`
**Severity**: Low

When `categories.length === 0`, the message says "Default categories will be available when you add transactions." This is incorrect — default categories are seeded in the database and should always be returned by the API. An empty list likely indicates an API/auth issue, not a missing-seed scenario.

**Fix**: Change the message to something actionable:

```tsx
<p className="text-gray-600 mb-4">No categories found.</p>
<button onClick={handleOpenCreate} className="...">Create your first category</button>
```

Or add the "Add Category" button to the empty state.

---

## Issue 9: `formError` state shown outside the modal is confusing UX

**File**: `client/src/pages/CategoriesPage.tsx:176-180`
**Severity**: Low

`formError` is displayed as a banner on the main page (lines 176-180), but the error originates from inside the modal form. When `handleFormSubmit` catches an error, it sets `formError` *and* throws the error (line 66), which means the error shows both as a toast and as a persistent banner behind the modal. After closing the modal, the banner remains visible.

**Fix**: Remove the `formError` banner from the page. The toast notification is sufficient. If inline form errors are desired, display them inside the `CategoryForm` component instead. Also remove the `throw error` on line 66 since the error is already handled.

---

## Issue 10: Delete confirmation dialog doesn't close on backdrop click or Escape key

**File**: `client/src/pages/CategoriesPage.tsx:220-256`
**Severity**: Low

The delete confirmation overlay has no handler for clicking the backdrop or pressing Escape. Users expect modals to be dismissible this way.

**Fix**: Add `onClick` on the backdrop and a `useEffect` for the Escape key:

```tsx
<div className="fixed inset-0 bg-black/50 ..." onClick={handleCancelDelete}>
  <div className="bg-white ..." onClick={(e) => e.stopPropagation()}>
```

---

## Issue 11: `CategoryForm` uses `any` for form data types

**File**: `client/src/components/CategoryForm.tsx:11, 41, 76`
**Severity**: Low

The `onSubmit` prop accepts `(data: any) => Promise<void>` and `useForm<any>` is used. This defeats TypeScript's purpose. Similarly, `handleFormSubmit` in `CategoriesPage.tsx:39` accepts `data: any`.

**Fix**: Define a proper type:

```ts
interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}
```

And use `useForm<CategoryFormData>()` with typed `onSubmit`.

---

## Summary

| #  | Issue                                       | Severity | File(s)                          |
|----|---------------------------------------------|----------|----------------------------------|
| 1  | Duplicate emoji key in IconPicker           | Medium   | IconPicker.tsx                   |
| 2  | ColorPicker hex input UX                    | Low      | ColorPicker.tsx                  |
| 3  | CategoryForm doesn't reset on reopen        | High     | CategoryForm.tsx, CategoriesPage |
| 4  | No validation on `type` query param         | Medium   | category.controller.ts           |
| 5  | `any` type for Prisma where clauses         | Low      | category.service.ts              |
| 6  | Repetitive controller error handling        | Low      | category.controller.ts           |
| 7  | Truthy vs undefined check for name          | Medium   | category.service.ts              |
| 8  | Misleading empty state message              | Low      | CategoriesPage.tsx               |
| 9  | formError banner outside modal              | Low      | CategoriesPage.tsx               |
| 10 | Delete dialog not dismissible               | Low      | CategoriesPage.tsx               |
| 11 | `any` types in form data                    | Low      | CategoryForm.tsx, CategoriesPage |
