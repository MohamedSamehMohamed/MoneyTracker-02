# Personal Finance Tracker App – Full Plan

## Overview

Build an app to track your total money across multiple sources:

- Cash (EGP, USD, etc.)
- Gold (grams)
- Bank / Wallets

The app calculates your **total net worth** converted to one base currency (EGP).

---

# 1. Core Features (MVP)

## Must-have:

- User registration & login (JWT auth)
- Add transaction (income / expense / transfer)
- Select source (Cash / Gold / Bank / Wallet)
- Store per transaction:
  - Amount (in original currency/unit)
  - Currency or asset type
  - Category
  - Date
  - Note
- Show current balance per source
- Show total net worth in EGP
- Transaction history with filters (date range, source, category)

## Nice-to-have (post-MVP):

- Recurring transactions (salary, subscriptions)
- Budget goals per category
- Dashboard charts (spending over time, net worth trend, breakdown by category)
- Export to CSV
- Dark mode

---

# 2. Key Concept

You are tracking **value**, not just money.

### Asset Types:

| Type     | Unit        | Conversion Method               |
| -------- | ----------- | ------------------------------- |
| Cash EGP | EGP         | 1:1 (base currency)            |
| Cash USD | USD         | USD × exchange rate → EGP      |
| Cash EUR | EUR         | EUR × exchange rate → EGP      |
| Gold     | grams       | grams × gold price/gram → EGP  |
| Bank     | EGP         | 1:1                            |
| Wallet   | EGP         | 1:1                            |

### Formula:

```
Total Net Worth (EGP) =
    Cash_EGP
  + Cash_USD × USD_to_EGP_rate
  + Cash_EUR × EUR_to_EGP_rate
  + Gold_grams × gold_price_per_gram_EGP
  + Bank_balance
  + Wallet_balance
```

### Important Rules:

- Always store amounts in their **original currency/unit** — never store the converted value
- Use **integers (piasters)** for EGP amounts to avoid floating-point errors (1 EGP = 100 piasters)
- Exchange rates are fetched periodically and cached (not per-request)

---

# 3. Tech Stack

## Frontend

- **React 18** (Vite)
- **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query (TanStack Query)** for server state / API calls
- **Recharts** for dashboard charts
- **React Hook Form + Zod** for form validation

## Backend

- **Node.js + Express**
- **TypeScript**
- **Prisma ORM**
- **JWT** for authentication
- **bcrypt** for password hashing
- **Zod** for request validation
- **node-cron** for scheduled exchange rate updates

## Database

- **PostgreSQL** — the data is relational (users → accounts → transactions), and financial data benefits from strong typing and ACID transactions

## External APIs

- **Exchange rates**: ExchangeRate-API (free tier) or Open Exchange Rates
- **Gold price**: GoldAPI.io or metals-api.com

---

# 4. Database Design

## Users

```
users
├── id            UUID, primary key
├── name          VARCHAR(100)
├── email         VARCHAR(255), unique
├── password      VARCHAR(255), bcrypt hash
├── base_currency VARCHAR(3), default 'EGP'
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP
```

## Accounts

Each user has multiple accounts (sources of money).

```
accounts
├── id          UUID, primary key
├── user_id     UUID, foreign key → users.id
├── name        VARCHAR(100)        e.g. "Cash EGP", "NBE Bank", "Vodafone Cash"
├── type        ENUM('cash', 'bank', 'wallet', 'gold')
├── currency    VARCHAR(10)         e.g. "EGP", "USD", "GOLD_GRAM"
├── balance     BIGINT              current balance (in smallest unit: piasters, cents, milligrams)
├── icon        VARCHAR(50)         optional, for UI
├── created_at  TIMESTAMP
└── updated_at  TIMESTAMP
```

## Transactions

```
transactions
├── id              UUID, primary key
├── user_id         UUID, foreign key → users.id
├── account_id      UUID, foreign key → accounts.id
├── type            ENUM('income', 'expense', 'transfer')
├── amount          BIGINT           positive value, in account's smallest unit
├── category_id     UUID, foreign key → categories.id, nullable
├── note            TEXT, nullable
├── date            DATE
├── transfer_to_id  UUID, foreign key → accounts.id, nullable (for transfers)
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

## Categories

```
categories
├── id        UUID, primary key
├── user_id   UUID, foreign key → users.id (null = system default)
├── name      VARCHAR(50)       e.g. "Food", "Salary", "Rent", "Transport"
├── type      ENUM('income', 'expense')
├── icon      VARCHAR(50)
└── color     VARCHAR(7)        hex color
```

## Exchange Rates (cached)

```
exchange_rates
├── id              UUID, primary key
├── from_currency   VARCHAR(10)
├── to_currency     VARCHAR(10)     always 'EGP'
├── rate            DECIMAL(18, 6)
├── fetched_at      TIMESTAMP
└── source          VARCHAR(50)     API name
```

---

# 5. API Endpoints

## Auth

```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login, returns JWT
GET    /api/auth/me           Get current user profile
```

## Accounts

```
GET    /api/accounts           List user's accounts
POST   /api/accounts           Create account
PATCH  /api/accounts/:id       Update account (name, icon)
DELETE /api/accounts/:id       Delete account (only if balance is 0)
```

## Transactions

```
GET    /api/transactions                List transactions (with filters & pagination)
POST   /api/transactions                Create transaction
PATCH  /api/transactions/:id            Update transaction
DELETE /api/transactions/:id            Delete transaction
GET    /api/transactions/summary        Get spending summary (by category, by date range)
```

## Categories

```
GET    /api/categories          List categories (system defaults + user custom)
POST   /api/categories          Create custom category
PATCH  /api/categories/:id      Update category
DELETE /api/categories/:id      Delete custom category
```

## Dashboard / Stats

```
GET    /api/dashboard/net-worth          Total net worth in base currency
GET    /api/dashboard/balances           All account balances (original + converted)
GET    /api/dashboard/spending-chart     Monthly spending data for charts
GET    /api/dashboard/income-vs-expense  Income vs expense over time
```

## Exchange Rates

```
GET    /api/rates                Current exchange rates
POST   /api/rates/refresh        Force refresh rates (admin/manual)
```

---

# 6. Frontend Pages

| Page             | Route                | Description                                        |
| ---------------- | -------------------- | -------------------------------------------------- |
| Login            | `/login`             | Email + password login                             |
| Register         | `/register`          | Create account                                     |
| Dashboard        | `/`                  | Net worth, account balances, recent transactions   |
| Transactions     | `/transactions`      | Full transaction list with filters                 |
| Add Transaction  | `/transactions/new`  | Form to add income/expense/transfer                |
| Accounts         | `/accounts`          | Manage accounts (cash, bank, gold, wallets)        |
| Categories       | `/categories`        | Manage transaction categories                      |
| Reports          | `/reports`           | Charts: spending trends, net worth over time       |
| Settings         | `/settings`          | Profile, base currency, preferences                |

---

# 7. Project Structure

```
MoneyTrackerNew/
├── client/                     React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         Reusable UI components
│   │   │   ├── ui/             Base components (Button, Input, Card, Modal)
│   │   │   └── layout/         Layout components (Sidebar, Header, PageWrapper)
│   │   ├── pages/              Page components matching routes
│   │   ├── hooks/              Custom React hooks
│   │   ├── services/           API client functions
│   │   ├── store/              Global state (auth context)
│   │   ├── types/              TypeScript type definitions
│   │   ├── utils/              Helpers (formatting, date, currency)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── server/                     Express backend
│   ├── prisma/
│   │   └── schema.prisma       Database schema
│   ├── src/
│   │   ├── routes/             Route handlers
│   │   ├── controllers/        Business logic
│   │   ├── middleware/          Auth, validation, error handling
│   │   ├── services/           External API calls (rates), cron jobs
│   │   ├── utils/              Helpers
│   │   ├── types/              TypeScript types
│   │   └── index.ts            Entry point
│   ├── tsconfig.json
│   └── package.json
│
├── plan.md
└── README.md
```

---

# 8. Implementation Phases

> Pick any phase and say "do phase X" to start working on it.
> Each phase is self-contained and builds on the previous ones.

---

## Phase 1 — Project Setup & Foundation

> **Goal**: Get both apps running with zero features, just the skeleton.

- [ ] 1.1 Create `server/` folder, init npm, install Express + TypeScript + ts-node-dev
- [ ] 1.2 Create `client/` folder using Vite + React + TypeScript template
- [ ] 1.3 Install and configure Tailwind CSS in client
- [ ] 1.4 Set up folder structure (as defined in Section 7)
- [ ] 1.5 Add `.env` files with placeholder values (both client and server)
- [ ] 1.6 Add `.gitignore` (node_modules, .env, dist, etc.)
- [ ] 1.7 Server: create basic Express app with health-check route (`GET /api/health`)
- [ ] 1.8 Client: create basic App with React Router and placeholder pages
- [ ] 1.9 Verify both apps run (`npm run dev` in each)

**Result**: Server running on :3001, Client running on :5173, both responding.

---

## Phase 2 — Database & Auth

> **Goal**: Users can register, login, and access protected routes.

- [ ] 2.1 Install and configure Prisma with PostgreSQL
- [ ] 2.2 Define Prisma schema: User, Account, Transaction, Category, ExchangeRate models
- [ ] 2.3 Run initial migration (`prisma migrate dev`)
- [ ] 2.4 Create auth routes: `POST /api/auth/register`, `POST /api/auth/login`
- [ ] 2.5 Implement password hashing with bcrypt
- [ ] 2.6 Implement JWT token generation and verification
- [ ] 2.7 Create auth middleware (protect routes, extract user from token)
- [ ] 2.8 Create `GET /api/auth/me` route
- [ ] 2.9 Seed default categories (Food, Transport, Salary, Rent, Entertainment, etc.)
- [ ] 2.10 Client: build Login page with form
- [ ] 2.11 Client: build Register page with form
- [ ] 2.12 Client: create AuthContext (store token, user, login/logout functions)
- [ ] 2.13 Client: add protected route wrapper (redirect to /login if not authenticated)
- [ ] 2.14 Client: create API service layer (axios/fetch with auth header)

**Result**: Users can register, login, and stay authenticated. Protected pages redirect to login.

---

## Phase 3 — Accounts Management

> **Goal**: Users can create and manage their money sources.

- [ ] 3.1 Server: `GET /api/accounts` — list user's accounts
- [ ] 3.2 Server: `POST /api/accounts` — create account (name, type, currency)
- [ ] 3.3 Server: `PATCH /api/accounts/:id` — update account name/icon
- [ ] 3.4 Server: `DELETE /api/accounts/:id` — delete account (only if balance is 0)
- [ ] 3.5 Server: input validation with Zod for all account routes
- [ ] 3.6 Client: Accounts page — list all accounts with balances
- [ ] 3.7 Client: "Add Account" modal/form (select type: cash/bank/wallet/gold, currency, name)
- [ ] 3.8 Client: edit and delete account actions
- [ ] 3.9 Client: account type icons and visual indicators

**Result**: Users can create accounts like "Cash EGP", "Gold Savings", "NBE Bank", "Vodafone Cash".

---

## Phase 4 — Transactions (Core Feature)

> **Goal**: Users can add income/expenses and see their transaction history.

- [ ] 4.1 Server: `POST /api/transactions` — create transaction + update account balance
- [ ] 4.2 Server: `GET /api/transactions` — list with pagination, filters (date, account, category, type)
- [ ] 4.3 Server: `PATCH /api/transactions/:id` — edit transaction + recalculate balance
- [ ] 4.4 Server: `DELETE /api/transactions/:id` — delete + reverse balance change
- [ ] 4.5 Server: transfer logic — deduct from one account, add to another (as a DB transaction)
- [ ] 4.6 Server: input validation with Zod for all transaction routes
- [ ] 4.7 Client: "Add Transaction" page/modal — amount, type (income/expense/transfer), account, category, date, note
- [ ] 4.8 Client: Transaction history page — list with filter controls (date range, account, category)
- [ ] 4.9 Client: edit and delete transaction actions
- [ ] 4.10 Client: transfer form (from account → to account)
- [ ] 4.11 Client: show running balance per account after each transaction

**Result**: Full transaction flow working. Users can track all income, expenses, and transfers.

---

## Phase 5 — Exchange Rates & Currency Conversion

> **Goal**: Convert all assets to EGP and show total net worth.

- [ ] 5.1 Server: create exchange rate service — fetch from external API (USD→EGP, EUR→EGP, etc.)
- [ ] 5.2 Server: create gold price service — fetch gold gram price in EGP
- [ ] 5.3 Server: store fetched rates in `exchange_rates` table
- [ ] 5.4 Server: set up node-cron job to refresh rates every 4 hours
- [ ] 5.5 Server: `GET /api/rates` — return current cached rates
- [ ] 5.6 Server: `POST /api/rates/refresh` — manual rate refresh
- [ ] 5.7 Server: `GET /api/dashboard/net-worth` — calculate total across all accounts in EGP
- [ ] 5.8 Server: `GET /api/dashboard/balances` — all accounts with original + converted amounts
- [ ] 5.9 Client: display converted values next to original values on accounts page
- [ ] 5.10 Client: show total net worth prominently on dashboard

**Result**: Users see their total net worth in EGP, with live conversion of USD, EUR, and gold.

---

## Phase 6 — Dashboard & Summary

> **Goal**: A useful home page with balances, charts, and recent activity.

- [ ] 6.1 Server: `GET /api/dashboard/spending-chart` — monthly income vs expense data
- [ ] 6.2 Server: `GET /api/dashboard/income-vs-expense` — totals by time period
- [ ] 6.3 Server: `GET /api/transactions/summary` — spending by category
- [ ] 6.4 Client: Dashboard layout — net worth card, account balance cards, recent transactions
- [ ] 6.5 Client: install Recharts, build monthly spending bar chart
- [ ] 6.6 Client: build spending-by-category pie/donut chart
- [ ] 6.7 Client: build income vs expense trend line chart
- [ ] 6.8 Client: quick-add transaction button on dashboard
- [ ] 6.9 Client: "last updated" indicator for exchange rates

**Result**: Dashboard gives a full financial overview at a glance.

---

## Phase 7 — Categories Management

> **Goal**: Users can customize their transaction categories.

- [ ] 7.1 Server: `GET /api/categories` — system defaults + user custom categories
- [ ] 7.2 Server: `POST /api/categories` — create custom category
- [ ] 7.3 Server: `PATCH /api/categories/:id` — update (only user-owned)
- [ ] 7.4 Server: `DELETE /api/categories/:id` — delete (only user-owned, not in use)
- [ ] 7.5 Client: Categories page — list with icons and colors
- [ ] 7.6 Client: add/edit category form (name, type, icon, color picker)
- [ ] 7.7 Client: prevent deletion of categories that have transactions

**Result**: Users can organize transactions with personalized categories.

---

## Phase 8 — Reports & Analytics

> **Goal**: Detailed financial reports beyond the dashboard.

- [ ] 8.1 Client: Reports page with date range selector
- [ ] 8.2 Client: net worth over time chart (line chart)
- [ ] 8.3 Client: spending breakdown by category (detailed table + chart)
- [ ] 8.4 Client: monthly comparison (this month vs last month)
- [ ] 8.5 Client: income sources breakdown
- [ ] 8.6 Client: CSV export of transactions (filtered)

**Result**: Users can analyze their finances with detailed reports and export data.

---

## Phase 9 — UI Polish & UX

> **Goal**: Make the app feel complete and professional.

- [ ] 9.1 Responsive design — mobile-friendly layouts for all pages
- [ ] 9.2 Loading skeletons for all data-fetching states
- [ ] 9.3 Empty states with helpful messages ("No transactions yet — add your first one!")
- [ ] 9.4 Toast notifications for success/error actions
- [ ] 9.5 Confirm dialogs for destructive actions (delete account, delete transaction)
- [ ] 9.6 Form validation with inline error messages
- [ ] 9.7 Keyboard shortcuts (e.g., "N" to add new transaction)
- [ ] 9.8 Settings page (change name, email, base currency)
- [ ] 9.9 Dark mode toggle

**Result**: Polished, responsive app that feels great on desktop and mobile browsers.

---

## Phase 10 — Advanced Features (Optional)

> **Goal**: Power-user features for long-term use.

- [ ] 10.1 Recurring transactions (auto-create monthly salary, subscriptions)
- [ ] 10.2 Budget goals per category (set limit, show progress bar)
- [ ] 10.3 Notifications when approaching budget limit
- [ ] 10.4 Multi-currency base (switch between EGP, USD, EUR as display currency)
- [ ] 10.5 PDF export for monthly reports
- [ ] 10.6 PWA setup (manifest, service worker, installable on mobile)
- [ ] 10.7 Capacitor/React Native wrapper for native mobile app

**Result**: Full-featured personal finance app ready for daily use.

---

# 9. Environment Variables

### Server (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/money_tracker
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
EXCHANGE_RATE_API_KEY=your-api-key
GOLD_API_KEY=your-api-key
PORT=3001
```

### Client (.env)

```
VITE_API_URL=http://localhost:3001/api
```

How to run
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev
