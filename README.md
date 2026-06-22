# WANI — WhatsApp AI Native Integration

A three-part system that connects a WhatsApp bot, a REST API, and a React dashboard into a single platform. The WhatsApp bot (powered by [Baileys](https://github.com/WhiskeySockets/Baileys)) handles real-time messaging and authentication; the API server (Express 5, Prisma 7) relays connection state — QR codes, status, phone number — to the outside world; and the dashboard (React 19, Vite 8) provides the user interface. All three are independent Bun packages sharing a PostgreSQL backend, though each writes to its own database.

## Architecture

```
┌──────────────┐     HTTP (future)     ┌──────────────┐
│  Dashboard   │ ◄──────────────────►  │  API Server  │
│  React 19    │     port 5173         │  Express 5   │
│  Vite 8      │                       │  port 3001   │
└──────────────┘                       └──────┬───────┘
                                              │ Bearer auth
                                              │ POST/DELETE /api/qr
                                              │ GET /api/qr/status
                                      ┌──────▼───────┐
                                      │   WA Bot     │
                                      │  Baileys 6   │
                                      │  Prisma 7    │
                                      └──────────────┘
```

The data flows in one direction for now: the bot pushes QR codes and status updates to the API during WhatsApp Web authentication, and the dashboard (once integrated) will poll the same endpoints to display connection state. Each service is independently runnable and deployable.

## Prerequisites

- **Bun 1.3+** — the JavaScript runtime used across all three projects
- **PostgreSQL 16+** — two databases on the same server

## Project Structure

```
WANI/
├── api/           Express 5 + Prisma 7 — REST server, QR relay, connection status
├── dashboard/     React 19 + Vite 8 — frontend UI (under active development)
├── web-gen/       Bun + Astro 6.4 — static site generator for UMKM websites
├── wa-bot/        Baileys 6 + Prisma 7 — WhatsApp bot, persistent auth, reconnect
└── erd.excalidraw Planned data model reference (13 entities, not final)
```

- **`api/`** — The central hub. Express 5 with helmet, cors, morgan (Winston-backed), and Zod validation. Uses a model layer built on Prisma delegates (`BaseModel` abstract class) for consistent CRUD. Endpoints for QR relay and session status are authenticated with a shared `API_TOKEN`.
- **`dashboard/`** — A Vite 8 + React 19 setup with React Compiler enabled via the Babel plugin. TypeScript 6, ESLint 10 flat config, and Rolldown (not esbuild) under the hood. Currently a scaffold; API integration is the next step.
- **`wa-bot/`** — A Baileys 6 WhatsApp Web client with persistent authentication via Prisma 7. Auth credentials and signal protocol keys are stored in PostgreSQL. QR codes are both printed to the terminal and pushed to the API. Auto-reconnects on connection loss (unless logged out).
- **`web-gen/`** — A static site generator that produces multi-page HTML/CSS/JS websites from Store, Product, and Order data. Uses Astro 6.4 templates with Tailwind CSS v4. Output includes WhatsApp-integrated product cards for click-to-order. Can generate ZIP archives for download.

## Getting Started

### 1. Clone and install

Each subproject has its own `bun.lock` — install them separately:

```bash
cd api && bun install
cd ../dashboard && bun install
cd ../web-gen && bun install
cd ../wa-bot && bun install
```

### 2. Create the databases

Two separate PostgreSQL databases, both on the same server:

| Database | Used by | Purpose |
|----------|---------|---------|
| `wani_api` | API server | QR session state, connection status |
| `wa_bot` | WA Bot | Auth credentials, signal protocol keys |

```bash
createdb -U postgres wani_api
createdb -U postgres wa_bot
```

### 3. Configure environment variables

Each subproject has a `.env.example` — copy to `.env` and fill in the values.

**`api/.env`**

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `postgres` | PostgreSQL user |
| `DATABASE_PASSWORD` | — | PostgreSQL password |
| `DATABASE_NAME` | `wani_api` | Target database |
| `PORT` | `3001` | API server port |
| `API_TOKEN` | — | Shared secret for bot→API auth |

**`wa-bot/.env`**

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `postgres` | PostgreSQL user |
| `DATABASE_PASSWORD` | — | PostgreSQL password |
| `DATABASE_NAME` | `wa_bot` | Target database |
| `API_URL` | `http://localhost:3001` | Where the API lives |
| `API_TOKEN` | — | Must match the API's `API_TOKEN` |

**`dashboard/.env`** — None needed yet (no API proxy configured).

### 4. Run database migrations

```bash
cd api   && bunx --bun prisma migrate dev
cd wa-bot && bunx --bun prisma migrate dev
```

### 5. Start services (order matters)

The API must be running before the bot starts — the bot pushes QR codes and status updates to the API on connection.

```bash
# Terminal 1 — API server
cd api && bun run src/index.ts
# → Listening on http://localhost:3001
```

```bash
# Terminal 2 — WhatsApp bot (starts after API is up)
cd wa-bot && bun run src/index.ts
# → QR code in terminal, relayed to API
```

```bash
# Terminal 3 — Dashboard (independent, anytime)
cd dashboard && bun run dev
# → http://localhost:5173
```

```bash
# Terminal 4 — Web-Gen (standalone, for testing)
cd web-gen && bun run src/generator.ts --slug test --template default --data ./test-data.json
```

## Subproject details

### API server (`api/`)

Express 5 with a layered architecture: routes → controllers → models → Prisma delegate → database. Unifies all responses into `{ status, message, data }` JSON envelopes and uses custom `AppError` subclasses for clean error handling.

Key design decisions:
- **BaseModel delegate pattern** — each model declares a Prisma delegate, inheriting `getAll`, `getById`, `create`, `update`, `delete` without boilerplate. Type-safe via generics.
- **Zod v4 validation middleware** — passes `body`/`query`/`params` through `safeParseAsync`, returning a 400 with field-level error details on failure.
- **Winston logging** — morgan output is piped into a Winston JSON logger. Stack traces only appear in non-production environments.
- **Graceful shutdown** — catches `SIGINT`/`SIGTERM`, closes the HTTP server, disconnects Prisma.

Quick reference:

| | |
|---|---|
| Run | `bun run src/index.ts` |
| Prisma generate | `bun run prisma:generate` |
| Prisma migrate | `bun run prisma:migrate` |
| Prisma deploy | `bun run prisma:deploy` |
| Path aliases | `@prisma/*` → generated client, `@/*` → project root |

### Dashboard (`dashboard/`)

React 19 with Vite 8 and TypeScript 6. Uses the React Compiler Babel plugin (`reactCompilerPreset`) for automatic memoization. ESLint 10 with flat config (no `.eslintrc*`). Build pipeline runs `tsc -b` (project references) then `vite build` via Rolldown.

| | |
|---|---|
| Dev server | `bun run dev` (HMR on port 5173) |
| Build | `bun run build` (`tsc -b && vite build`) |
| Lint | `bun run lint` |
| Preview | `bun run preview` |
| Conventions | `verbatimModuleSyntax`, `erasableSyntaxOnly`, no enums |

### WhatsApp bot (`wa-bot/`)

Baileys 6 WhatsApp Web client with PostgreSQL-backed persistent authentication. On start, loads or creates `AuthenticationCreds` from the `Creds` table and implements the Baileys `SignalKeyStore` interface against the `SignalKey` table.

How it works:
1. **Startup** — loads auth state. If first run, generates a new QR code.
2. **QR relay** — QR code is printed in the terminal AND pushed to `POST /api/qr` on the API.
3. **Connection** — on success, clears the QR via `DELETE /api/qr` and updates the status on the API.
4. **Reconnect** — on connection loss (unless explicitly logged out), automatically calls `main()` to reconnect.
5. **Echo** — replies to any incoming text message with `echo: <text>` (placeholder handler).

| | |
|---|---|
| Run | `bun run src/index.ts` |
| Prisma generate | `bun run prisma:generate` |
| Prisma migrate | `bun run prisma:migrate` |
| Prisma deploy | `bun run prisma:deploy` |
| Path aliases | `@prisma/*` → generated client, `@/*` → project root |

### Web-Gen (`web-gen/`)

Static site generator for UMKM websites. Reads Store, Product, and Order data via API (Prisma or REST), renders Astro templates, and outputs static HTML/CSS/JS ready for deployment.

How it works:
1. **Generate** — data diformat ke JSON, di-inject ke template Astro, lalu `astro build` menghasilkan static files.
2. **Preview** — hasil generate bisa dilihat via server statis lokal atau di-download sebagai ZIP.
3. **Publish** — output folder siap di-copy ke Vercel, Netlify, atau static host lainnya.
4. **WhatsApp** — setiap produk menyertakan tombol "Pesan via WhatsApp" yang otomatis mengisi nomor toko dan template pesanan.

| | |
|---|---|
| Install | `bun install` |
| Generate (CLI test) | `bun run src/generator.ts` |
| Type check | `bun run tsc --noEmit` |
| Template build | `bun run build:template` |

## API reference

All endpoints return a unified JSON envelope:

```json
{ "status": "success", "message": "...", "data": null | {} | [] }
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/qr` | — | Get the current QR code string |
| `GET` | `/api/qr/status` | — | Get connection status and phone number |
| `POST` | `/api/qr` | Bearer `<API_TOKEN>` | Push a QR code or update status |
| `DELETE` | `/api/qr` | Bearer `<API_TOKEN>` | Clear QR on successful connection |

Error responses use `AppError` subclasses:

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `BadRequestError` | Zod validation failure (field-level details in `data`) |
| `401` | `UnauthorizedError` | Missing or invalid `Authorization` header |
| `404` | `NotFoundError` | No session found |
| `500` | `InternalServerError` | Unexpected error (stack trace only in development) |

## Database

Two independent PostgreSQL databases on the same server, each managed by its own Prisma schema.

| Database | Tables | Managed by |
|----------|--------|------------|
| `wani_api` | `WaSession` | `api/prisma/` |
| `wa_bot` | `Creds`, `SignalKey` | `wa-bot/prisma/` |

Both use Prisma ORM 7 with the `prisma-client` generator and `@prisma/adapter-pg` driver adapter. Migrations are committed and applied with `prisma migrate deploy` in production. Generated client output lives in each project's `generated/prisma/` directory (gitignored).

## Data model

| Entity | Database | Fields | Notes |
|--------|----------|--------|-------|
| `WaSession` | `wani_api` | `id` (default), `status`, `phone?`, `qr?`, `updatedAt` | Single-row table, always upserted as `id: "default"` |
| `Creds` | `wa_bot` | `id` (pk), `data` (text) | Serialized `AuthenticationCreds` JSON |
| `SignalKey` | `wa_bot` | `type` + `id` (composite pk), `data` (text) | Baileys signal protocol key storage |

The planned data model (13 entities covering MERCHANT, CUSTOMER, CATEGORY, PRODUCT, ORDER, ORDER_ITEM, PAYMENT, CONVERSATION, MESSAGE, WA_SESSION, AI_AGENT, SETTING, ACTIVITY_LOG) is documented in `erd.excalidraw` and will be implemented as the project expands.

## Commands reference

| Action | API | Dashboard | Web-Gen | WA Bot |
|--------|-----|-----------|---------|--------|
| Install | `bun install` | `bun install` | `bun install` | `bun install` |
| Run | `bun run src/index.ts` | `bun run dev` | `bun run src/generator.ts` | `bun run src/index.ts` |
| Build | — | `bun run build` | `bun run build:template` | — |
| Type check | — | — | `bun run tsc --noEmit` | — |
| Lint | — | `bun run lint` | — | — |
| Preview | — | `bun run preview` | — | — |
| Prisma generate | `bun run prisma:generate` | — | — | `bun run prisma:generate` |
| Prisma migrate | `bun run prisma:migrate` | — | — | `bun run prisma:migrate` |
| Prisma deploy | `bun run prisma:deploy` | — | — | `bun run prisma:deploy` |
