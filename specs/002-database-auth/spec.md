# Feature Specification: Database & Authentication

**Feature Branch**: `002-database-auth`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Implement Phase 2 Database & Auth"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registration (Priority: P1)

A new user visits the app and creates an account by providing their name, email address, and a password. After successful registration, they are automatically logged in and redirected to the main dashboard. Their credentials are stored securely so they can return later.

**Why this priority**: Without registration, no user can access the system. This is the foundational entry point for all other functionality.

**Independent Test**: Can be fully tested by navigating to the registration page, filling out the form, and verifying the user lands on the dashboard authenticated. Delivers the ability for new users to onboard.

**Acceptance Scenarios**:

1. **Given** a visitor is on the registration page, **When** they enter a valid name, unique email, and a strong password and submit the form, **Then** an account is created, they are logged in, and redirected to the dashboard.
2. **Given** a visitor is on the registration page, **When** they enter an email that is already registered, **Then** they see an error message indicating the email is already in use.
3. **Given** a visitor is on the registration page, **When** they enter a password that does not meet strength requirements (minimum 8 characters), **Then** they see a validation error before submission.

---

### User Story 2 - Returning User Login (Priority: P1)

A returning user visits the app and logs in with their email and password. Upon successful login, they are redirected to the dashboard and can access all protected features. Their session persists across page refreshes until they log out or the session expires.

**Why this priority**: Login is equally critical as registration -- returning users must be able to access their data.

**Independent Test**: Can be tested by logging in with valid credentials and verifying access to protected pages. Delivers secure access for returning users.

**Acceptance Scenarios**:

1. **Given** a registered user is on the login page, **When** they enter correct email and password, **Then** they are authenticated and redirected to the dashboard.
2. **Given** a user is on the login page, **When** they enter an incorrect password, **Then** they see a generic error message ("Invalid email or password") without revealing which field is wrong.
3. **Given** an authenticated user refreshes the page, **When** the page reloads, **Then** they remain logged in and can continue using the app.
4. **Given** an authenticated user, **When** their session token expires (after 7 days), **Then** they are redirected to the login page.

---

### User Story 3 - Protected Route Access (Priority: P1)

An unauthenticated user attempting to access any protected page (dashboard, accounts, transactions, etc.) is automatically redirected to the login page. After logging in, they are taken to the page they originally requested.

**Why this priority**: Security boundary enforcement is essential -- without it, user data could be exposed.

**Independent Test**: Can be tested by attempting to navigate to a protected URL while logged out and verifying the redirect to login.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they navigate to any protected route, **Then** they are redirected to the login page.
2. **Given** an unauthenticated visitor who was redirected to login, **When** they successfully log in, **Then** they are taken to the originally requested page.
3. **Given** an authenticated user, **When** they navigate to login or register pages, **Then** they are redirected to the dashboard.

---

### User Story 4 - View Own Profile (Priority: P2)

An authenticated user can view their own profile information (name, email, registration date) through a profile endpoint or settings page. This confirms their identity and account details.

**Why this priority**: Lower priority than core auth flows, but important for user confidence and future settings features.

**Independent Test**: Can be tested by logging in and requesting profile data, verifying the correct user information is returned.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request their profile, **Then** they see their name, email, and account creation date.
2. **Given** an unauthenticated request to the profile endpoint, **When** the request is made, **Then** it is rejected with an authorization error.

---

### User Story 5 - Default Categories Available (Priority: P2)

When a new user registers, a set of default transaction categories (Food, Transport, Salary, Rent, Entertainment, Shopping, Health, Utilities, Other) is available to them. These system-provided categories allow users to immediately start categorizing transactions without setup.

**Why this priority**: Categories are needed for the transaction feature in Phase 4, and seeding them during registration ensures a smooth experience.

**Independent Test**: Can be tested by registering a new user and verifying the default categories are accessible.

**Acceptance Scenarios**:

1. **Given** a newly registered user, **When** they request the list of categories, **Then** they see the system default categories for both income and expense types.
2. **Given** a system default category, **When** a user views it, **Then** it is clearly identified as a system category (not user-created).

---

### Edge Cases

- What happens when a user tries to register with an extremely long email or name? The system enforces maximum lengths (email: 255 chars, name: 100 chars).
- How does the system handle concurrent login attempts from the same account? Each login generates an independent token; multiple sessions are allowed.
- What happens if the database is unavailable during registration? The system returns a user-friendly error message indicating the service is temporarily unavailable.
- How does the system handle malformed or tampered authentication tokens? Tampered tokens are rejected, and the user is redirected to login.
- What happens when a user submits the login form with empty fields? Client-side validation prevents submission; server-side validation returns appropriate errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to create an account with name, email, and password.
- **FR-002**: System MUST validate email uniqueness during registration.
- **FR-003**: System MUST enforce password minimum length of 8 characters.
- **FR-004**: System MUST store passwords using a one-way hash -- never in plain text.
- **FR-005**: System MUST authenticate users via email and password, returning a session token on success.
- **FR-006**: System MUST reject authentication attempts with invalid credentials using a generic error message that does not reveal whether the email or password was incorrect.
- **FR-007**: System MUST validate and verify the session token on every request to a protected resource.
- **FR-008**: System MUST expire session tokens 7 days after login (absolute expiration, not sliding window).
- **FR-009**: System MUST provide a "get current user" endpoint that returns the authenticated user's profile (name, email, creation date).
- **FR-010**: System MUST redirect unauthenticated users to the login page when accessing protected routes.
- **FR-011**: System MUST redirect authenticated users away from login/register pages to the dashboard.
- **FR-012**: System MUST persist authentication state across page refreshes on the client by storing the session token in localStorage.
- **FR-013**: System MUST provide a logout function that clears the session token on the client.
- **FR-014**: System MUST seed a set of default transaction categories (both income and expense types) available to all users.
- **FR-015**: System MUST define the complete data model for users, accounts, transactions, categories, and exchange rates -- ready for use in subsequent phases.
- **FR-016**: System MUST validate all input on both client and server (email format, required fields, field lengths).
- **FR-017**: System MUST include an authenticated API service layer on the client that automatically attaches the session token to all requests.

### Key Entities

- **User**: Represents a registered person. Key attributes: name, email, hashed password, preferred base currency. Each user owns accounts, transactions, and custom categories.
- **Account**: A source of money belonging to a user. Types: cash, bank, wallet, gold. Has a currency/unit and a balance tracked in the smallest unit (piasters for EGP, cents for USD/EUR, grams for gold).
- **Transaction**: A financial event (income, expense, or transfer) linked to a user and an account. Includes amount, category, date, and optional note. Transfers reference a destination account.
- **Category**: A classification for transactions (e.g., Food, Salary, Rent). Can be system-default (available to all) or user-created. Has a type (income or expense), icon, and color.
- **Exchange Rate**: A cached conversion rate from a foreign currency to the base currency (EGP). Includes the source API and fetch timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users can complete registration in under 30 seconds.
- **SC-002**: Returning users can log in and reach the dashboard in under 10 seconds.
- **SC-003**: 100% of requests to protected resources without valid authentication are rejected.
- **SC-004**: Passwords are never stored or transmitted in plain text.
- **SC-005**: Authentication state persists across page refreshes without requiring re-login (within the 7-day session window).
- **SC-006**: All form inputs display inline validation errors within 1 second of user interaction.
- **SC-007**: The complete data model (all 5 entity types) is defined and the database schema is ready for use by subsequent phases.
- **SC-008**: Default categories are available immediately upon user registration with no additional setup.

## Clarifications

### Session 2026-03-20

- Q: Where should auth tokens be stored on the client? → A: localStorage (simple, standard for SPAs, persists across tabs/refreshes)
- Q: Should token expiration be absolute or sliding window? → A: Absolute expiration — token expires 7 days from login, regardless of activity
- Q: What unit should gold balances be stored in? → A: Grams (integer) — simple integer storage without sub-gram precision

## Assumptions

- The application will use token-based authentication stored in localStorage rather than server-side sessions or httpOnly cookies, as this is standard for single-page applications.
- Password strength requirements are limited to minimum 8 characters for MVP; additional complexity rules (uppercase, numbers, symbols) can be added later.
- Multiple concurrent sessions from the same user are allowed (e.g., logging in from both desktop and mobile).
- The database schema for all entities (accounts, transactions, categories, exchange rates) will be created in this phase, even though the corresponding features are built in later phases. This ensures the data layer is complete and ready.
- Default categories will be system-level (shared across all users) rather than duplicated per user, to simplify management.
- Email verification is not required for MVP registration.
- Password reset/recovery is out of scope for this phase.

## Scope Boundaries

### In Scope
- User registration and login (server + client)
- Session token generation, verification, and expiration
- Password hashing
- Auth middleware for protecting server routes
- Protected route wrapper on the client
- Auth context (store token, user info, login/logout)
- API service layer with automatic auth headers
- Complete database schema (all 5 entity types)
- Database migration
- Default category seeding
- Login and Register pages with form validation

### Out of Scope
- Password reset / forgot password flow
- Email verification
- OAuth / social login
- Account management UI (Phase 3)
- Transaction CRUD (Phase 4)
- Exchange rate fetching (Phase 5)
- User profile editing / settings page (Phase 9)
- Rate limiting or brute-force protection (can be added later)

## Dependencies

- Phase 1 (Project Setup & Foundation) must be complete -- server and client apps must be running.
- A PostgreSQL database instance must be available and accessible.
