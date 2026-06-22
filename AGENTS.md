# WANI — agent guidance

Three independent Bun packages (not a monorepo). Each has its own `bun.lock` and `tsconfig.json`.

- **`api/`** — Express 5 + Prisma 7 — REST server with layered architecture (routes → controllers → models → Prisma delegate)
- **`dashboard/`** — React 19 + TypeScript 6 + Vite 8 (Rolldown, not esbuild) — frontend UI
- **`wa-bot/`** — Baileys 6 + Prisma 7 — WhatsApp bot with persistent auth, auto-reconnect

## Architecture

```
Bot pushes QR/status → API stores in WaSession DB → Dashboard polls GET /api/qr
```

- **api/src/index.ts** — Express 5 entrypoint (helmet, cors, morgan→Winston, json parser), graceful shutdown
- **api/src/server.ts** — Express app factory with middleware chain + 404 handler + error handler
- **api/src/routes/** — Router modules, combined under `/api` in `routes/index.ts`
- **api/src/controllers/** — Request handlers using `sendResponse()` unified JSON format
- **api/src/models/** — `BaseModel<T>` abstract class with Prisma delegate pattern (getAll/getById/create/update/delete)
- **api/src/schemas/** — Zod v4 schemas (upsertQrSchema, etc.)
- **api/src/middleware/** — `requireAuth` (Bearer API_TOKEN), `validate` (safeParseAsync), `errorHandler` (AppError-aware)
- **api/src/utils/** — `AppError` subclasses (BadRequest/Unauthorized/Forbidden/NotFound/InternalServer), `sendResponse()`
- **api/src/config/** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`), Winston logger
- **api/src/ai/** — Orchestrated pipeline: `processMessage()` in `pipeline.ts`, intent action handlers in `actions.ts`, circuit breaker, OpenRouter LLM engine with retry+fallback, intent-based output schemas (order/inquiry/greeting/complaint/unknown/escalate), hardened system prompt builder with canary
- **api/src/guardrails/** — Per-customer sliding-window rate limit, prompt-injection detection (EN+ID patterns), LLM daily budget tracker, output sanitizer + leak detector; all wired into pipeline
- **dashboard/vite.config.ts** — `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset`, Tailwind v4, **proxies `/api` → `http://localhost:3001`**
- **dashboard/src/index.css** — `@import "tailwindcss"` (Tailwind v4 CSS-first config, no `tailwind.config.*`)
- **dashboard/src/hooks/** — All hooks use `MOCK = true` toggle — no real API calls until toggled off
- **wa-bot/src/index.ts** — Baileys `makeWASocket`, QR terminal print + API POST, auto-reconnect, **forwards messages to API's POST /api/chat** and sends the AI reply back
- **wa-bot/src/config/db.ts** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`)
- **wa-bot/src/services/whatsapp-auth.ts** — `usePrismaAuthState()` implementing `SignalKeyStore` (Creds + SignalKey tables)

## Commands

**API** (`api/`):
- `bun run src/index.ts` — start Express server (port 3001)
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:deploy` — apply production migrations
- `bun test` — run unit + guardrail tests (Bun's built-in `bun:test`)

**Dashboard** (`dashboard/`):
- `bun run dev` — Vite dev server (HMR, port 5173)
- `bun run build` — `tsc -b` (project references) then `vite build`
- `bun run lint` — `eslint .` (flat config)
- `bun run preview` — `vite preview`

**WA Bot** (`wa-bot/`):
- `bun run src/index.ts` — start WhatsApp bot
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:deploy` — apply production migrations

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/qr` | — | Get current QR code string |
| `GET` | `/api/qr/status` | — | Get connection status + phone number |
| `POST` | `/api/qr` | Bearer API_TOKEN | Push QR code / update status (Zod validated) |
| `DELETE` | `/api/qr` | Bearer API_TOKEN | Clear QR on successful connection |
| `POST` | `/api/chat` | Bearer API_TOKEN | Process message through AI pipeline → reply |
| `GET` | `/api/store` | — | Get store profile |
| `PUT` | `/api/store` | Bearer API_TOKEN | Update store profile |
| `GET` | `/api/ai-config` | — | Get AI config |
| `PUT` | `/api/ai-config` | Bearer API_TOKEN | Update AI config (model, prompt, etc.) |

Unified response: `{ status: "success"|"failure", message, data? }`

Error classes: BadRequestError (400), UnauthorizedError (401), NotFoundError (404), InternalServerError (500)

> `dashboard/API_SPEC.md` has the full planned API (Products, Orders, Customers, Settings, etc.) — Products, Orders, Customers endpoints are not yet implemented server-side.

## Dashboard

- **5 pages implemented**: Dashboard, Products (+ProductForm), Orders (+OrderDetail), Customers (dual-panel inline chat), Settings (Store + AI + WA tabs)
- **All hooks mock-only**: `useProducts.ts`, `useOrders.ts`, `useCustomers.ts`, `useSettings.ts`, `useWaStatus.ts` each toggle `MOCK = true` — flip to `false` when API endpoints exist
- **UI primitives** in `components/ui/` (Button, Card, Badge, Table, Modal, Input, Select, Spinner, EmptyState, Pagination) — no external component library
- **Layout**: `Layout.tsx` shell with `Sidebar.tsx` + `Topbar.tsx` + `<Outlet />`, `BottomNav.tsx` for mobile
- **Routing**: React Router v8 `createBrowserRouter` in `App.tsx`

## Quirks

- `verbatimModuleSyntax` is on everywhere — use `import type` for type-only imports
- `api/` and `wa-bot/` use `module: "Preserve"`, `allowImportingTsExtensions`, `noEmit: true` (Bun runtime, no tsc emit)
- API + wa-bot path aliases: `@db/*` → `./generated/prisma/*`, `@/*` → `./*`
- Dashboard has TypeScript project references: `tsconfig.app.json` (src/) + `tsconfig.node.json` (vite.config.ts)
- ESLint 10 flat config with `eslint/config` module — not `.eslintrc*`
- `erasableSyntaxOnly` in dashboard tsconfig — no enums, no namespaces, no `constructor` parameter properties
- `tsc -b` before vite build ensures type errors block the build
- Prisma schemas split across `prisma/models/*.prisma` (not a single schema.prisma), output to `generated/prisma/` (gitignored)
- Prisma uses `prisma.config.ts` (not `prisma/schema.prisma` as config) with Prisma 7's `defineConfig` — migrations path set there
- Tests use Bun's built-in `bun:test` runner (`bun test`)
- WaSession is single-row (`id: "default"`), always upserted
- Bot expects API to be running first (POSTs QR on `connection.update`)
- Both databases on same PG server: `wani_api` (api) + `wa_bot` (bot)
- `import.meta.env.PROD == null` check in `api/src/config/db.ts` — this is always true under Bun; the global Prisma cache works in both dev and prod

## Stack Stability

- **Never downgrade packages.** Jika error/bug muncul, cari solusi via searching (docs, Stack Overflow, GitHub issues) — jangan turunkan versi dependency.
- **Research first.** Sebelum menurunkan versi atau mengganti package, cari dulu apakah ada konfigurasi / flag / workaround untuk versi saat ini.
- **Gunakan latest stable.** Semua dependency harus latest stable version dari npm registry resmi.

## AI / ML Pipeline

**Now wired end-to-end.** Bot forwards messages to POST /api/chat → processMessage() → guardrails → LLM → intent handler → reply back to WA.

### Pipeline

```
incoming WA msg → normalizeInput() → detectInjection() → checkRateLimit()
→ isBudgetExceeded() → buildSystemPrompt() + wrapCustomerMessage()
→ complete() via OpenRouter → sanitizeReply() → hasLeak() → reply
```

### Files

| File | Role |
|------|------|
| `ai/engine.ts` | `complete()` — OpenRouter chat completion with retry (2×), exponential backoff, fallback model on failure, 30s AbortController timeout |
| `ai/engine.ts` | `chat()` — convenience wrapper: system prompt + single user message |
| `ai/prompts.ts` | `buildSystemPrompt(store, products, ...)` — assembles system prompt with store info, product catalog, security rules, strict JSON-only output requirement, canary token `PROMPT_CANARY` + customer message delimiters `<customer_message>` / `</customer_message>` |
| `ai/schemas.ts` | Zod discriminated union `LLMOutputSchema` — validates LLM JSON output into 6 intents: `order` / `inquiry` / `greeting` / `complaint` / `unknown` / `escalate` |
| `ai/types.ts` | `LLMOutput` union type, `ChatMessage`, `CompletionOptions`, `TokenUsage`, `CompletionResult` |
| `guardrails/input.ts` | `normalizeInput()` strips control/zero-width chars, caps at `MAX_INPUT_CHARS`; `detectInjection()` regex-based EN+ID prompt injection heuristics |
| `guardrails/ratelimit.ts` | Per-customer in-memory sliding window (short + long) — single-process, resets on restart |
| `guardrails/budget.ts` | `isBudgetExceeded()` / `recordLlmUsage()` — daily LLM call budget via `UsageCounter` table |
| `guardrails/output.ts` | `sanitizeReply()` strips code fences, caps at `MAX_REPLY_CHARS`; `hasLeak()` checks for canary + system prompt keywords |

### Model config

- **`AiConfig` table** (single-row `id: "default"`) — stores `model`, `systemPrompt`, `temperature`, `maxTokens`, `greetingMessage`, `knowledgeBase`, `isActive`
- **`.env` env vars** (`LLM_MODEL`, `LLM_TEMPERATURE`, etc.) are fallback defaults — the DB row takes precedence at runtime
- **Guardrail env vars**: `RATE_LIMIT_*`, `MAX_INPUT_CHARS`, `MAX_REPLY_CHARS`, `DAILY_LLM_BUDGET`
- **OpenRouter** is the provider (`OPENROUTER_API_KEY` env var), not direct OpenAI. Model IDs are OpenRouter slugs (e.g. `opencode/deepseek-v4-flash-free`)

### Database tables used by AI

| Table | Purpose |
|-------|---------|
| `AiConfig` | LLM model, prompt, temperature, budget config |
| `Store` | Business name, address, hours, payment/shipping/return policy — injected into system prompt |
| `Product` / `Category` | Product catalog — formatted into system prompt |
| `UsageCounter` | Daily LLM call & token counters |
| `ActivityLog` | Audit trail for AI actions |

### What's missing

- No embeddings / vector store / RAG (the `knowledgeBase` field is plain text)
- No evaluation harness, no tests

## Referensi Dokumen

- **`dashboard/ARCHITECTURE.md`** — Component tree, routing, design system (warm teal+amber palette), data flow, page spec, mock strategy
- **`dashboard/API_SPEC.md`** — Full API contract spec for all 5 pages, request/response shapes, error codes
