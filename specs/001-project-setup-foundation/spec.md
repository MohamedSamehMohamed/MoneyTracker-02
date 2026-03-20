# Feature Specification: Project Setup & Foundation

**Feature Branch**: `001-project-setup-foundation`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Phase 1 - Project Setup and Foundation from plan.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Starts Backend Server (Priority: P1)

A developer clones the repository and wants to start the backend server locally. They navigate to the `server/` folder, install dependencies, and run a dev command. The server starts and responds to a health-check request, confirming the foundation is working.

**Why this priority**: Without a running backend, no other feature can be built or tested. This is the first thing any developer needs.

**Independent Test**: Can be tested by running `npm run dev` in the server folder and sending a GET request to `/api/health` — a successful JSON response confirms the server is operational.

**Acceptance Scenarios**:

1. **Given** the server dependencies are installed, **When** the developer runs `npm run dev` in the `server/` directory, **Then** the Express server starts on port 3001 and logs a startup message.
2. **Given** the server is running, **When** a GET request is sent to `/api/health`, **Then** a JSON response with status "ok" is returned.
3. **Given** the server has TypeScript configured, **When** the developer modifies a `.ts` file, **Then** the server automatically restarts with the updated code (hot reload).

---

### User Story 2 - Developer Starts Frontend App (Priority: P1)

A developer navigates to the `client/` folder, installs dependencies, and runs the dev command. The React app starts in the browser with a basic layout and placeholder pages accessible via navigation.

**Why this priority**: The frontend is equally essential — developers need both halves of the application running to build features end-to-end.

**Independent Test**: Can be tested by running `npm run dev` in the client folder — the app opens in a browser with a navigable layout and placeholder pages at defined routes.

**Acceptance Scenarios**:

1. **Given** the client dependencies are installed, **When** the developer runs `npm run dev` in the `client/` directory, **Then** the Vite dev server starts and the React app is accessible in the browser.
2. **Given** the app is running, **When** the developer navigates to `/`, `/login`, `/register`, `/transactions`, `/accounts`, **Then** each route renders a placeholder page with the correct page title.
3. **Given** the app has Tailwind CSS configured, **When** the developer uses Tailwind utility classes in a component, **Then** the styles are applied correctly in the browser.

---

### User Story 3 - Developer Navigates the Codebase (Priority: P2)

A developer wants to understand where to add new features. The project has a clear, consistent folder structure with separate client and server directories, each with well-organized subdirectories for different concerns (routes, components, services, etc.).

**Why this priority**: A clear structure prevents confusion and technical debt as the project grows. Establishing conventions early saves time later.

**Independent Test**: Can be tested by inspecting the folder structure — all directories defined in the project structure plan exist and are logically organized.

**Acceptance Scenarios**:

1. **Given** the project is set up, **When** a developer opens the repository, **Then** they see separate `client/` and `server/` top-level directories with clear separation of concerns.
2. **Given** the server directory exists, **When** a developer inspects it, **Then** they find organized subdirectories: `routes/`, `controllers/`, `middleware/`, `services/`, `utils/`, `types/`.
3. **Given** the client directory exists, **When** a developer inspects it, **Then** they find organized subdirectories: `components/ui/`, `components/layout/`, `pages/`, `hooks/`, `services/`, `store/`, `types/`, `utils/`.

---

### User Story 4 - Environment Configuration (Priority: P2)

A developer needs to configure environment-specific settings (database URL, API keys, ports). They find `.env.example` files with documented placeholder values that they can copy to `.env` and fill in with their own values.

**Why this priority**: Proper environment configuration prevents secrets from being committed and lets each developer customize their local setup.

**Independent Test**: Can be tested by verifying `.env.example` files exist with documented placeholders, and `.env` files are in `.gitignore`.

**Acceptance Scenarios**:

1. **Given** the project is cloned, **When** a developer looks for configuration, **Then** they find `.env.example` files in both `client/` and `server/` directories with all required variables documented.
2. **Given** `.env` files exist, **When** a developer checks `.gitignore`, **Then** `.env` files are excluded from version control.
3. **Given** the server `.env.example` exists, **When** a developer reads it, **Then** it contains placeholders for: database URL, JWT secret, API keys, and port number.

---

### Edge Cases

- What happens when the developer runs the server without a `.env` file? The server should start with sensible defaults or show a clear error message indicating which variables are missing.
- What happens when port 3001 or 5173 is already in use? The dev server should show a clear error message about the port conflict.
- What happens when Node.js version is incompatible? The project should specify a minimum Node.js version requirement.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Project MUST have separate `client/` and `server/` directories forming a monorepo structure
- **FR-002**: Server MUST be an Express application written in TypeScript with hot-reload during development
- **FR-003**: Client MUST be a React 18 application bootstrapped with Vite and TypeScript
- **FR-004**: Client MUST have Tailwind CSS configured and functional for styling
- **FR-005**: Client MUST have React Router configured with placeholder pages for all planned routes: `/`, `/login`, `/register`, `/transactions`, `/transactions/new`, `/accounts`, `/categories`, `/reports`, `/settings`
- **FR-006**: Client MUST have a basic layout structure with a sidebar/navigation and main content area
- **FR-007**: Server MUST expose a health-check endpoint (`GET /api/health`) that returns a JSON status response
- **FR-008**: Both client and server MUST have `.env.example` files documenting all required environment variables
- **FR-009**: Project MUST have a `.gitignore` that excludes `node_modules/`, `.env`, `dist/`, and other build artifacts
- **FR-010**: Server MUST have organized subdirectories: `routes/`, `controllers/`, `middleware/`, `services/`, `utils/`, `types/`
- **FR-011**: Client MUST have organized subdirectories: `components/ui/`, `components/layout/`, `pages/`, `hooks/`, `services/`, `store/`, `types/`, `utils/`
- **FR-012**: Both projects MUST compile without TypeScript errors
- **FR-013**: Project MUST specify a minimum Node.js version requirement

### Key Entities

No data entities are involved in this phase — this is purely project scaffolding and configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can clone the repo, install dependencies, and have both client and server running within 5 minutes
- **SC-002**: The server responds to health-check requests with a valid JSON response
- **SC-003**: The client renders a navigable application with all 9 placeholder pages accessible via routing
- **SC-004**: Both TypeScript projects compile with zero errors
- **SC-005**: Tailwind CSS utility classes render correctly in the browser
- **SC-006**: File changes in both client and server trigger automatic reload during development
- **SC-007**: All environment variables are documented in `.env.example` files

## Assumptions

- Developers have Node.js (v18+) and npm installed locally
- Developers have a code editor with TypeScript support
- PostgreSQL database setup is deferred to Phase 2 (this phase focuses on app skeleton only)
- No authentication or data persistence is implemented in this phase
- The client and server are started independently (no unified dev command needed yet)
