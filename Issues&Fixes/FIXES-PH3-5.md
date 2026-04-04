# Phase 3-5 Implementation Fixes

Apply these fixes in order. Each fix is self-contained with the exact file, problem, and solution.

---

## Fix 1 (CRITICAL): LoginPage does not redirect to originally requested page

**Spec ref**: US3 acceptance scenario 2 -- "After logging in, they are taken to the originally requested page."

ProtectedRoute correctly saves `location` via `<Navigate to="/login" state={{ from: location }} />`, but LoginPage ignores it and always redirects to `/dashboard`.

**client/src/pages/LoginPage.tsx** - Replace lines 1-41 with:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect to the page user originally requested, or /dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError('');
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setServerError('Invalid email or password');
    }
  };
```

Changes:
- Added `useLocation` import, removed `useEffect` import
- Read `location.state.from.pathname` to get the redirect target
- Removed the `useEffect` that redirected authenticated users (redundant -- GuestRoute handles this)
- `navigate(from, { replace: true })` instead of `navigate('/dashboard')`

The rest of the file (the JSX return) stays unchanged.

---

## Fix 2 (CRITICAL): AuthContext sets `loading=true` during login/register

The `loading` state controls ProtectedRoute and GuestRoute spinners. Setting it to `true` during login/register causes a full-page loading flash after the user submits the form, instead of just disabling the button.

**client/src/contexts/AuthContext.tsx** - In the `login` function (line 52), remove:
```diff
-      setLoading(true);
```

And in the `register` function (line 72), remove:
```diff
-      setLoading(true);
```

Also remove `setLoading(false)` from both `finally` blocks (lines 65 and 85).

The `loading` state should ONLY be `true` during the initial session restore on mount. The form's own `isSubmitting` state (from react-hook-form) handles button loading.

Updated `login` function:
```tsx
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.login({ email, password });
      const { user, token } = response as AuthResponse;

      setUser(user);
      setToken(token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
    } catch (err: any) {
      const errorMsg = typeof err === "string" ? err : err?.error || "Login failed";
      setError(errorMsg);
      throw err;
    }
  };
```

Updated `register` function:
```tsx
  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.register({ name, email, password });
      const { user, token } = response as AuthResponse;

      setUser(user);
      setToken(token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
    } catch (err: any) {
      const errorMsg = typeof err === "string" ? err : err?.error || "Registration failed";
      setError(errorMsg);
      throw err;
    }
  };
```

---

## Fix 3 (HIGH): GET /me response doesn't match API contract

**Spec ref**: Contract says `GET /me` returns `{ "user": { ... } }`, but the controller returns the user object directly (unwrapped).

**server/src/controllers/auth.controller.ts** - Change line 34:
```diff
-    const user = await getMe(req.userId);
-    return res.status(200).json(user);
+    const user = await getMe(req.userId);
+    return res.status(200).json({ user });
```

Then update the client to unwrap the response.

**client/src/contexts/AuthContext.tsx** - Change line 35:
```diff
-        const user = await authApi.getMe();
-        setUser(user as User);
+        const response = await authApi.getMe();
+        setUser((response as { user: User }).user);
```

---

## Fix 4 (HIGH): RegisterPage doesn't show field-specific validation errors

When server-side validation fails (e.g., invalid email format), the API returns `{ "error": "Validation failed", "details": [{ "field": "email", "message": "..." }] }`. The page only shows "Validation failed" without the actual field errors.

**client/src/pages/RegisterPage.tsx** - Replace the onSubmit catch block (lines 43-46):
```tsx
    } catch (error: any) {
      if (error?.details && Array.isArray(error.details)) {
        const messages = error.details.map((d: any) => d.message).join('. ');
        setServerError(messages);
      } else {
        const errorMsg = error?.error || error?.message || 'Registration failed';
        setServerError(errorMsg);
      }
    }
```

---

## Fix 5 (MEDIUM): Register 409 error message doesn't match contract

**Spec ref**: Contract says `{ "error": "Email already in use" }` for 409.

**server/src/services/auth.service.ts** - Change line 13:
```diff
-    const error = new Error("User with this email already exists") as any;
+    const error = new Error("Email already in use") as any;
```

---

## Fix 6 (MEDIUM): RegisterPage has redundant auth redirect useEffect

The `useEffect` on lines 32-36 redirects authenticated users to `/dashboard`, but RegisterPage is already wrapped in `GuestRoute` which does the same thing. This is dead code.

**client/src/pages/RegisterPage.tsx** - Remove:
- The `useEffect` import (keep `useState`)
- Lines 32-36 (the `useEffect` block)
- Remove `isAuthenticated` and `loading` from the `useAuth()` destructuring
- Remove the loading spinner block (lines 49-55)

Updated top of component:
```tsx
export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
```

---

## Fix 7 (LOW): JWT payload includes email (not in contract)

**Spec ref**: Contract says JWT payload is `{ "userId": "uuid", "iat": ..., "exp": ... }`. The implementation also includes `email`, adding unnecessary data to every token.

**server/src/utils/jwt.ts** - Change the `TokenPayload` interface and `signToken` calls:
```diff
 export interface TokenPayload {
   userId: string;
-  email: string;
 }
```

**server/src/services/auth.service.ts** - Update both `signToken` calls:
```diff
-  const token = signToken({ userId: user.id, email: user.email });
+  const token = signToken({ userId: user.id });
```

Update in both the `register` function (line 39) and the `login` function (line 65).

**server/src/utils/jwt.ts** - The `verifyToken` return type already works since it returns the decoded payload.

---

## Fix 8 (LOW): Response includes `updatedAt` not specified in contract

The API contract for register/login/me responses doesn't include `updatedAt`, but the service returns it. Not harmful, but adds unnecessary payload.

**server/src/services/auth.service.ts** - Remove `updatedAt: true` from all three `select` blocks:
- In `register` function (line 34): remove `updatedAt: true`
- In `login` function (line 76 in userWithoutPassword): remove `updatedAt: user.updatedAt`
- In `getMe` function (line 91): remove `updatedAt: true`

**client/src/types/auth.ts** - Remove `updatedAt` from the `User` interface:
```diff
 export interface User {
   id: string;
   name: string;
   email: string;
   baseCurrency: string;
   createdAt: string;
-  updatedAt: string;
 }
```

---

## Verification

After applying all fixes, run:
```bash
cd server && npx tsc --noEmit
cd ../client && npx tsc --noEmit
```
Expected: 0 errors.

Then test the full flow:
1. Navigate to `/dashboard` while logged out -> should redirect to `/login`
2. Register a new user -> should redirect to `/dashboard`
3. Logout -> should return to `/login`
4. Navigate to `/settings` while logged out -> should redirect to `/login`
5. Login -> should redirect to `/settings` (the originally requested page, not `/dashboard`)
6. Refresh page -> should remain authenticated
