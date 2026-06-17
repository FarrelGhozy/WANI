# WANI Architecture

## Overview

WANI (WA + Niaga) is an omnichannel platform for Indonesian UMKM. It combines a WhatsApp bot (via Baileys), an AI/LLM pipeline, a dashboard, and an auto-generated web store — all sharing one PostgreSQL database.

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   WA Customer   │────▶│  Baileys Engine  │────▶│ AI Pipeline  │
└─────────────────┘     └──────────────────┘     └──────┬───────┘
                                                         │
┌─────────────────┐                                      │
│  Web Store      │────▶ Prisma ◀───────────────────────┘
│  (Next.js SSR)  │         │
└─────────────────┘         │
                            ▼
┌─────────────────┐   ┌──────────┐
│  Dashboard      │──▶│ Express  │──▶ Prisma
│  (Next.js SPA)  │   │  API     │
└─────────────────┘   └──────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL 16 via Prisma ORM |
| Backend | Express.js + TypeScript |
| WhatsApp | @whiskeysockets/baileys (multi-device) |
| AI | OpenAI/Gemini-compatible API + Zod validation |
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Icons | lucide-react |
| Auth | JWT + bcryptjs + httpOnly cookies |
| Container | Docker Compose with hot reload |

## Project Structure

```
WANI/
├── apps/
│   ├── api/              # Express backend (port 3001)
│   │   ├── src/
│   │   │   ├── baileys/  # WhatsApp engine (connection, send)
│   │   │   ├── ai/       # AI/LLM pipeline (engine, prompts, schemas)
│   │   │   ├── pipeline/ # Message routing (router, intent, order, etc.)
│   │   │   ├── services/ # Business logic for all entities
│   │   │   ├── routes/   # Express route handlers
│   │   │   ├── middleware/ # Auth, validation, rate limiting
│   │   │   ├── config/   # Prisma, logger, env config
│   │   │   ├── lib/      # Validation schemas, helpers
│   │   │   └── types/    # Shared TypeScript types
│   │   ├── tests/        # Vitest + Supertest
│   │   └── scripts/      # CLI tools (static generator)
│   └── web/              # Next.js frontend (port 3000)
│       └── src/
│           ├── app/      # App Router pages
│           │   ├── (auth)/    # Login/register
│           │   ├── dashboard/ # Admin panel (sidebar layout)
│           │   └── store/     # Public web store
│           ├── components/ # Reusable UI components
│           └── lib/       # API client, auth context, helpers
└── packages/
    └── database/          # Shared Prisma schema + client
        ├── prisma/        # schema.prisma, migrations, seed
        └── src/           # Re-exported prisma client
```

## Data Flow

### WhatsApp Flow
1. Customer sends message via WhatsApp
2. Baileys receives message, emits event
3. Message pipeline classifies intent (order, inquiry, greeting, complaint)
4. AI generates response via LLM
5. Response sent back via Baileys
6. All data persisted via Prisma (conversations, orders, customers)

### Web Store Flow
1. Visitor navigates to `/store/[slug]`
2. Next.js Server Component fetches from Express API (internal)
3. Store rendered with theme CSS variables + template engine
4. Product orders flow through WhatsApp (wa.me link)

### Dashboard Flow
1. Merchant logs in via `/login`
2. Auth middleware sets JWT in httpOnly cookie
3. Dashboard pages use `useMerchant()` context for auth
4. Client components call Express API for CRUD operations
5. Server-side Prisma calls used where possible for data fetching

## API Routes

All routes mounted under `/api`:
- `routes/auth.routes.ts` — Login, register, logout
- `routes/merchant.routes.ts` — Profile management
- `routes/product.routes.ts` — Products CRUD
- `routes/category.routes.ts` — Categories CRUD
- `routes/order.routes.ts` — Orders management
- `routes/customer.routes.ts` — Customers list
- `routes/conversation.routes.ts` — Conversations
- `routes/ai-agent.routes.ts` — AI config
- `routes/web-store.routes.ts` — Store CRUD + public + templates
- `routes/wa-session.routes.ts` — WhatsApp connection
- `routes/dashboard.routes.ts` — Dashboard stats
- `routes/setting.routes.ts` — Key-value settings
- `routes/webhook.routes.ts` — Baileys webhook

## Error Handling

- All services return `ApiResponse` type (`success: true/false`)
- Express routes use async error handler middleware
- Input validation via Zod schemas in centralized `lib/validation.ts`
- AI pipeline has retry logic with fallback models
