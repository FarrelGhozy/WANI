# WANI — agent guidance

Four independent Bun packages (not a monorepo). Each has its own `bun.lock` and `tsconfig.json`.

- **`api/`** — Express 5 + Prisma 7 — REST server with layered architecture (routes → controllers → models → Prisma delegate)
- **`dashboard/`** — React 19 + TypeScript 6 + Vite 8 (Rolldown, not esbuild) — frontend UI
- **`web-gen/`** — Bun + Astro 7 — static site generator for UMKM websites
- **`wa-bot/`** — Baileys 7 RC (`baileys` unscoped) + Prisma 7 — WhatsApp bot with persistent auth, auto-reconnect

## Architecture

```
BotManager polls active tenants → spawns BotInstance per owner → each instance pushes QR/status to API (scoped by ownerId) → Dashboard polls GET /api/qr (JWT-scoped)
```

- **api/src/index.ts** — Express 5 entrypoint (helmet, cors, morgan→Winston, json parser), graceful shutdown
- **api/src/server.ts** — Express app factory with middleware chain + 404 handler + error handler
- **api/src/routes/** — Router modules, combined under `/api` in `routes/index.ts`
- **api/src/controllers/** — Request handlers using `sendResponse()` unified JSON format
- **api/src/models/** — `BaseModel<T>` abstract class with Prisma delegate pattern (getAll/getById/create/update/delete)
- **api/src/schemas/** — Zod v4 schemas (upsertQrSchema, etc.)
- **api/src/middleware/** — `requireAuth` (Bearer API_TOKEN), `requireJwt` (JWT-based), `optionalJwt` (silent JWT parse, no error on missing), `validate` (safeParseAsync), `errorHandler` (AppError-aware)
- **api/src/utils/** — `AppError` subclasses (BadRequest/Unauthorized/Forbidden/NotFound/InternalServer), `sendResponse()`
- **api/src/config/** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`), Winston logger
- **api/src/services/email.ts** — Nodemailer SMTP transport for password reset emails
- **api/src/ai/** — Orchestrated pipeline: `processMessage()` in `pipeline.ts`, intent action handlers in `actions.ts`, circuit breaker, OpenRouter LLM engine with retry+fallback, intent-based output schemas (order/inquiry/greeting/complaint/unknown/escalate), hardened system prompt builder with canary
- **api/src/guardrails/** — Multi-layer defense: PII scanner/redactor, ML classifier (OpenRouter fast model), deep LLM-judge, output grounding check. Plus per-customer sliding-window rate limit, regex injection detection (EN+ID), daily LLM budget tracker, output sanitizer + leak detector. 3-tier injection defense (T1 regex → T2 classifier → T3 judge) with conditional slow path
- **dashboard/vite.config.ts** — `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset`, Tailwind v4, **proxies `/api` → `http://localhost:3001`**
- **dashboard/src/index.css** — `@import "tailwindcss"` (Tailwind v4 CSS-first config, no `tailwind.config.*`)
- **dashboard/src/hooks/** — Hooks use real API via `fetchApi()` (JWT auth from localStorage). `useWaStatus` and `useAuth` retain `MOCK = false` toggle for legacy compatibility.
- **wa-bot/src/index.ts** — Entrypoint, inits `BotManager`, graceful shutdown
- **wa-bot/src/manager.ts** — `BotManager` polls active tenants → spawns/removes `BotInstance` per ownerId
- **wa-bot/src/instance.ts** — `BotInstance` owns one Baileys `makeWASocket`, QR/pairing, auto-reconnect, **forwards messages to API's POST /api/chat** with ownerId, sends AI reply back
- **wa-bot/src/config/db.ts** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`)
- **wa-bot/src/services/whatsapp-auth.ts** — `usePrismaAuthState(ownerId)` implementing `SignalKeyStore` scoped by ownerId (Creds + SignalKey tables)

## Commands

**API** (`api/`):
- `bun run src/index.ts` — start Express server (port 3001)
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:migrate -- --name <nama>` — create named dev migration (wajib jalanin setiap ada perubahan schema!)
- `bun run prisma:deploy` — apply production migrations
- `bun run test` — run unit + guardrail tests (`bun run test:e2e` for integration tests)

**Dashboard** (`dashboard/`):
- `bun run dev` — Vite dev server (HMR, port 5173)
- `bun run build` — `tsc -b` (project references) then `vite build`
- `bun run lint` — `eslint .` (flat config)
- `bun run preview` — `vite preview`

**WA Bot** (`wa-bot/`):
- `bun run src/index.ts` — start WhatsApp bot
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:migrate -- --name <nama>` — create named dev migration (wajib jalanin setiap ada perubahan schema!)
- `bun run prisma:deploy` — apply production migrations

**Web-Gen** (`web-gen/`):
- `bun install` — install dependencies
- `bun run src/generator.ts` — test generate (CLI mode)
- `bun run build:template` — install dep + build template standalone
- `bun run tsc --noEmit` — type check

## API Endpoints

Semua endpoint **sudah diimplementasikan**. See `api/ARSITEKTUR.md` for the full table (~40 endpoints).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/upload` | 🔒 JWT | Upload file (QRIS image, etc.) |
| `GET` | `/api/qr` | 🔒 JWT | Get my QR code string |
| `GET` | `/api/qr/status` | 🔒 JWT | Get my connection status + phone number |
| `POST` | `/api/qr/bot` | Bearer API_TOKEN | Push QR/status (body: ownerId + data) |
| `DELETE` | `/api/qr/bot/:ownerId` | Bearer API_TOKEN | Clear QR on successful connection |
| `GET` | `/api/qr/active-tenants` | Bearer API_TOKEN | List ownerIds with active sessions |
| `POST` | `/api/chat` | Bearer API_TOKEN | Process message through AI pipeline → reply |
| `GET` | `/api/store` | — | Get store profile |
| `PUT` | `/api/store` | 🔒 JWT | Update store profile |
| `GET` | `/api/ai-config` | — | Get AI config |
| `PUT` | `/api/ai-config` | 🔒 JWT | Update AI config (model, prompt, etc.) |
| `GET` | `/api/products` | — | Product list (paginated, searchable) |
| `GET/POST/PUT/DELETE` | `/api/products/:id` | —/🔒 JWT | Product CRUD |
| `GET/POST` | `/api/products/categories` | —/🔒 JWT | Category list / create |
| `PUT/DELETE` | `/api/products/categories/:id` | 🔒 JWT | Category update / delete |
| `GET` | `/api/orders` | — | Order list (paginated, filterable) |
| `GET` | `/api/orders/:id` | — | Order detail |
| `PUT` | `/api/orders/:id/status` | 🔒 JWT | Update order status |
| `PUT` | `/api/orders/:id/notes` | 🔒 JWT | Update order notes |
| `PUT` | `/api/orders/:id/payment` | 🔒 JWT | Create / update payment |
| `GET` | `/api/customers` | — | Customer list |
| `GET/PUT` | `/api/customers/:id` | —/🔒 JWT | Customer detail / update |
| `GET` | `/api/conversations/:id` | — | Conversation messages |
| `PUT` | `/api/conversations/:id/status` | 🔒 JWT | Update conversation status |
| `POST` | `/api/conversations/:id/messages` | 🔒 JWT | Send HUMAN message |
| `GET` | `/api/dashboard/stats` | — | Aggregated dashboard stats |
| `GET` | `/api/logs` | — | Activity log (paginated) |
| `GET` | `/api/usage` | — | LLM usage counters (today) |
| `POST` | `/api/auth/register` | — | Register account |
| `POST` | `/api/auth/login` | — | Login (JWT token) |
| `GET` | `/api/auth/me` | — | Current user (token auto-verify) |
| `POST` | `/api/auth/logout` | — | Logout |
| `POST` | `/api/auth/forgot-password` | — | Generate reset token |
| `POST` | `/api/auth/reset-password` | — | Reset password |
| `GET` | `/api/website` | — | Get website config |
| `PUT` | `/api/website` | 🔒 JWT | Update website config |
| `POST` | `/api/website/generate` | 🔒 JWT | Generate static site |
| `GET` | `/api/website/download` | 🔒 JWT | Download ZIP |
| `POST` | `/api/website/publish` | 🔒 JWT | Mark as published |
| `GET` | `/s/:slug` | — | Serve generated static site |

> 🔒 = `requireAuth` (Bearer API_TOKEN), 🔒 JWT = `requireJwt` (JWT), — = public

Unified response: `{ status: "success"|"failure", message, data? }`

Error classes: BadRequestError (400), UnauthorizedError (401), ForbiddenError (403), NotFoundError (404), InternalServerError (500)

## Dashboard

- **11 pages implemented**: Dashboard, Products (+ProductForm), Orders (+OrderDetail), Customers (dual-panel inline chat), Settings (Store + AI + WA + Payment tabs), Website, LoginPage, SignUpPage, ForgotPasswordPage
- **Settings has 4 tabs**: Store, AI Agent, WA Session, Pembayaran
- **All hooks use real API**: `useProducts`, `useOrders`, `useCustomers`, `useSettings`, `usePaymentMethods`, `useWebsite` — no MOCK toggle, fetch via `fetchApi()`. `useWaStatus` and `useAuth` retain `MOCK = false` toggle for legacy compatibility.
- **UI primitives** in `components/ui/` (Button, Card, Badge, Table, Modal, Input, Select, Spinner, EmptyState, Pagination) — no external component library
- **Feature components**: StoreTab, AiTab, WaSessionTab, PaymentTab, CategoryModal, ProductListView, ProductCard, OrderListView, OrderTimeline, CustomerListView, ChatView
- **Layout**: `Layout.tsx` shell with `Sidebar.tsx` + `Topbar.tsx` + `<Outlet />`, `BottomNav.tsx` for mobile; `AuthLayout.tsx` for public pages
- **Routing**: React Router v8 `createBrowserRouter` in `App.tsx`, with `ProtectedRoute` gate

## Docker Compose

```bash
cp .env.example .env        # edit: isi POSTGRES_PASSWORD, API_TOKEN, JWT_SECRET
docker compose up --build   # build + start semua service
```

4 services: `db` (PostgreSQL 17), `api` (Express, port 3001), `dashboard` (Vite dev, port 5173), `wa-bot` (Baileys).

Database `wani_api` + `wa_bot` dibuat otomatis via `init-dbs.sh`.

## Type Casting Rules

- **No `as any` casts unless unavoidable.** Never cast with `as any` if a narrower alternative exists:
  - Express `Request` properties → use the augmented type declaration (`req.validatedQuery!`, `req.user`)
  - Prisma enum fields → use the generated type (`as $Enums.OrderStatus`, `as $Enums.PaymentMethod`)
  - Prisma JSON fields → `as Prisma.InputJsonValue`
  - Dynamic data objects → `as Record<string, unknown>`
  - Repeating patterns → add a static helper to `BaseModel` (`paginate()`, `listResult()`, typed `where()`)

## Path Aliases

- **Use path aliases, not relative paths.** Never use `../../` or `./` to import across package boundaries. Each package defines its own aliases in `tsconfig.json` `paths`:
  - Within-package `./` imports for sibling files in the same directory are acceptable (standard TypeScript pattern).
  - `api/` → `@/*` (project root), `@db/*` (Prisma client), `@web-gen/*` (web-gen source, under `web-gen/src/`)
  - `dashboard/` → `@/*` (project root, under `src/`)
  - `wa-bot/` → `@/*` (project root), `@db/*` (Prisma client)
  - `web-gen/` → `@/*` (project root)

  Vite/Rolldown projects (dashboard) also need `resolve.alias` in `vite.config.ts` to match the tsconfig paths.

## Quirks

- `verbatimModuleSyntax` is on everywhere — use `import type` for type-only imports
- `api/`, `web-gen/`, and `wa-bot/` use `module: "Preserve"`, `allowImportingTsExtensions`, `noEmit: true` (Bun runtime, no tsc emit)
- API + wa-bot path aliases: `@db/*` → `./generated/prisma/*`, `@/*` → `./*`
- web-gen path alias: `@/*` → `./*`
- Dashboard has TypeScript project references: `tsconfig.app.json` (src/) + `tsconfig.node.json` (vite.config.ts)
- ESLint 10 flat config with `eslint/config` module — not `.eslintrc*`
- `erasableSyntaxOnly` in dashboard tsconfig — no enums, no namespaces, no `constructor` parameter properties
- `tsc -b` before vite build ensures type errors block the build
- Prisma schemas split across `prisma/models/*.prisma` (not a single schema.prisma), output to `generated/prisma/` (gitignored)
- Prisma uses `prisma.config.ts` (not `prisma/schema.prisma` as config) with Prisma 7's `defineConfig` — migrations path set there
- Tests use Bun's built-in `bun:test` runner (via `bun run test`)
- WaSession is multi-row (keyed by `ownerId`), always upserted
- Bot expects API to be running first (POSTs QR on `connection.update`)
- Both databases on same PG server: `wani_api` (api) + `wa_bot` (bot)
- `import.meta.env.PROD == null` check in `api/src/config/db.ts` — this is always true under Bun; the global Prisma cache works in both dev and prod
- `optionalJwt` middleware applied globally in `api/src/server.ts` — silently parses JWT on all `/api` routes; `req.user` available for public endpoints when JWT is present, falls through when absent

## Stack Stability

- **Never downgrade packages.** Jika error/bug muncul, cari solusi via searching (docs, Stack Overflow, GitHub issues) — jangan turunkan versi dependency.
- **Research first.** Sebelum menurunkan versi atau mengganti package, cari dulu apakah ada konfigurasi / flag / workaround untuk versi saat ini.
- **Gunakan latest stable.** Semua dependency harus latest stable version dari npm registry resmi.

## AI / ML Pipeline

**Now wired end-to-end.** Bot forwards messages to POST /api/chat → processMessage() → guardrails → LLM → intent handler → reply back to WA.

### Full Pipeline Flow (18 steps)

```
incoming WA msg
  │
  ├─ 1. normalizeInput()       — strip control chars + NFKC normalize + trim + cap
  ├─ 2. upsert customer + conv
  ├─ 3. dedup by waMsgId
  ├─ 4. persist inbound msg
  ├─ 5. checkRateLimit()       — per-customer sliding window (short + long)
  ├─ 6. scanPii()              — log PII matches (phone, email, NIK, API key, address)
  │
  ├─ 7. 3-tier injection defense
  │   ├─ Tier 1 regex [always, ~0ms]
  │   │   scanInput() → classifyVerdict()
  │   │   ├─ SAFE     ─────── proceed
  │   │   ├─ BLOCK    ─────── block
  │   │   └─ UNCERTAIN ──────→ Tier 2
  │   │
  │   ├─ Tier 2 classifier [conditional, ~500-1000ms]
  │   │   classifyInput() via OpenRouter fast model
  │   │   ├─ SAFE       ──── proceed
  │   │   ├─ INJECTION  ──── block
  │   │   └─ SUSPICIOUS ────→ Tier 3
  │   │
  │   └─ Tier 3 deep judge [conditional, ~1000-2000ms]
  │       judgeInput() via OpenRouter with conversation history
  │       ├─ SAFE  ──── proceed
  │       └─ BLOCK ──── block
  │
  ├─ 8. isBudgetExceeded()     — daily LLM call budget (UsageCounter table)
  ├─ 9. load context           — Store, Product, AiConfig, build system prompt
  ├─10. build messages         — history (10) + current message (wrapped in delimiters)
  ├─11. complete() via OpenRouter (circuit breaker, retry, fallback model) — kirim `[system, ...history (10), current]` bukan cuma `[system, current]`
  ├─12. parse LLM output       — JSON extraction + LLMOutputSchema validation
  ├─13. handleIntent()         — execute action (create order, log escalation, etc.)
  ├─14. sanitizeReply()        — strip code fences, cap length
  ├─15. scanOutput()           — canary, delimiter, system prompt section, PII, exfiltration
  ├─16. redactPii()            — replace leaked PII with type markers
  ├─17. checkGrounding()       — [inquiry/order only] LLM-as-judge verifies factual accuracy
  ├─18. record usage + persist outbound + touch conversation
  │
  ▼
reply
```

### Unicode Defense

Three independent layers:

| Layer | What | Catches |
|-------|------|---------|
| **NFKC normalization** (`normalizeInput`, `scanInput`, `normalizeLeet`) | Converts compatibility chars to canonical form | Fullwidth Latin (`ｉｇｎｏｒｅ` → `ignore`), Mathematical Alphanumerics (`𝐢𝐠𝐧𝐨𝐫𝐞` → `ignore`), Circled/Enclosed alphanumerics |
| **Homoglyph detector** (`detectObfuscation`) | Counts chars from 13 non-Latin script ranges | Cyrillic (`ignore` via Cyrillic lookalikes), Greek, Letterlike Symbols (ℂℍℕℙℚℝℤ) — these survive NFKC |
| **Leetspeak normalizer** (`normalizeLeet`) | Maps digits/symbols → letters | `1gn0r3` → `ignore`, `$y$t3m` → `system` |

### Verdict Tiers

scanInput reasons mapped by confidence:

| Confidence | Reasons | Action |
|-----------|---------|--------|
| **HIGH** | `delimiter_escape`, `token_injection`, `leet_obfuscated` | Immediate BLOCK |
| **MEDIUM** | `instruction_override`, `prompt_extraction`, `role_hijack`, `authority_claim` | BLOCK |
| **LOW** | `crescendo_marker`, `context_overflow` | UNCERTAIN → pass to Tier 2 |

### Latency Profile

| Tier | When | Latency | Call Frequency |
|------|------|---------|----------------|
| T1 regex | Always | ~0ms | 100% of messages |
| T2 classifier | Only when T1 returns UNCERTAIN | ~500-1000ms | <1% of messages |
| T3 judge | Only when T2 returns SUSPICIOUS | ~1000-2000ms | <0.1% of messages |
| Grounding | Only for inquiry/order intents | ~500-1500ms | ~30-50% of messages |

### Files

| File | Role |
|------|------|
| `ai/engine.ts` | `complete()` — OpenRouter chat completion with retry (2×), exponential backoff, fallback model on failure, 30s AbortController timeout |
| `ai/engine.ts` | `chat()` — convenience wrapper: system prompt + single user message |
| `ai/prompts.ts` | `buildSystemPrompt(store, products, ...)` — assembles system prompt with store info, product catalog, security rules, strict JSON-only output requirement, canary token `PROMPT_CANARY` + customer message delimiters `<customer_message>` / `</customer_message>` |
| `ai/schemas.ts` | Zod discriminated union `LLMOutputSchema` — validates LLM JSON output into 6 intents: `order` / `inquiry` / `greeting` / `complaint` / `unknown` / `escalate` |
| `ai/types.ts` | `LLMOutput` union type, `ChatMessage`, `CompletionOptions`, `TokenUsage`, `CompletionResult` |
| `ai/pipeline.ts` | `processMessage()` — 18-step orchestrator: normalize → PII → rate limit → 3-tier firewall → budget → context → LLM → parse → intent → sanitize → output scan → PII redact → grounding → persist |
| `ai/actions.ts` | `handleIntent()` — intent action handlers: order (creates Order), inquiry, greeting, complaint (may escalate), unknown, escalate (logs to ActivityLog) |
| `ai/circuit-breaker.ts` | `withCircuit()` — 3 consecutive failures → 60s open → half-open → retry |
| `guardrails/input.ts` | `normalizeInput()` strips control/zero-width chars + NFKC normalization, caps at `MAX_INPUT_CHARS`; `detectInjection()` regex-based EN+ID prompt injection heuristics |
| `guardrails/ratelimit.ts` | Per-customer in-memory sliding window (short + long) — single-process, resets on restart |
| `guardrails/budget.ts` | `isBudgetExceeded()` / `recordLlmUsage()` — daily LLM call budget via `UsageCounter` table |
| `guardrails/output.ts` | `sanitizeReply()` strips code fences, caps at `MAX_REPLY_CHARS`; `hasLeak()` checks for canary + system prompt keywords |
| `guardrails/pii.ts` | `scanPii()` / `hasPii()` / `redactPii()` — phone, email, NIK, API key, address detection for Indonesia |
| `guardrails/classifier.ts` | `classifyInput()` ML injection classifier via OpenRouter fast model; `judgeInput()` deep LLM analysis for borderline cases; `checkGrounding()` LLM-as-judge for factual accuracy |
| `guardrails/firewall/encoding.ts` | `normalizeUnicode()` (NFKC), `detectObfuscation()` (base64/hex/homoglyph), `normalizeLeet()` (NFKC + leetspeak → plain text) |
| `guardrails/firewall/injection.ts` | `scanInput()` — 9 attack-class regex groups (delimiter escape, instruction override, prompt extraction, role hijack, authority claim, token injection, context overflow, crescendo, leet-obfuscated) + `classifyVerdict()` — maps reasons to SAFE/UNCERTAIN/BLOCK tiers |
| `guardrails/firewall/context.ts` | `analyzeTurn()` / `resetConversationState()` — per-customer sliding-window drift tracking, identity challenge scoring, cumulative suspicion over multiple turns |
| `guardrails/firewall/output.ts` | `scanOutput()` — canary leak, delimiter leak, system prompt reconstruction, PII leak, exfiltration (markdown image URLs, encoded data) |

### Model config

- **`AiConfig` table** (single-row `id: "default"`) — stores `model`, `systemPrompt`, `temperature`, `maxTokens`, `greetingMessage`, `knowledgeBase`, `isActive`
- **`.env` env vars** (`LLM_MODEL`, `LLM_TEMPERATURE`, etc.) are fallback defaults — the DB row takes precedence at runtime
- **Guardrail env vars**: `RATE_LIMIT_*`, `MAX_INPUT_CHARS`, `MAX_REPLY_CHARS`, `DAILY_LLM_BUDGET`, `CLASSIFIER_ENABLED`, `CLASSIFIER_MODEL`, `JUDGE_ENABLED`, `JUDGE_MODEL`, `GROUNDING_CHECK_ENABLED`, `GROUNDING_MODEL`
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
- 152+ unit tests (guardrails + firewall + schemas + auth + middleware + errors + response + intent + golden-reply)

## Referensi Dokumen

- **`dashboard/ARCHITECTURE.md`** — Component tree, routing, design system (warm teal+amber palette), data flow, page spec, mock strategy
- **`dashboard/API_SPEC.md`** — Full API contract spec for all 5 pages, request/response shapes, error codes

## Workflow Step-by-Step

Tiap pekerjaan backend dikerjakan dalam tahapan kecil (per fitur/endpoint/komponen), dan tiap tahap di-commit ke git lokal supaya histori jelas dan gampang rollback.

### Aturan Dasar

1. **Satu fitur = satu atau lebih tahap.** Contoh: Products CRUD dipecah jadi: route+schema → controller → model → test → commit.
2. **Commit tiap tahap selesai.** Jangan nunggu semua fitur rampung baru commit.
3. **Commit message yang jelas.** Format: `{emoji} {package}: {action} — {detail}`.
   - `🔥 api: add products CRUD — route, schema, controller, model`
   - `🧪 api: add products tests`
   - `📝 api: add ARSITEKTUR.md`
4. **Jangan commit sekaligus banyak perubahan.** Kalau terlanjur banyak berubah di satu sesi, commit terakhir boleh `squash` asal dikasih tahu.
5. **Tanya dulu sebelum mulai tahap baru.** "Gw lanjut ke tahap X?" — jangan tiba-tiba ngoding tanpa konfirmasi.

### Alur per Tahap

```
┌──────────────────────────────────────────┐
│  1. Tanya: "Gw kerjain [fitur] ya?"     │
│     → User: "gas" / "nanti"              │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  2. Coding — implementasi sesuai rencana│
│     (biasanya: schema → route →         │
│      controller → model)                │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  3. Verify — type check, lint, test     │
│     (bun run test / tsc --noEmit)        │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  4. Stage + commit lokal                 │
│     (hanya file relevan, jangan commit  │
│      node_modules atau generated/)      │
└──────────────────┬───────────────────────┘
                   ▼
┌──────────────────────────────────────────┐
│  5. Lapor: "Tahap X selesai — {commit}  │
│     {ringkasan}. Lanjut ke tahap Y?"     │
└──────────────────────────────────────────┘
```

### Commit Pattern

```bash
git add api/src/routes/products.ts api/src/controllers/products.ts ...
git commit -m "🔥 api: add products CRUD — route, schema, controller, model"
```

### Catatan

- Hanya commit file dari `api/` ketika kerja backend — jangan campur package lain.
- Generated files (Prisma client, node_modules) masuk `.gitignore` — jangan di-stage.
- Migrations file (`prisma/migrations/`) ikut di-commit — itu bagian dari schema versioning.
- **Wajib jalanin `bun run prisma:migrate -- --name <nama>` setiap ada perubahan di `prisma/models/*.prisma`** — jangan bikin migration manual. Migration akan auto-apply ke dev DB.

## Progress — Multi-Tenant + Code Review

**Tujuan:** Data isolation per-user (ownerId scoping) + hardening via code review (19 HIGH + 24 MEDIUM).

### Done

| Tahap | Deskripsi |
|-------|-----------|
| 1 | Prisma schema — 12 models + `ownerId` + scoped indexes (`@@unique([ownerId, phone])`, dll) |
| 2 | Middleware — `optionalJwt` global, `getOwnerIdOrFirst(req)` pattern, `owner.ts` race-safe |
| 3 | Migration — backfill existing data via `COALESCE(subquery, nil_uuid)`, works fresh & existing |
| 4 | Controllers + AI pipeline + WA bot — all queries scoped by `ownerId`, full propagation (238 tests) |
| H1–H19 | **19/19 HIGH** — history→LLM, circuit-breaker mutex, convMemory cleanup, error boundary, context memo, debounce, WA bot safety net, SignalKeyStore batch, OrderItem indexes |
| M1–M24 | **24/24 MEDIUM** — `findManyPaginated` helper, ReDoS fix, leet normalization tokenized, PII dedup, useCallback extracted, import cleanup, env var guards, Prisma indexes, e2e integration test |

### In Progress — Tahap 7: Multi-Tenant Bot (per-owner WASocket)

| Sub-tahap | Deskripsi |
|-----------|-----------|
| 7b | Schema + migration: Creds/SignalKey scoped by ownerId — ✅ done |
| 7c | Schema + migration: WaSession multi-row (api) — ✅ done |
| 7d | API WaSession model + controller — ownerId scoped, clearBotCreds(ownerId) — ✅ done |
| 7d–7e | API: WaSession model/routes/controllers scoped per ownerId, bot + dashboard split |
| 7f | wa-bot auth: `usePrismaAuthState(prisma, ownerId)` |
| 7g | `BotInstance` class — extracted per-owner WASocket logic |
| 7h | `BotManager` class — poll active tenants, spawn/stop instances |
| 7i | wa-bot index — simplified entrypoint |
| 7j | Dashboard — verify WaSessionTab masih jalan |
| 7k | Backfill migration for existing data |
| 7l | Test — unit, typecheck, manual multi-user |

### Test Status

- `bun run test` → 245 pass, 0 fail, 5 skip (env-based SMTP/API key)
- `bun run test:e2e` → 6 pass, 0 fail (pipeline integration)
- Dashboard `vitest run` → 97 pass, 0 fail (7 test files)
- Dashboard `bun run build` → clean (535 KB JS, 50 KB CSS)
