# Implementation Plan: Project Setup & Foundation

**Branch**: `001-project-setup-foundation` | **Date**: 2026-03-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-project-setup-foundation/spec.md`

## Summary

Set up the monorepo foundation for a Personal Finance Tracker app with a React+Vite+TypeScript frontend (`client/`) and an Express+TypeScript backend (`server/`). This phase delivers a running skeleton — both apps boot, the server responds to a health check, the client renders placeholder pages with navigation, and the folder structure supports all future phases.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+
**Primary Dependencies**:
- Server: Express 4.x, ts-node-dev (hot reload)
- Client: React 18, Vite 5.x, Tailwind CSS 3.x, React Router 6.x
**Storage**: N/A (database setup deferred to Phase 2)
**Testing**: N/A for this phase (testing infrastructure added with Phase 2)
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: Web application (monorepo: client + server)
**Performance Goals**: N/A (scaffolding only — dev server boot time < 10s)
**Constraints**: Must work on Windows, macOS, and Linux dev environments
**Scale/Scope**: Single developer, local development only in this phase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution is not yet defined (default template). No gates to evaluate. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-setup-foundation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no data entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── health.md        # Health endpoint contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
client/                          React frontend
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                  Reusable base components (Button, Input, Card)
│   │   └── layout/              Layout shell (Sidebar, Header, PageWrapper)
│   ├── pages/                   Route-level page components
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── NewTransactionPage.tsx
│   │   ├── AccountsPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/                   Custom React hooks
│   ├── services/                API client functions
│   ├── store/                   Auth context, global state
│   ├── types/                   Shared TypeScript types
│   ├── utils/                   Formatting, date, currency helpers
│   ├── App.tsx                  Router setup + layout
│   └── main.tsx                 Entry point
├── index.html
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── package.json

server/                          Express backend
├── src/
│   ├── routes/                  Route definitions
│   │   └── health.ts            Health check route
│   ├── controllers/             Request handlers / business logic
│   ├── middleware/               Auth, validation, error handling
│   ├── services/                External API calls, cron jobs
│   ├── utils/                   Helpers
│   ├── types/                   TypeScript type definitions
│   └── index.ts                 Express app entry point
├── tsconfig.json
├── .env.example
└── package.json

.gitignore                       Root gitignore
```

**Structure Decision**: Web application monorepo with `client/` and `server/` at root level. Chosen because the frontend and backend share no code in this phase, have independent dependency trees, and are started separately. This mirrors the plan.md Section 7 structure.

## Implementation Approach

### Step 1: Server Skeleton

1. Create `server/` directory with `package.json`
2. Install dependencies: `express`, `cors`, `dotenv`, `typescript`, `ts-node-dev`, `@types/express`, `@types/cors`
3. Configure `tsconfig.json` (strict mode, ES2020 target, CommonJS modules)
4. Create `src/index.ts` — Express app with CORS, JSON parsing, health route
5. Create `src/routes/health.ts` — `GET /api/health` returning `{ status: "ok", timestamp }`
6. Add `npm run dev` script using `ts-node-dev --respawn`
7. Create `.env.example` with PORT placeholder

### Step 2: Client Skeleton

1. Scaffold with `npm create vite@latest client -- --template react-ts`
2. Install additional dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `react-router-dom`
3. Initialize Tailwind: config file + PostCSS config + directives in CSS
4. Create folder structure: `components/ui/`, `components/layout/`, `pages/`, `hooks/`, `services/`, `store/`, `types/`, `utils/`
5. Create 9 placeholder page components (just title + description text)
6. Create layout components: `Sidebar` (navigation links) + `PageWrapper` (content area)
7. Set up `App.tsx` with React Router — public routes (`/login`, `/register`) and layout-wrapped routes for the rest
8. Create `.env.example` with `VITE_API_URL` placeholder

### Step 3: Root Configuration

1. Create root `.gitignore` (node_modules, .env, dist, .DS_Store, etc.)
2. Add `engines` field to both `package.json` files specifying Node.js >= 18

## Complexity Tracking

No constitution violations to justify — structure is straightforward.
