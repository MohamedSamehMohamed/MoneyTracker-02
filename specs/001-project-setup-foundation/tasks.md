# Tasks: Project Setup & Foundation

**Input**: Design documents from `/specs/001-project-setup-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested for this phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project skeleton, install dependencies, configure build tools

- [x] T001 Create root `.gitignore` with entries for node_modules/, .env, dist/, .DS_Store, *.log
- [x] T002 [P] Initialize `server/package.json` with name, scripts, engines (node >=18), and install dependencies: express, cors, dotenv, typescript, ts-node-dev, @types/express, @types/cors, @types/node
- [x] T003 [P] Create `client/` using `npm create vite@latest` with react-ts template, then install additional dependencies: tailwindcss, postcss, autoprefixer, react-router-dom
- [x] T004 [P] Create `server/tsconfig.json` with strict mode, ES2020 target, CommonJS module, outDir dist/, rootDir src/
- [x] T005 [P] Configure Tailwind CSS in client: create `client/tailwind.config.ts`, `client/postcss.config.js`, add Tailwind directives to `client/src/index.css`

**Checkpoint**: Both project directories exist with dependencies installed and build tools configured.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the folder structures and base files that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create server folder structure: `server/src/routes/`, `server/src/controllers/`, `server/src/middleware/`, `server/src/services/`, `server/src/utils/`, `server/src/types/`
- [x] T007 [P] Create client folder structure: `client/src/components/ui/`, `client/src/components/layout/`, `client/src/pages/`, `client/src/hooks/`, `client/src/services/`, `client/src/store/`, `client/src/types/`, `client/src/utils/`
- [x] T008 [P] Create `server/.env.example` with PORT=3001 and `client/.env.example` with VITE_API_URL=http://localhost:3001/api

**Checkpoint**: Foundation ready - all directories exist, env templates in place.

---

## Phase 3: User Story 1 - Developer Starts Backend Server (Priority: P1)

**Goal**: Server boots with Express, responds to health check, hot-reloads on file changes.

**Independent Test**: Run `npm run dev` in server/, then `curl http://localhost:3001/api/health` returns `{"status":"ok","timestamp":"..."}`.

### Implementation for User Story 1

- [x] T009 [US1] Create Express app entry point in `server/src/index.ts` — import express, cors, dotenv; configure JSON parsing, CORS; listen on PORT from env (default 3001); log startup message
- [x] T010 [US1] Create health check route in `server/src/routes/health.ts` — `GET /api/health` returns `{ status: "ok", timestamp: new Date().toISOString() }`
- [x] T011 [US1] Register health route in `server/src/index.ts` and add `dev` script to `server/package.json`: `ts-node-dev --respawn --transpile-only src/index.ts`
- [x] T012 [US1] Verify server starts and health endpoint responds with correct JSON

**Checkpoint**: Backend server is running, health endpoint works, hot-reload active.

---

## Phase 4: User Story 2 - Developer Starts Frontend App (Priority: P1)

**Goal**: React app boots with Vite, displays navigable pages with sidebar layout, Tailwind works.

**Independent Test**: Run `npm run dev` in client/, navigate to all 9 routes in the browser — each shows its page title within a sidebar layout.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create layout component `client/src/components/layout/Sidebar.tsx` — navigation links to all 9 routes (Dashboard, Transactions, Accounts, Categories, Reports, Settings), app title/logo area
- [x] T014 [P] [US2] Create layout component `client/src/components/layout/PageWrapper.tsx` — wraps page content with consistent padding and max-width
- [x] T015 [P] [US2] Create 9 placeholder page components in `client/src/pages/`: DashboardPage.tsx, LoginPage.tsx, RegisterPage.tsx, TransactionsPage.tsx, NewTransactionPage.tsx, AccountsPage.tsx, CategoriesPage.tsx, ReportsPage.tsx, SettingsPage.tsx — each displays page title and brief description
- [x] T016 [US2] Set up React Router in `client/src/App.tsx` — public routes (/login, /register) render without sidebar; all other routes render inside a layout with Sidebar + PageWrapper
- [x] T017 [US2] Verify all 9 routes render correctly, sidebar navigation works, Tailwind styles apply

**Checkpoint**: Frontend app is running, all pages navigable, sidebar layout functional, Tailwind working.

---

## Phase 5: User Story 3 - Developer Navigates the Codebase (Priority: P2)

**Goal**: Folder structure matches the plan exactly — a developer can find where to add any feature.

**Independent Test**: Inspect `client/src/` and `server/src/` directories — all planned subdirectories exist with placeholder files.

### Implementation for User Story 3

- [x] T018 [P] [US3] Add placeholder `.gitkeep` or index files in empty server directories: `server/src/controllers/`, `server/src/middleware/`, `server/src/services/`, `server/src/utils/`, `server/src/types/`
- [x] T019 [P] [US3] Add placeholder `.gitkeep` or index files in empty client directories: `client/src/hooks/`, `client/src/services/`, `client/src/store/`, `client/src/types/`, `client/src/utils/`, `client/src/components/ui/`
- [x] T020 [US3] Verify all directories from plan.md Section 7 exist and are committed to git

**Checkpoint**: Full folder structure matches the architecture plan.

---

## Phase 6: User Story 4 - Environment Configuration (Priority: P2)

**Goal**: Environment variables are documented, .env files are gitignored, defaults work.

**Independent Test**: Delete .env files and run both apps — server starts on default port 3001, client connects to default API URL.

### Implementation for User Story 4

- [x] T021 [US4] Verify `.gitignore` includes `.env` entries (already created in T001)
- [x] T022 [US4] Verify `server/.env.example` documents all variables with comments: PORT (default 3001), DATABASE_URL (Phase 2), JWT_SECRET (Phase 2), EXCHANGE_RATE_API_KEY (Phase 5), GOLD_API_KEY (Phase 5)
- [x] T023 [US4] Verify `client/.env.example` documents VITE_API_URL with comment explaining usage
- [x] T024 [US4] Ensure server `src/index.ts` uses `process.env.PORT || 3001` as fallback when .env is missing

**Checkpoint**: Environment configuration is documented and has sensible defaults.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T025 Verify both `client/` and `server/` compile with zero TypeScript errors (`npx tsc --noEmit`)
- [x] T026 Verify `server/package.json` and `client/package.json` both have `engines: { "node": ">=18" }`
- [x] T027 Run quickstart.md validation — follow the quickstart steps from scratch and verify everything works
- [x] T028 Commit all changes with descriptive message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **US1 - Backend Server (Phase 3)**: Depends on Phase 2 (needs server folder + config)
- **US2 - Frontend App (Phase 4)**: Depends on Phase 2 (needs client folder + config)
- **US3 - Codebase Structure (Phase 5)**: Depends on Phases 3 & 4 (verifies their output)
- **US4 - Environment Config (Phase 6)**: Depends on Phases 3 & 4 (verifies their .env setup)
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Backend Server)**: Independent after Phase 2
- **US2 (Frontend App)**: Independent after Phase 2 — can run in parallel with US1
- **US3 (Codebase Structure)**: Depends on US1 + US2 (validates their directories)
- **US4 (Environment Config)**: Depends on US1 + US2 (validates their .env files)

### Parallel Opportunities

- T002 + T003: Server and client init can run in parallel
- T004 + T005: TypeScript config and Tailwind config can run in parallel
- T006 + T007 + T008: All foundational directory/file creation in parallel
- T013 + T014 + T015: All client component creation in parallel
- T018 + T019: Placeholder files in server and client in parallel
- **US1 + US2**: Backend and frontend setup are fully independent

---

## Parallel Example: Phase 1

```text
# These can all run in parallel (different directories, no dependencies):
T002: Initialize server/package.json and install server dependencies
T003: Create client/ with Vite and install client dependencies
T004: Create server/tsconfig.json
T005: Configure Tailwind CSS in client
```

## Parallel Example: User Story 2

```text
# These can all run in parallel (different files):
T013: Create Sidebar.tsx layout component
T014: Create PageWrapper.tsx layout component
T015: Create all 9 placeholder page components
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup — project skeletons ready
2. Complete Phase 2: Foundational — directories and env files
3. Complete Phase 3: US1 — backend server running
4. Complete Phase 4: US2 — frontend app running
5. **STOP and VALIDATE**: Both apps boot, health check works, pages render
6. This is the minimum viable foundation for Phase 2 of the overall plan

### Full Delivery

1. Setup + Foundational → skeleton ready
2. US1 (server) + US2 (client) in parallel → both apps running
3. US3 + US4 → structure verified, env documented
4. Polish → TypeScript clean, quickstart validated
5. **Total**: 28 tasks across 7 phases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No tests requested for this phase — testing infrastructure added in Phase 2
- Commit after each phase or logical group
- Stop at any checkpoint to validate independently
