# Development

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start database
pnpm docker:dev:db

# 3. Generate Prisma client & push schema
pnpm db:generate
pnpm db:push

# 4. (Optional) Seed data
pnpm db:seed

# 5. Copy env
cp .env.example .env
# Edit .env — set OPENROUTER_API_KEY, JWT_SECRET, DATABASE_URL

# 6. Start dev servers (API :3001 + Web :3000)
pnpm dev
```

## Project Structure

```
WANI/
├── apps/
│   ├── api/          # Express backend
│   │   ├── src/
│   │   │   ├── ai/         # AI/LLM pipeline
│   │   │   ├── baileys/    # WhatsApp integration
│   │   │   ├── middleware/  # Auth, validation, error handling
│   │   │   ├── pipeline/   # Message processing pipeline
│   │   │   ├── routes/     # Express route handlers
│   │   │   ├── services/   # Business logic
│   │   │   ├── config/     # App config
│   │   │   ├── lib/        # Shared validation schemas
│   │   │   └── types/      # TypeScript types
│   │   └── tests/
│   │       ├── unit/       # 16 unit test files
│   │       └── integration/ # 1 integration test file
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/        # Next.js App Router pages
│           │   ├── (auth)/ # Login, register
│           │   ├── dashboard/ # Merchant dashboard
│           │   └── store/  # Public web store
│           ├── components/ # UI components
│           └── lib/        # API client, auth context, utils
├── packages/
│   └── database/    # Shared Prisma schema + client
└── docs/            # Documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API + Web in parallel |
| `pnpm test` | Run all tests |
| `pnpm build` | Build all packages |
| `pnpm lint` | TypeScript check |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed sample data |

## Testing

```bash
pnpm test              # All tests
pnpm --filter @wani/api test        # API tests only
pnpm --filter @wani/api test:watch  # Watch mode
```

## Docker Dev

```bash
pnpm docker:dev       # Start all services
pnpm docker:dev:build # Rebuild and start
pnpm docker:dev:down  # Stop
```
