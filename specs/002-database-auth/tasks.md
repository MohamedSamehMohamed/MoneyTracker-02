# Tasks: Database & Authentication

**Input**: Design documents from `/specs/002-database-auth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested. Test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Install new dependencies and configure tooling for this feature

- [ ] T001 Install server dependencies: prisma, @prisma/client, bcryptjs, jsonwebtoken, zod and dev deps @types/bcryptjs, @types/jsonwebtoken in server/package.json
- [ ] T002 Install client dependencies: react-hook-form, @hookform/resolvers, zod in client/package.json
- [ ] T003 Initialize Prisma in server/ with PostgreSQL datasource (npx prisma init), creating server/prisma/schema.prisma

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth infrastructure, and shared utilities that ALL user stories depend on

- [ ] T004 Define complete Prisma schema with all 5 models (User, Account, Transaction, Category, ExchangeRate) including enums (AccountType, TransactionType, CategoryType), relations, and field constraints in server/prisma/schema.prisma
- [ ] T005 Run initial Prisma migration (npx prisma migrate dev --name init) to create all database tables
- [ ] T006 [P] Create Prisma client singleton for reuse across services in server/src/utils/prisma.ts
- [ ] T007 [P] Create JWT utility functions (signToken, verifyToken) using jsonwebtoken with 7-day absolute expiration in server/src/utils/jwt.ts
- [ ] T008 [P] Create Express type extension to add user property to Request in server/src/types/express.d.ts
- [ ] T009 Create auth middleware that extracts and verifies JWT from Authorization header, attaches user to req in server/src/middleware/auth.middleware.ts
- [ ] T010 [P] Create Zod validation middleware factory (takes schema, validates req.body, returns 400 with structured errors) in server/src/middleware/validate.middleware.ts
- [ ] T011 [P] Create shared auth types (User, LoginRequest, RegisterRequest, AuthResponse) in client/src/types/auth.ts
- [ ] T012 [P] Create API service module with base fetch wrapper that reads token from localStorage and attaches Authorization header, handles JSON parsing and error responses in client/src/services/api.ts
- [ ] T013 Create AuthContext with React Context providing: user state, token state, login/logout/register functions, loading state, and auto-restore from localStorage on mount in client/src/contexts/AuthContext.tsx
- [ ] T014 Update server/.env.example to document all required env vars (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN) in server/.env.example

**Checkpoint**: Foundation ready - auth infrastructure in place, user story implementation can begin

---

## Phase 3: User Story 1 - New User Registration (Priority: P1)

**Goal**: New users can create an account and are automatically logged in and redirected to the dashboard.

**Independent Test**: Navigate to /register, fill form, submit, verify redirect to /dashboard with authenticated state.

### Implementation for User Story 1

- [X] T015 [US1] Create auth service with register function: validate uniqueness, hash password with bcryptjs (cost 10), create user in DB, return user + JWT in server/src/services/auth.service.ts
- [X] T016 [US1] Create Zod validation schemas for register request (name 1-100 chars, email valid format max 255, password min 8 chars) in server/src/routes/auth.schemas.ts
- [X] T017 [US1] Create auth controller with register handler: parse validated body, call auth service, return 201 with user + token, handle 409 for duplicate email in server/src/controllers/auth.controller.ts
- [X] T018 [US1] Create auth routes file with POST /register using validate middleware + register controller in server/src/routes/auth.routes.ts
- [X] T019 [US1] Mount auth routes at /api/auth in server/src/index.ts
- [X] T020 [US1] Implement RegisterPage with React Hook Form + Zod resolver: name, email, password fields with inline validation errors, submit calls AuthContext.register, displays server errors (duplicate email) in client/src/pages/RegisterPage.tsx

**Checkpoint**: Registration flow complete. Can create users and auto-login.

---

## Phase 4: User Story 2 - Returning User Login (Priority: P1)

**Goal**: Returning users can log in with email/password and access protected features. Session persists across refreshes.

**Independent Test**: Log in with valid credentials, verify dashboard access, refresh page, verify still authenticated.

### Implementation for User Story 2

- [X] T021 [US2] Add login function to auth service: find user by email, compare password with bcryptjs, return user + JWT or throw 401 in server/src/services/auth.service.ts
- [X] T022 [US2] Add Zod validation schema for login request (email required valid, password required) in server/src/routes/auth.schemas.ts
- [X] T023 [US2] Add login handler to auth controller: parse validated body, call auth service login, return 200 with user + token, return 401 with generic "Invalid email or password" in server/src/controllers/auth.controller.ts
- [X] T024 [US2] Add POST /login route to auth routes file in server/src/routes/auth.routes.ts
- [X] T025 [US2] Implement LoginPage with React Hook Form + Zod resolver: email, password fields with inline validation, submit calls AuthContext.login, displays server error messages, link to /register in client/src/pages/LoginPage.tsx

**Checkpoint**: Login flow complete. Users can log in and stay authenticated across page refreshes.

---

## Phase 5: User Story 3 - Protected Route Access (Priority: P1)

**Goal**: Unauthenticated users are redirected to login. After login, they reach their originally requested page. Authenticated users are redirected away from auth pages.

**Independent Test**: Navigate to /dashboard while logged out, verify redirect to /login, log in, verify redirect to /dashboard.

### Implementation for User Story 3

- [X] T026 [US3] Create ProtectedRoute component that checks AuthContext: if not authenticated redirect to /login preserving intended path, if loading show spinner in client/src/components/auth/ProtectedRoute.tsx
- [X] T027 [US3] Create GuestRoute component that redirects authenticated users from /login and /register to /dashboard in client/src/components/auth/GuestRoute.tsx
- [X] T028 [US3] Update App.tsx: wrap app with AuthProvider, wrap /login and /register with GuestRoute, wrap all other routes with ProtectedRoute, implement redirect-after-login using preserved path in client/src/App.tsx

**Checkpoint**: Full auth boundary in place. Unauthenticated access blocked, auth pages redirect logged-in users.

---

## Phase 6: User Story 4 - View Own Profile (Priority: P2)

**Goal**: Authenticated users can view their profile (name, email, creation date) via the /me endpoint.

**Independent Test**: Log in, call GET /api/auth/me, verify correct user data returned.

### Implementation for User Story 4

- [X] T029 [US4] Add getMe handler to auth controller: read req.user from auth middleware, fetch full user from DB (exclude password), return user profile in server/src/controllers/auth.controller.ts
- [X] T030 [US4] Add GET /me route to auth routes file, protected by auth middleware in server/src/routes/auth.routes.ts

**Checkpoint**: Profile endpoint working. AuthContext can use /me to restore session on page load.

---

## Phase 7: User Story 5 - Default Categories Available (Priority: P2)

**Goal**: System default categories (income and expense types) are seeded and available to all users immediately after registration.

**Independent Test**: Register new user, query categories, verify default set is present.

### Implementation for User Story 5

- [X] T031 [US5] Create Prisma seed script that inserts default expense categories (Food, Transport, Rent, Entertainment, Shopping, Health, Utilities, Education, Other) and income categories (Salary, Freelance, Investment, Gift, Other) with icons and colors, user_id = null, idempotent (skip if exists) in server/prisma/seed.ts
- [X] T032 [US5] Configure seed command in server/package.json under prisma.seed field pointing to ts-node server/prisma/seed.ts
- [X] T033 [US5] Run seed (npx prisma db seed) and verify categories exist in database

**Checkpoint**: Default categories seeded. Ready for transaction categorization in Phase 4.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, error handling, and validation across all stories

- [X] T034 [P] Add global error handling middleware (catch unhandled errors, return consistent JSON error format) in server/src/middleware/error.middleware.ts
- [X] T035 Mount error handling middleware in server/src/index.ts (must be last middleware)
- [X] T036 [P] Ensure all server responses exclude password field from User objects (add toJSON transform or select exclusion in Prisma queries)
- [X] T037 [P] Add logout functionality to AuthContext: clear token from localStorage, reset user state in client/src/contexts/AuthContext.tsx
- [X] T038 Add logout button to Sidebar component in client/src/components/layout/Sidebar.tsx
- [X] T039 Verify complete flow: register -> dashboard -> logout -> login -> dashboard -> refresh -> still authenticated
- [X] T040 Update server/.env.example and verify .gitignore excludes .env files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **US1 Registration (Phase 3)**: Depends on Phase 2
- **US2 Login (Phase 4)**: Depends on Phase 2. Shares files with US1 (auth.service.ts, auth.controller.ts, auth.routes.ts) so must run after US1 or coordinate
- **US3 Protected Routes (Phase 5)**: Depends on Phase 2 (AuthContext). Best after US1+US2 for full testing
- **US4 Profile (Phase 6)**: Depends on Phase 2 (auth middleware). Can run parallel with US1-US3
- **US5 Default Categories (Phase 7)**: Depends on Phase 2 (Prisma schema). Can run parallel with US1-US4
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Registration)**: After Foundational. No other story dependencies.
- **US2 (Login)**: After Foundational. Extends US1 files (auth service/controller/routes) so best sequenced after US1.
- **US3 (Protected Routes)**: After Foundational. Benefits from US1+US2 for end-to-end testing.
- **US4 (Profile)**: After Foundational. Independent of other stories.
- **US5 (Categories)**: After Foundational. Independent of other stories.

### Within Each User Story

- Models/schemas before services
- Services before controllers
- Controllers before routes
- Server before client (API must exist for frontend to consume)

### Parallel Opportunities

- T006, T007, T008 can run in parallel (different files)
- T010, T011, T012 can run in parallel (different files, different projects)
- US4 and US5 can run in parallel with each other (independent stories)
- T034, T036, T037 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (install deps, init Prisma)
2. Complete Phase 2: Foundational (schema, migration, auth infra)
3. Complete Phase 3: US1 Registration
4. Complete Phase 4: US2 Login
5. Complete Phase 5: US3 Protected Routes
6. **STOP and VALIDATE**: Full auth cycle works end-to-end

### Incremental Delivery

1. Setup + Foundational -> Database and auth infra ready
2. Add US1 (Register) -> New users can onboard
3. Add US2 (Login) -> Returning users can access app
4. Add US3 (Protected Routes) -> Security boundary enforced (MVP!)
5. Add US4 (Profile) -> Users can view their info
6. Add US5 (Categories) -> Default data seeded for future phases
7. Polish -> Error handling, logout, final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US1 and US2 share server files (auth.service.ts, auth.controller.ts, auth.routes.ts) — sequence US2 after US1
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Password must NEVER appear in any API response
