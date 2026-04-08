# API Contract: Categories

**Base URL**: `/api/categories`  
**Auth**: All endpoints require Bearer token (authMiddleware)

---

## GET /api/categories

List all categories available to the authenticated user (system defaults + user custom).

**Query Parameters**:
| Param | Type   | Required | Description                          |
|-------|--------|----------|--------------------------------------|
| type  | string | No       | Filter by "income" or "expense"      |

**Response 200**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "userId": null,
      "name": "Food",
      "type": "expense",
      "icon": "🍔",
      "color": "#FF6B6B"
    },
    {
      "id": "uuid",
      "userId": "user-uuid",
      "name": "Subscriptions",
      "type": "expense",
      "icon": "📱",
      "color": "#7B68EE"
    }
  ]
}
```

**Ordering**: System categories first (userId null), then user categories, both alphabetical by name.

---

## POST /api/categories

Create a new custom category.

**Request Body**:
```json
{
  "name": "Subscriptions",
  "type": "expense",
  "icon": "📱",
  "color": "#7B68EE"
}
```

| Field | Type   | Required | Constraints                              |
|-------|--------|----------|------------------------------------------|
| name  | string | Yes      | 1-50 chars, trimmed                      |
| type  | string | Yes      | "income" or "expense"                    |
| icon  | string | No       | Max 50 chars. Default: "📌"             |
| color | string | No       | Hex format #RRGGBB. Default: "#D3D3D3"   |

**Response 201**:
```json
{
  "category": {
    "id": "uuid",
    "userId": "user-uuid",
    "name": "Subscriptions",
    "type": "expense",
    "icon": "📱",
    "color": "#7B68EE"
  }
}
```

**Response 400** (validation error):
```json
{
  "error": "Validation failed",
  "details": [{ "field": "name", "message": "Name is required" }]
}
```

**Response 409** (duplicate name):
```json
{
  "error": "A category named \"Subscriptions\" already exists for expense type"
}
```

---

## PATCH /api/categories/:id

Update a custom category. Only the owner can update. System defaults cannot be updated.

**URL Parameters**: `id` — category UUID

**Request Body** (all fields optional, at least one required):
```json
{
  "name": "Monthly Subscriptions",
  "icon": "💳",
  "color": "#9B59B6"
}
```

| Field | Type   | Required | Constraints                              |
|-------|--------|----------|------------------------------------------|
| name  | string | No       | 1-50 chars, trimmed                      |
| icon  | string | No       | Max 50 chars                             |
| color | string | No       | Hex format #RRGGBB                       |

**Note**: `type` field is NOT accepted (immutable).

**Response 200**:
```json
{
  "category": {
    "id": "uuid",
    "userId": "user-uuid",
    "name": "Monthly Subscriptions",
    "type": "expense",
    "icon": "💳",
    "color": "#9B59B6"
  }
}
```

**Response 403** (system default or not owner):
```json
{
  "error": "Cannot modify system default categories"
}
```

**Response 404**:
```json
{
  "error": "Category not found"
}
```

**Response 409** (duplicate name):
```json
{
  "error": "A category named \"Food\" already exists for expense type"
}
```

---

## DELETE /api/categories/:id

Delete a custom category. Only the owner can delete. Blocked if transactions reference it.

**URL Parameters**: `id` — category UUID

**Response 204**: No content (successful deletion)

**Response 403** (system default or not owner):
```json
{
  "error": "Cannot delete system default categories"
}
```

**Response 404**:
```json
{
  "error": "Category not found"
}
```

**Response 409** (in use):
```json
{
  "error": "Cannot delete category: 5 transactions are using this category"
}
```
