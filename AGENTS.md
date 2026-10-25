# WANI — agent guidance

Four independent packages (not a monorepo). Each has its own `bun.lock` and `tsconfig.json`.

- **`api/`** — Express 5 + Prisma 7 — REST server with layered architecture (routes → controllers → models → Prisma delegate)
- **`dashboard/`** — React 19 + TypeScript 6 + Vite 8 (Rolldown, not esbuild) — frontend UI
- **`landingpage/`** — React 18 + Vite 6 + MUI — public landing page, bundled into dashboard
- **`web-gen/`** — Bun + Astro 7 — static site generator for UMKM websites

WhatsApp is **not** a package anymore: it is the `waha` Docker service (`devlikeapro/waha`), called by the API through `api/src/services/waha.ts`.

## Architecture

```
Dashboard ⇄ /api/sessions* → API ⇄ WAHA (X-Api-Key)
WAHA webhook → POST /api/sessions/messages → AI pipeline → WAHA sendText
```

- **api/src/index.ts** — Express 5 entrypoint (helmet, cors, morgan→Winston, json parser), graceful shutdown
- **api/src/server.ts** — Express app factory with middleware chain + 404 handler + error handler
- **api/src/routes/** — Router modules, combined under `/api` in `routes/index.ts`
- **api/src/controllers/** — Request handlers using `sendResponse()` unified JSON format
- **api/src/models/** — `BaseModel<T>` abstract class with Prisma delegate pattern (getAll/getById/create/update/delete)
- **api/src/schemas/** — Zod v4 schemas (`createSessionSchema`, `pairingSchema`, `createApiKeySchema`, etc.)
- **api/src/middleware/** — `requireServiceAuth(scope)` (managed API key or legacy Bearer API_TOKEN), `requireJwt` (JWT-based), `optionalJwt` (silent JWT parse, no error on missing), `validate` (safeParseAsync), `errorHandler` (AppError-aware)
- **api/src/utils/** — `AppError` subclasses (BadRequest/Unauthorized/Forbidden/NotFound/InternalServer), `sendResponse()`
- **api/src/config/** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`), typed env, Winston logger
- **api/src/services/email.ts** — Nodemailer SMTP transport for password reset emails
- **api/src/services/waha.ts** — WAHA client: create/get session, sync status/QR, pairing, reset, delete, `sendText`
- **api/src/ai/** — Typed pipeline: `PipelineBuilder<I,O>` chain of `Step<I,O>` (16 typed steps), `Either<E,T>` railway-oriented error handling, per-label circuit breaker registry, OpenRouter LLM engine with retry+fallback, intent action handlers, hardened system prompt builder with canary
- **api/src/guardrails/** — Multi-layer defense: PII scanner/redactor, ML classifier (OpenRouter fast model), deep LLM-judge, output grounding check. Plus per-customer sliding-window rate limit, regex injection detection (EN+ID), daily LLM budget tracker, output sanitizer + leak detector. 3-tier injection defense (T1 regex → T2 classifier → T3 judge) with conditional slow path
- **dashboard/vite.config.ts** — `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset`, Tailwind v4, alias `@` → `src` dan `@landingpage` → `../landingpage/src`. **Tidak ada proxy `/api`**: dev butuh `dashboard/.env` berisi `VITE_API_URL=http://localhost:3001/api`; di Docker nginx yang mem-proxy `/api`, `/uploads`, `/s` ke `api:3001`
- **dashboard/src/index.css** — `@import "tailwindcss"` (Tailwind v4 CSS-first config, no `tailwind.config.*`)
- **dashboard/src/hooks/** — Hooks use real API via `fetchApi()` (JWT auth from localStorage). `useWaStatus` and `useAuth` retain `MOCK = false` toggle for legacy compatibility.
- **api/src/routes/sessions.ts** + **controllers/sessions.ts** — `/api/sessions*` (session lifecycle, pairing, WAHA webhook)
- **api/src/models/wa-session.ts** — per-owner `WaSession` mirror (`ownerId @unique`, `waSessionName = store-<ownerId>`)
- **api/src/routes/api-key.ts** — managed service keys (`sessions:messages`, etc.) for WAHA webhook auth

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

**WAHA** (Docker, root):
- `bun run dev:waha` — start WAHA locally (`docker-compose.local.yml`, host port 3000)
- `bun run dev:waha:logs` — follow WAHA logs
- `bun run dev` — WAHA + API + dashboard
- Production stack: `docker compose up -d waha` (internal `waha:3000`, not published)

**Web-Gen** (`web-gen/`):
- `bun install` — install dependencies
- `bun run src/generator.ts` — test generate (CLI mode)
- `bun run build:template` — install dep + build template standalone
- `bun run tsc --noEmit` — type check

## API Endpoints

Semua endpoint **sudah diimplementasikan** — **60+ endpoint**. Tabel lengkap + bentuk request/response: **`Docs/API_CONTRACT.md`**. Tabel di bawah hanya ringkasan cepat (bila ragu, cek `Docs/API_CONTRACT.md`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/upload` | 🔒 JWT | Upload file (QRIS image, etc.) |
| `GET` | `/api/sessions` | 🔒 JWT | Sesi WAHA milik owner (filter `status` opsional) |
| `POST` | `/api/sessions` | 🔒 JWT | Buat/ambil sesi WAHA (`store-<ownerId>`) |
| `DELETE` | `/api/sessions` | 🔒 JWT | Logout + hapus sesi WAHA dan row `WaSession` |
| `POST` | `/api/sessions/sync` | 🔒 JWT | Sync status dari WAHA + refresh QR |
| `POST` | `/api/sessions/reset` | 🔒 JWT | Reset sesi (logout, delete, create ulang) |
| `POST` | `/api/sessions/pairing` | 🔒 JWT | Minta pairing code (`{ phone }`) |
| `POST` | `/api/sessions/refresh-pairing` | 🔒 JWT | Minta ulang pairing code |
| `POST` | `/api/sessions/messages` | Service key `sessions:messages` | Webhook pesan WAHA → AI pipeline |
| `GET` | `/api/api-keys` | 🔒 JWT | List managed service keys |
| `POST` | `/api/api-keys` | 🔒 JWT | Create managed key (token only shown once) |
| `DELETE` | `/api/api-keys/:id` | 🔒 JWT | Revoke managed key |
| `GET` | `/api/store` | — | Get store profile |
| `PUT` | `/api/store` | 🔒 JWT | Update store profile |
| `GET` | `/api/ai-config` | 🔒 JWT | Get AI config |
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
| `GET` | `/api/conversations/:id` | 🔒 JWT | Conversation messages |
| `PUT` | `/api/conversations/:id/status` | 🔒 JWT | Update conversation status |
| `POST` | `/api/conversations/:id/messages` | 🔒 JWT | Send HUMAN message |
| `GET` | `/api/dashboard/stats` | 🔒 JWT | Aggregated dashboard stats |
| `GET` | `/api/logs` | 🔒 JWT | Activity log (paginated) |
| `GET` | `/api/usage` | 🔒 JWT | LLM usage counters (today, global) |
| `POST` | `/api/auth/register` | — | Register account (auto-create Store) |
| `POST` | `/api/auth/login` | — | Login (JWT token; 403 bila email belum diverifikasi) |
| `GET` | `/api/auth/me` | 🔒 JWT | Current user |
| `POST` | `/api/auth/logout` | — | Logout (stateless) |
| `GET` | `/api/auth/verify-email?token=` | — | Verify email |
| `POST` | `/api/auth/resend-verification` | — | Kirim ulang email verifikasi |
| `POST` | `/api/auth/forgot-password` | — | Kirim link reset password |
| `POST` | `/api/auth/reset-password` | — | Reset password |
| `GET` | `/api/website` | — | Get website config |
| `PUT` | `/api/website` | 🔒 JWT | Update website config |
| `POST` | `/api/website/generate` | 🔒 JWT | Generate static site |
| `GET` | `/api/website/download` | 🔒 JWT | Download ZIP |
| `POST` | `/api/website/publish` | 🔒 JWT | Mark as published (tidak men-deploy) |
| `GET` | `/api/website/generations` | 🔒 JWT | Riwayat generate |
| `DELETE` | `/api/website/generations/:id` | 🔒 JWT | Hapus generation + folder |
| `GET` | `/api/health` | — | Health check (DB + LLM key) |
| `GET` | `/api/metrics` | — | Prometheus metrics |
| `GET` | `/s/:slug` | — | Serve generated static site |
| `GET` | `/uploads/:file` | — | Serve uploaded file |

> 🔒 = `requireJwt` (Authorization: Bearer `<JWT>`), Service key = `requireServiceAuth(scope)` (managed API key; legacy `API_TOKEN` only if `ALLOW_LEGACY_API_TOKEN=true`), — = publik (JWT opsional via `optionalJwt` global)

Unified response: `{ status: "success"|"failure", message, data? }`

Error classes: BadRequestError (400), UnauthorizedError (401), ForbiddenError (403), NotFoundError (404), InternalServerError (500)

## Dashboard

- **14 halaman**: Dashboard, Products (+ProductForm), Orders (+OrderDetail), Customers (dual-panel inline chat), Settings, Website, LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage, NotFoundPage + landing page publik di `/`
- **Settings punya 4 tab**: `Toko` (termasuk metode pembayaran via `PaymentTab`), `AI Agent`, `WA Session`, `API Keys`
- **Semua hook pakai API asli**: `useProducts`, `useOrders`, `useCustomers`, `useSettings`, `usePaymentMethods`, `useWebsite`, `useWaStatus`, `useAuth` — tanpa mock toggle, fetch via `fetchApi()`
- **UI primitives** in `components/ui/` (Button, Card, Badge, Table, Modal, Input, Select, Spinner, EmptyState, Pagination) — no external component library
- **Feature components**: StoreTab, AiTab, WaSessionTab, ApiKeysTab, PaymentTab, CategoryModal, ProductListView, ProductCard, OrderListView, OrderTimeline, CustomerListView, ChatView
- **Layout**: `Layout.tsx` shell with `Sidebar.tsx` + `Topbar.tsx` + `<Outlet />`, `BottomNav.tsx` for mobile; `AuthLayout.tsx` for public pages
- **Routing**: React Router v8 `createBrowserRouter` in `App.tsx`, with `ProtectedRoute` gate

## Docker Compose

```bash
cp .env.example .env        # edit: isi DATABASE_PASSWORD, WAHA_API_KEY, JWT_SECRET
docker compose up --build   # build + start semua service
```

5 services: `db` (PostgreSQL 17), `api` (Express, internal port 3001), `dashboard` (nginx, port 5173), `waha` (WhatsApp HTTP API, internal port 3000), `backup`.

Database `wani_api` dibuat otomatis via `init-dbs.sh`. WAHA menyimpan state sesi/autentikasi + media di database `postgres` pada server yang sama.

Key env (root `.env`, shared by API + WAHA): `DATABASE_PASSWORD`, `DATABASE_NAME=wani_api`, `PORT=3001`, `WAHA_API_KEY`, `WAHA_API_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `ALLOW_LEGACY_API_TOKEN` (legacy `API_TOKEN` only during migration). Managed keys are created via `/api/api-keys`, not env.

CI: `.github/workflows/api.yaml` + `.github/workflows/dashboard.yaml`.

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
  - `api/` → `@/*` (project root, maps to `./src/*`), `@db/*` (Prisma client), `@web-gen/*` (web-gen source, under `web-gen/src/`)
  - `dashboard/` → `@/*` (project root, under `src/`)
  - `web-gen/` → `@/*` (project root)

  Vite/Rolldown projects (dashboard) also need `resolve.alias` in `vite.config.ts` to match the tsconfig paths.

## Quirks

- `verbatimModuleSyntax` is on everywhere — use `import type` for type-only imports
- `api/` and `web-gen/` use `module: "Preserve"`, `allowImportingTsExtensions`, `noEmit: true` (Bun runtime, no tsc emit)
- API path aliases: `@db/*` → `./generated/prisma/*`, `@/*` → `./src/*`
- web-gen path alias: `@/*` → `./*`
- Dashboard has TypeScript project references: `tsconfig.app.json` (src/) + `tsconfig.node.json` (vite.config.ts)
- ESLint 10 flat config with `eslint/config` module — not `.eslintrc*`
- `erasableSyntaxOnly` in dashboard tsconfig — no enums, no namespaces, no `constructor` parameter properties
- `tsc -b` before vite build ensures type errors block the build
- Prisma schemas split across `prisma/models/*.prisma` (not a single schema.prisma), output to `generated/prisma/` (gitignored)
- Prisma uses `prisma.config.ts` (not `prisma/schema.prisma` as config) with Prisma 7's `defineConfig` — migrations path set there
- Tests use Bun's built-in `bun:test` runner (via `bun run test`)
- WaSession is per owner (`ownerId @unique`), name `store-<ownerId>`, used as a mirror of WAHA state
- WAHA must be running before creating a WhatsApp session from the dashboard
- WAHA env: `WAHA_API_KEY` (shared API ↔ WAHA), `WAHA_API_URL` (`http://waha:3000/api` in Compose, `http://localhost:3000/api` locally)
- Both databases on same PG server: `wani_api` (API) + `postgres` (WAHA session/media state)
- `import.meta.env.PROD == null` check in `api/src/config/db.ts` — this is always true under Bun; the global Prisma cache works in both dev and prod
- `optionalJwt` middleware applied globally in `api/src/server.ts` — silently parses JWT on all `/api` routes; `req.user` available for public endpoints when JWT is present, falls through when absent

## Stack Stability

- **Never downgrade packages.** Jika error/bug muncul, cari solusi via searching (docs, Stack Overflow, GitHub issues) — jangan turunkan versi dependency.
- **Research first.** Sebelum menurunkan versi atau mengganti package, cari dulu apakah ada konfigurasi / flag / workaround untuk versi saat ini.
- **Gunakan latest stable.** Semua dependency harus latest stable version dari npm registry resmi.

## AI / ML Pipeline

**Now wired end-to-end.** WAHA posts the webhook to POST /api/sessions/messages → processMessage() → guardrails → LLM → intent handler → reply sent back to WA via `WahaService.sendText`.

### Full Pipeline Flow (16 steps)

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
| `ai/prompts.ts` | `buildSystemPrompt(store, products, ...)` — assembles system prompt with store info, product catalog, security rules, strict JSON-only output requirement, canary token `PROMPT_CANARY` + customer message delimiters |
| `ai/schemas.ts` | Zod discriminated union `LLMOutputSchema` — validates LLM JSON output into 6 intents |
| `ai/types.ts` | `LLMOutput` union, `ChatMessage`, `CompletionOptions`, `TokenUsage`, `CompletionResult` |
| `ai/pipeline/index.ts` | `processMessage()` — entry point, builds 16-step chain via `PipelineBuilder` |
| `ai/pipeline/builder.ts` | `PipelineBuilder<I,O>` — typed `.pipe(step)` chain, `.build()` → run function |
| `ai/pipeline/either.ts` | `Either<E,T>` — `ok(value)` / `fail(error)` railway-oriented result type |
| `ai/pipeline/types.ts` | `Step<I,O>` interface, step I/O interfaces, `StepError`, `STEP_REPLIES` |
| `ai/pipeline/steps/*.ts` | 16 `Step<I,O>` implementations (normalize → ensureCustomer → dedup → persistInbound → rateLimit → piiScan → firewall → budget → contextLoader → messageBuilder → llmCall → outputParser → intentExecutor → outputGuardrails → usageRecorder → outboundPersister) |
| `ai/circuit-breaker/index.ts` | `CircuitBreaker` class + `CircuitBreakerRegistry` — per-label isolation (3 failures → 60s open → half-open) |
| `ai/actions.ts` | `handleIntent()` — intent action handlers: order (creates Order), inquiry, greeting, complaint (may escalate), unknown, escalate |
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

- **`AiConfig` table** (one row per owner, `ownerId @unique`) — stores `model`, `systemPrompt`, `temperature`, `maxTokens`, `greetingMessage`, `knowledgeBase`, `isActive`
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
- 247+ unit tests (guardrails + firewall + schemas + auth + middleware + errors + response + intent + golden-reply + pipeline)

## Referensi Dokumen

Semua dokumentasi kanonik ada di **`Docs/`** (README root adalah symlink ke `Docs/README.md`). File lama `api/ARSITEKTUR.md`, `dashboard/ARCHITECTURE.md`, `dashboard/API_SPEC.md`, `web-gen/ARCHITECTURE.md`, `web-gen/API_SPEC.md` adalah symlink ke `Docs/` — edit di `Docs/`, jangan bikin dokumen paralel.

| Dokumen | Isi |
|---------|-----|
| `Docs/README.md` | Indeks + ringkasan proyek |
| `Docs/ARCHITECTURE.md` | Alur sistem, multi-tenancy, topologi |
| `Docs/REPOSITORY_STRUCTURE.md` | Struktur folder, path alias, konvensi |
| `Docs/CONFIGURATION.md` | Semua env var + presedensi LLM |
| `Docs/DATA_MODEL.md` | 18 tabel `wani_api`, enum, migrasi; state WAHA di database `postgres` |
| `Docs/API_CONTRACT.md` | Semua endpoint, auth, format respons, rate limit |
| `Docs/AI_PIPELINE.md` | 16 step pipeline, LLM engine, intent action |
| `Docs/GUARDRAILS.md` | 3-tier firewall, PII, rate limit, budget, output |
| `Docs/SERVICES/API.md` · `DASHBOARD.md` · `WAHA.md` · `WEB_GEN.md` | Detail per paket / service |
| `Docs/DEVELOPMENT.md` · `Docs/DEPLOYMENT.md` | Setup lokal · deploy, CI/CD, backup |

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

### Test Status

- `bun run test` → 247 pass, 0 fail, 2 skip (env-based SMTP/API key)
- `bun run test:e2e` → 6 pass, 0 fail (pipeline integration)
- Dashboard `vitest run` → 97 pass, 0 fail (7 test files)
- Dashboard `bun run build` → clean (519 KB JS, 50 KB CSS)

### Key Decisions

- **`ownerId` as plain String** — no Prisma `@relation` to User (avoids circular deps, simplifies migration)
- **`optionalJwt` globally** — silent JWT parse on all `/api` routes, public endpoints prefer auth'd user when JWT present
- **`getOwnerIdOrFirst(req)`** — JWT user → first DB user → `"default"` fallback for public GET endpoints
- **Owner scoping at Model layer** — Controllers call Model methods which add `where: { ownerId }` internally
- **WaSession is per owner** — one WhatsApp connection per store (`store-<ownerId>`), mirroring WAHA state
- **M9 leet normalization** — tokenized: digit→letter only in tokens with letters, preserves prices/years
- **E2E tests in `e2e/`** — isolated from unit tests via `bun run test:e2e` (avoids `mock.module` global leakage)
- **Merge `d6d9c1f`** — kept our test scripts (`bun run test` + `bun run test:e2e`), took their screenshots
