# Phase 1-2 Implementation Fixes

Apply these fixes in order. Each fix is self-contained with the exact file, problem, and solution.

---

## Fix 1 (CRITICAL): Prisma import path mismatch

The generated Prisma client outputs to `src/generated/prisma` (per schema.prisma line 9: `output = "../src/generated/prisma"`), but code imports from `@prisma/client` which won't resolve correctly with Prisma 6.x `prisma-client` generator.

### Files to fix:

**server/src/utils/prisma.ts** - Change line 1:
- FROM: `import { PrismaClient } from "@prisma/client";`
- TO: `import { PrismaClient } from "../generated/prisma";`

**server/src/types/express.d.ts** - Change line 1:
- FROM: `import { User } from "@prisma/client";`
- TO: `import { User } from "../generated/prisma";`

---

## Fix 2 (CRITICAL): jwt.ts TypeScript errors

`expiresIn` expects `StringValue | number` (a branded type from the `ms` package), but we pass a plain `string`. Fix by casting.

**server/src/utils/jwt.ts** - Replace the entire file with:

```typescript
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    algorithm: "HS256",
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  }) as TokenPayload;
}
```

Note: `decodeToken` was removed because nothing uses it.

---

## Fix 3 (CRITICAL): validate.middleware.ts TypeScript errors

Two issues: `ZodError.errors` should be `ZodError.issues` in Zod v3+, and the map callback parameter needs an explicit type.

**server/src/middleware/validate.middleware.ts** - Change line 12:
- FROM: `const errors = error.errors.map((err) => ({`
- TO: `const errors = error.issues.map((err: any) => ({`

---

## Fix 4 (HIGH): Health route double-nesting

The original index.ts mounted health as `app.use('/api', healthRoutes)` where the router defines `router.get('/health', ...)`, giving endpoint `GET /api/health`.

The new code mounts at `app.use('/api/health', healthRoutes)`, making the endpoint `GET /api/health/health` (broken).

**server/src/index.ts** - Change line 18:
- FROM: `app.use('/api/health', healthRoutes);`
- TO: `app.use('/api', healthRoutes);`

---

## Fix 5 (MEDIUM): Fake Prisma error in auth.service.ts

The register function manually constructs an error with `code: "P2002"` to mimic a Prisma error. This is fragile. Use a plain application error instead.

**server/src/services/auth.service.ts** - Replace lines 12-17:
```typescript
// FROM:
  if (existingUser) {
    const error = new Error("User with this email already exists") as any;
    error.code = "P2002";
    error.meta = { target: ["email"] };
    throw error;
  }

// TO:
  if (existingUser) {
    const error = new Error("User with this email already exists") as any;
    error.statusCode = 409;
    throw error;
  }
```

Then update **server/src/controllers/auth.controller.ts** registerHandler catch block (lines 10-17):
```typescript
// FROM:
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }
    return res.status(400).json({ error: error.message });
  }

// TO:
  } catch (error: any) {
    const status = error.statusCode || 400;
    return res.status(status).json({ error: error.message });
  }
```

---

## Fix 6 (LOW): docker-compose.yml deprecated version key

**docker-compose.yml** - Remove line 1:
- DELETE: `version: '3.8'`

The `version` key is obsolete in modern Docker Compose and produces a warning.

---

## Fix 7 (MEDIUM): AuthContext should validate token on restore

On mount, AuthContext trusts localStorage without verifying the token is still valid server-side. An expired token will look authenticated until the first API call fails.

**client/src/contexts/AuthContext.tsx** - Replace the useEffect (lines 25-38) with:

```tsx
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("authToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const user = await authApi.getMe();
        setUser(user as User);
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);
```

This calls `GET /me` on restore to verify the token. If it fails, the session is cleared.

---

## Verification

After applying all fixes, run:
```bash
cd server && npx tsc --noEmit
```
Expected: 0 errors.
