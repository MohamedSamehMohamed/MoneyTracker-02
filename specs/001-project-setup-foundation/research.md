# Research: Project Setup & Foundation

**Feature**: 001-project-setup-foundation
**Date**: 2026-03-20

## Research Tasks

### 1. Vite + React + TypeScript Template Configuration

**Decision**: Use `npm create vite@latest` with the `react-ts` template.
**Rationale**: Official Vite scaffold provides a minimal, well-configured starting point with TypeScript, HMR, and optimized build out of the box. No custom webpack or bundler config needed.
**Alternatives considered**:
- Create React App (CRA): Deprecated, slower, heavier
- Next.js: Overkill for an SPA that has its own backend
- Manual setup: Unnecessary complexity for standard React+TS

### 2. Tailwind CSS Integration with Vite

**Decision**: Use Tailwind CSS v3 with PostCSS plugin approach.
**Rationale**: Standard integration path recommended by Tailwind docs. PostCSS plugin works seamlessly with Vite's built-in PostCSS support. No additional Vite plugins needed.
**Alternatives considered**:
- Tailwind v4 (alpha): Too new, not stable enough for production
- CSS Modules: Less utility-first, more boilerplate
- Styled-components: Runtime overhead, different paradigm than planned

### 3. Express + TypeScript Dev Setup

**Decision**: Use `ts-node-dev` with `--respawn` flag for hot-reload development.
**Rationale**: `ts-node-dev` combines TypeScript compilation and file watching in one tool. Faster restarts than `nodemon + tsc` because it reuses the TypeScript compilation. Simple setup with a single npm script.
**Alternatives considered**:
- `nodemon` + `tsc --watch`: Two processes to manage, slower restart
- `tsx watch`: Newer option, uses esbuild — viable but less established in Express ecosystem
- `tsc --watch` + `node`: Manual two-step, no auto-restart

### 4. Project Structure — Monorepo Approach

**Decision**: Simple folder-based monorepo (`client/` and `server/` at root) without a monorepo tool.
**Rationale**: With only two packages that don't share code yet, npm/yarn workspaces or tools like Turborepo add unnecessary complexity. Each folder has its own `package.json` and is managed independently. Can upgrade to workspaces later if shared code emerges.
**Alternatives considered**:
- npm workspaces: Adds lockfile complexity for no benefit with 2 independent packages
- Turborepo/Nx: Overkill for 2 packages, adds learning curve
- Single package.json: Conflates dependencies, harder to manage

### 5. React Router Setup Pattern

**Decision**: Use React Router v6 with a layout route pattern — public routes (login, register) sit outside the layout, authenticated routes share a sidebar layout.
**Rationale**: Layout routes let us wrap authenticated pages in a shared shell (sidebar + header) while keeping auth pages full-screen. This is the standard React Router v6 pattern and prepares for protected routes in Phase 2.
**Alternatives considered**:
- Flat route list: Would require repeating layout in every page component
- TanStack Router: More type-safe but adds complexity for this phase

### 6. Environment Variable Management

**Decision**: Use `dotenv` for server, Vite's built-in `VITE_` prefix env vars for client. Provide `.env.example` files as documentation.
**Rationale**: `dotenv` is the standard for Node.js apps. Vite natively supports `VITE_`-prefixed env vars without additional setup. `.env.example` files serve as documentation without exposing real values.
**Alternatives considered**:
- `env-cmd`: Extra dependency for minimal benefit over dotenv
- Docker env injection: Not needed for local development phase

## All NEEDS CLARIFICATION: Resolved

No unresolved unknowns — all technology choices are well-established and documented in the plan.md Tech Stack section.
