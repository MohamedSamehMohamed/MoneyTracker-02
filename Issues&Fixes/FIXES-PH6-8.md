# Phase 6-8 Implementation Fixes

Apply these fixes in order. Each fix is self-contained with the exact file, problem, and solution.

---

## Fix 1 (CRITICAL): Error middleware never fires — controllers swallow all errors

The global error middleware (`errorMiddleware`) is mounted correctly as the last middleware in `server/src/index.ts`, but it will **never be invoked** because every controller handler (`registerHandler`, `loginHandler`, `getMeHandler`) wraps its logic in try/catch and sends a response directly. Express error middleware only fires when `next(err)` is called or an unhandled error propagates from an async handler.

This means:
- T034 (global error handling) is effectively dead code
- T035 (mount error middleware) has no effect
- Any future route that doesn't have its own try/catch will crash with an unhandled promise rejection instead of returning a JSON error

### Fix

**server/src/controllers/auth.controller.ts** — Rewrite all handlers to use `next(error)` for unexpected errors, keeping only domain-specific catches inline:

```typescript
import { Request, Response, NextFunction } from "express";
import { register, login, getMe } from "../services/auth.service";
import { RegisterInput, LoginInput } from "../routes/auth.schemas";

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as RegisterInput;
    const result = await register(input);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as LoginInput;
    const result = await login(input);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await getMe(req.userId);
    return res.status(200).json({ user });
  } catch (error: any) {
    next(error);
  }
}
```

Changes:
- Added `NextFunction` parameter to all handlers
- `registerHandler`: only catches 409 explicitly, forwards everything else to error middleware
- `getMeHandler`: forwards unexpected errors (e.g., DB down) to error middleware instead of returning 401

---

## Fix 2 (HIGH): Error middleware leaks internal error messages in production

The error middleware returns `err.message` directly in the JSON response for all non-Prisma errors. In production, this can expose stack traces, SQL errors, or internal details to clients.

**server/src/middleware/error.middleware.ts** — Replace the generic error section (lines 32-37):

```typescript
  // Handle generic errors
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? "Internal server error"
    : err.message || "Internal server error";

  return res.status(statusCode).json({
    error: message,
  } as ApiErrorResponse);
```

Change: 500 errors always return the generic message. Only errors with an explicit `statusCode` set by application code will return their message.

---

## Fix 3 (HIGH): GET /me returns wrong error message — contract says "Authentication required"

**Spec ref**: Contract says 401 from `/me` should return `{ "error": "Authentication required" }`, but the current implementation returns `{ "error": "User not authenticated" }` when `req.userId` is missing, and `{ "error": "User not found" }` when the user doesn't exist in DB.

Already addressed in Fix 1 above for the `req.userId` check. Additionally:

**server/src/services/auth.service.ts** — Change line 91:

```diff
-    throw new Error("User not found");
+    const error = new Error("Authentication required") as any;
+    error.statusCode = 401;
+    throw error;
```

This ensures that if a user is deleted while their token is still valid, the response matches the contract.

---

## Fix 4 (HIGH): Seed script uses string enum values but Prisma expects enum members

The seed script passes `type: "expense"` and `type: "income"` as plain strings, but the Prisma schema defines `CategoryType` as an enum. Depending on the Prisma version, this may work at runtime but will fail TypeScript compilation.

**server/prisma/seed.ts** — Add the enum import and use it:

```typescript
import { PrismaClient, CategoryType } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const expenseCategories = [
    { name: "Food", icon: "🍔", color: "#FF6B6B" },
    { name: "Transport", icon: "🚗", color: "#4ECDC4" },
    { name: "Rent", icon: "🏠", color: "#95E1D3" },
    { name: "Entertainment", icon: "🎭", color: "#C7CEEA" },
    { name: "Shopping", icon: "🛍️", color: "#FFB6C1" },
    { name: "Health", icon: "⚕️", color: "#98D8C8" },
    { name: "Utilities", icon: "💡", color: "#F7DC6F" },
    { name: "Education", icon: "📚", color: "#85C1E2" },
    { name: "Other", icon: "📌", color: "#D3D3D3" },
  ];

  const incomeCategories = [
    { name: "Salary", icon: "💼", color: "#52C41A" },
    { name: "Freelance", icon: "💻", color: "#1890FF" },
    { name: "Investment", icon: "📈", color: "#EB2F96" },
    { name: "Gift", icon: "🎁", color: "#FA8C16" },
    { name: "Other", icon: "📌", color: "#D3D3D3" },
  ];

  for (const category of expenseCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: CategoryType.expense },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          type: CategoryType.expense,
          icon: category.icon,
          color: category.color,
          userId: null,
        },
      });
      console.log(`Created expense category: ${category.name}`);
    }
  }

  for (const category of incomeCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: CategoryType.income },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          type: CategoryType.income,
          icon: category.icon,
          color: category.color,
          userId: null,
        },
      });
      console.log(`Created income category: ${category.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Changes:
- Import `CategoryType` enum from the generated client
- Use `CategoryType.expense` / `CategoryType.income` instead of plain strings

---

## Fix 5 (HIGH): Seed script inefficient — N+1 queries for each category

The seed script runs `findFirst` + `create` individually for each of the 14 categories (28 database queries). This is slow and fragile. Use `upsert` or `createMany` with `skipDuplicates`.

However, since Category has no natural unique constraint (name + type isn't `@@unique`), `upsert` won't work out of the box. The best approach is to add a unique constraint to the schema first.

### Option A: Add unique constraint (recommended)

**server/prisma/schema.prisma** — Add to the Category model:

```diff
  @@map("categories")
+ @@unique([name, type, userId])
```

Then run a new migration:
```bash
cd server && npx prisma migrate dev --name add-category-unique-constraint
```

Then simplify the seed to use `upsert`:
```typescript
for (const category of expenseCategories) {
  await prisma.category.upsert({
    where: {
      name_type_userId: {
        name: category.name,
        type: CategoryType.expense,
        userId: null,  // Note: nulls may need special handling
      },
    },
    update: {},
    create: {
      name: category.name,
      type: CategoryType.expense,
      icon: category.icon,
      color: category.color,
      userId: null,
    },
  });
}
```

**Note**: PostgreSQL treats `NULL` as distinct in unique constraints, so `userId: null` rows won't conflict with user-created categories that have a `userId`. However, Prisma's `upsert` may not support nullable fields in compound unique `where`. If it doesn't, keep the current `findFirst` + `create` approach from Fix 4 — it's correct, just not optimal.

### Option B: Keep current approach (simpler)

If you don't want to add a migration, the current `findFirst` + `create` pattern is correct. Just apply Fix 4 for the enum types.

---

## Fix 6 (MEDIUM): `@types/bcryptjs` and `@types/jsonwebtoken` are in dependencies, not devDependencies

**server/package.json** — Move type packages to devDependencies:

```diff
  "dependencies": {
    "@prisma/client": "^6.19.2",
-   "@types/bcryptjs": "^2.4.6",
-   "@types/jsonwebtoken": "^9.0.10",
    "bcryptjs": "^3.0.3",
    ...
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
+   "@types/bcryptjs": "^2.4.6",
+   "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^20.10.6",
    ...
  },
```

These are type definitions only needed at build time, not runtime.

---

## Fix 7 (MEDIUM): `prisma` is in dependencies — should be devDependencies

**server/package.json** — Move `prisma` to devDependencies:

```diff
  "dependencies": {
    "@prisma/client": "^6.19.2",
    "bcryptjs": "^3.0.3",
    ...
-   "prisma": "^6.19.2",
    "zod": "^4.3.6"
  },
  "devDependencies": {
+   "prisma": "^6.19.2",
    "@types/cors": "^2.8.17",
    ...
  },
```

`prisma` is the CLI tool (used for migrations, generate, seed). Only `@prisma/client` is needed at runtime.

---

## Fix 8 (MEDIUM): Sidebar logout button doesn't confirm — accidental logout risk

Not a bug per se, but the logout button is a prominent red button with no confirmation. A misclick loses the session. Consider at minimum a brief visual confirmation or use a less destructive style.

**client/src/components/layout/Sidebar.tsx** — Change the button style to be less alarming:

```diff
        <button
          onClick={handleLogout}
-         className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
+         className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Logout
        </button>
```

This is a style preference — skip if you want to keep the red button.

---

## Fix 9 (MEDIUM): Prisma logging is too verbose for development

**server/src/utils/prisma.ts** — The Prisma client logs every query (`log: ["query", "error", "warn"]`). In development this floods the console. Change to:

```diff
  new PrismaClient({
-   log: ["query", "error", "warn"],
+   log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });
```

Remove `"query"` from dev logging unless actively debugging SQL. Add it back temporarily when needed.

---

## Fix 10 (LOW): Seed command in package.json may fail without ts-node in PATH

**server/package.json** — The seed command is:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

If `ts-node` isn't in PATH (e.g., installed locally only), this fails. Use `npx`:

```diff
  "prisma": {
-   "seed": "ts-node prisma/seed.ts"
+   "seed": "npx ts-node prisma/seed.ts"
  }
```

---

## Fix 11 (LOW): auth.middleware.ts fetches full user from DB on every request

The auth middleware does a DB query on every authenticated request to fetch the user. For `/me` this means the user is fetched twice (once in middleware, once in `getMe` service).

Two options:

### Option A: Lightweight middleware (recommended)

Only verify the JWT and attach `userId` — don't fetch the user from DB. Let individual routes fetch user data if they need it.

**server/src/middleware/auth.middleware.ts** — Replace with:

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

Changes:
- Removed DB query — middleware only validates the token
- Removed `prisma` import
- Error message matches contract ("Authentication required")
- `req.user` is no longer set here; routes that need the full user call `getMe(req.userId)`

**server/src/types/express.d.ts** — Simplify since `req.user` is no longer set by middleware:

```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
```

Note: If you keep `req.user` for other future routes, leave the type extension as-is but still remove the DB query from the middleware.

### Option B: Keep current approach

If you prefer the convenience of `req.user` being always available, keep the current middleware but accept the double-fetch for `/me`.

---

## Verification

After applying all fixes, run:
```bash
cd server && npx tsc --noEmit
cd ../client && npx tsc --noEmit
```
Expected: 0 errors.

Then test:
1. `GET /api/auth/me` with valid token -> returns `{ "user": { ... } }` with correct fields
2. `GET /api/auth/me` with expired/invalid token -> returns `{ "error": "Invalid or expired token" }` (401)
3. `GET /api/auth/me` with no Authorization header -> returns `{ "error": "Authentication required" }` (401)
4. Run seed: `cd server && npx prisma db seed` -> categories created without errors
5. Run seed again -> idempotent, no duplicates
6. Trigger an unhandled server error (e.g., stop DB) -> error middleware returns `{ "error": "Internal server error" }` (500), not a stack trace
7. Click logout in sidebar -> redirected to login, session cleared
