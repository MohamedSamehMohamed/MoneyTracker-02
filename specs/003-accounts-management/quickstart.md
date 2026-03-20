# Quickstart: Accounts Management

**Feature**: 003-accounts-management

## Prerequisites

- PostgreSQL running (via `docker-compose up -d`)
- Server dependencies installed (`cd server && npm install`)
- Client dependencies installed (`cd client && npm install`)
- Database migrated (`cd server && npx prisma migrate dev`)
- `.env` configured in server/

## Development

### Run backend
```bash
cd server
npm run dev
# Server starts on http://localhost:3001
```

### Run frontend
```bash
cd client
npm run dev
# Client starts on http://localhost:5173
```

## New Files to Create

### Server
```
server/src/
├── routes/account.routes.ts      # Express router with CRUD endpoints
├── routes/account.schemas.ts     # Zod validation schemas
├── controllers/account.controller.ts  # Request handlers
└── services/account.service.ts   # Business logic (Prisma queries)
```

### Client
```
client/src/
├── pages/AccountsPage.tsx        # UPDATE existing placeholder
├── components/accounts/
│   ├── AccountList.tsx            # Accounts grid/list display
│   ├── AccountCard.tsx            # Individual account card
│   ├── AccountFormModal.tsx       # Create/edit account modal
│   └── DeleteAccountDialog.tsx    # Confirmation dialog
├── services/api.ts               # UPDATE: add accountsApi
└── types/account.ts              # Account TypeScript types
```

## Existing Files to Modify

| File | Change |
|------|--------|
| `server/src/index.ts` | Register account routes |
| `client/src/services/api.ts` | Add accountsApi object |
| `client/src/pages/AccountsPage.tsx` | Replace placeholder with full implementation |

## Patterns to Follow

- **Server**: See `auth.routes.ts` -> `auth.controller.ts` -> `auth.service.ts` for the established pattern
- **Validation**: See `auth.schemas.ts` for Zod schema pattern with `validateMiddleware`
- **Client API**: See `authApi` in `services/api.ts` for the `apiFetch` wrapper pattern
- **Auth protection**: All server routes use `authMiddleware`; access `req.userId` for ownership

## Testing the Feature

```bash
# 1. Register/login to get a token
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'

# 2. Create an account (use token from step 1)
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Cash EGP","type":"cash","currency":"EGP"}'

# 3. List accounts
curl http://localhost:3001/api/accounts \
  -H "Authorization: Bearer <token>"
```
