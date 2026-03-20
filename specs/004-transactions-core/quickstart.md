# Quickstart: Transactions (Core Feature)

**Feature**: 004-transactions-core

## Prerequisites

- Phase 3 (Accounts Management) complete -- users can create accounts
- PostgreSQL running (via `docker-compose up -d`)
- Server dependencies installed (`cd server && npm install`)
- Client dependencies installed (`cd client && npm install`)
- Database migrated and seeded (`cd server && npx prisma migrate dev && npx prisma db seed`)
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
├── routes/transaction.routes.ts      # Express router with CRUD + list endpoints
├── routes/transaction.schemas.ts     # Zod validation schemas
├── controllers/transaction.controller.ts  # Request handlers
└── services/transaction.service.ts   # Business logic (Prisma queries + balance updates)
```

### Client
```
client/src/
├── pages/TransactionsPage.tsx            # Transaction history with filters
├── components/transactions/
│   ├── TransactionList.tsx               # Paginated transaction list
│   ├── TransactionItem.tsx               # Single transaction row/card
│   ├── TransactionFormModal.tsx          # Create/edit transaction modal
│   ├── TransactionFilters.tsx            # Filter controls (date, account, category, type)
│   └── DeleteTransactionDialog.tsx       # Confirmation dialog
├── services/api.ts                       # UPDATE: add transactionsApi + categoriesApi
└── types/transaction.ts                  # Transaction TypeScript types
```

## Existing Files to Modify

| File | Change |
|------|--------|
| `server/src/index.ts` | Register transaction routes + category list route |
| `client/src/services/api.ts` | Add transactionsApi and categoriesApi objects |
| `client/src/App.tsx` | Add /transactions route |

## Patterns to Follow

- **Server**: See `account.routes.ts` -> `account.controller.ts` -> `account.service.ts` for the established pattern
- **Validation**: See `account.schemas.ts` for Zod schema pattern with `validateMiddleware`
- **Client API**: See `accountsApi` in `services/api.ts` for the `apiFetch` wrapper pattern
- **Auth protection**: All server routes use `authMiddleware`; access `req.userId` for ownership
- **Balance atomicity**: Use `prisma.$transaction()` for all balance-changing operations
- **BigInt handling**: Convert to string in service layer before returning (same as accounts)

## Testing the Feature

```bash
# 1. Login to get a token (assuming user exists from Phase 2/3 testing)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' | jq -r '.token')

# 2. Create an account (if not already created)
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Cash EGP","type":"cash","currency":"EGP"}'

# 3. Get account ID
ACCOUNT_ID=$(curl -s http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN" | jq -r '.accounts[0].id')

# 4. Create an income transaction (5000.00 EGP = 500000 piasters)
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"income\",\"amount\":500000,\"date\":\"2026-03-20\",\"note\":\"Salary\"}"

# 5. Create an expense transaction (150.00 EGP = 15000 piasters)
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"expense\",\"amount\":15000,\"date\":\"2026-03-20\",\"note\":\"Lunch\"}"

# 6. List transactions
curl "http://localhost:3001/api/transactions?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# 7. Verify account balance updated (should be 485000 = 4850.00 EGP)
curl http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN"

# 8. Test transfer (create a second account first)
curl -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"NBE Bank","type":"bank","currency":"EGP"}'

ACCOUNT2_ID=$(curl -s http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN" | jq -r '.accounts[1].id')

curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"transfer\",\"amount\":100000,\"transferToId\":\"$ACCOUNT2_ID\",\"date\":\"2026-03-20\",\"note\":\"Deposit\"}"

# 9. Verify both account balances
curl http://localhost:3001/api/accounts \
  -H "Authorization: Bearer $TOKEN"
```
