# Quickstart: Project Setup & Foundation

**Feature**: 001-project-setup-foundation

## Prerequisites

- Node.js v18 or higher
- npm (comes with Node.js)
- A code editor (VS Code recommended)

## Getting Started

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd MoneyTrackerNew
```

### 2. Start the backend server

```bash
cd server
npm install
cp .env.example .env    # then edit .env if needed
npm run dev
```

Server starts at `http://localhost:3001`. Verify with:

```bash
curl http://localhost:3001/api/health
# Returns: {"status":"ok","timestamp":"..."}
```

### 3. Start the frontend app

Open a new terminal:

```bash
cd client
npm install
cp .env.example .env    # then edit .env if needed
npm run dev
```

App opens at `http://localhost:5173`.

## Available Pages

| Route               | Page              |
| ------------------- | ----------------- |
| `/`                 | Dashboard         |
| `/login`            | Login             |
| `/register`         | Register          |
| `/transactions`     | Transactions      |
| `/transactions/new` | New Transaction   |
| `/accounts`         | Accounts          |
| `/categories`       | Categories        |
| `/reports`          | Reports           |
| `/settings`         | Settings          |

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description         |
| -------- | ------- | ------------------- |
| `PORT`   | `3001`  | Server listen port  |

### Client (`client/.env`)

| Variable       | Default                    | Description     |
| -------------- | -------------------------- | --------------- |
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API URL |

## Development Notes

- Both server and client have hot-reload enabled — file changes auto-refresh
- The server and client are started independently (no unified command)
- No database is needed for this phase — data persistence comes in Phase 2
