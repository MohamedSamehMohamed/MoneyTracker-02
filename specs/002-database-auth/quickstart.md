# Quickstart: Database & Authentication

**Feature**: 002-database-auth

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or connection string to remote instance)
- Phase 1 complete (server and client apps running)

## Setup Steps

### 1. Database Setup

```bash
# Ensure PostgreSQL is running and create the database
createdb money_tracker

# Update server/.env with your connection string
DATABASE_URL=postgresql://user:password@localhost:5432/money_tracker
JWT_SECRET=your-secure-random-secret-key-here
JWT_EXPIRES_IN=7d
```

### 2. Install New Server Dependencies

```bash
cd server
npm install prisma @prisma/client bcryptjs jsonwebtoken zod
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 3. Initialize Prisma

```bash
cd server
npx prisma init
# Edit prisma/schema.prisma with the data model
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Install New Client Dependencies

```bash
cd client
npm install react-hook-form @hookform/resolvers zod
```

### 5. Verify

```bash
# Terminal 1 - Server
cd server && npm run dev
# Should show: Server started on http://localhost:3001

# Terminal 2 - Client
cd client && npm run dev
# Should show: Vite dev server running

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
# Should return: { user: {...}, token: "..." }

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Should return: { user: {...}, token: "..." }

# Test protected route
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token-from-above>"
# Should return: { user: {...} }
```

## Integration Scenarios

### Scenario 1: New User Onboarding
1. Navigate to `/register`
2. Fill in name, email, password
3. Submit form
4. Verify redirect to `/dashboard`
5. Refresh page — should remain authenticated

### Scenario 2: Returning User Login
1. Navigate to `/login`
2. Enter registered email and password
3. Submit form
4. Verify redirect to `/dashboard`

### Scenario 3: Protected Route Guard
1. Clear localStorage (or use incognito)
2. Navigate to `/dashboard`
3. Verify redirect to `/login`
4. Log in
5. Verify redirect back to `/dashboard`

### Scenario 4: Invalid Credentials
1. Navigate to `/login`
2. Enter wrong password
3. Verify error message: "Invalid email or password"
4. Verify no token stored in localStorage
