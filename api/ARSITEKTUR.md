# WANI API — Architecture

> REST API backend untuk platform omnichannel UMKM. Menangani AI chat pipeline, manajemen toko, dan integrasi WhatsApp.

---

## Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Runtime** | Bun | 1.3.x |
| **Framework** | Express | 5.x |
| **ORM** | Prisma | 7.x |
| **DB Driver** | `@prisma/adapter-pg` (PostgreSQL) | 7.x |
| **Validation** | Zod | 4.x |
| **Logging** | Winston + Morgan | 3.x |
| **AI Provider** | OpenRouter | REST API |
| **TypeScript** | TypeScript | 5.x |
| **Testing** | Bun built-in (`bun:test`) | — |

### Prinsip Stack

- **No downgrade.** Jika ada error/bug, cari solusi via searching — bukan turunkan versi package.
- **Latest stable.** Semua dependency harus latest stable version dari npm registry resmi.
- **Bun native.** TypeScript `noEmit: true`, Bun jalankan TS langsung (`allowImportingTsExtensions`).
- **`verbatimModuleSyntax`** — import type untuk type-only imports.

---

## Directory Structure

```
api/
├── prisma.config.ts              # Prisma 7 defineConfig — schema path, migrations dir
├── package.json
├── tsconfig.json
├── .env.example
├── ARSITEKTUR.md                 # ← This file
│
├── prisma/
│   ├── schema.prisma             # Generator + datasource config (referensi ke models/)
│   ├── migrations/               # Auto-generated migration files
│   └── models/                   # Schema per-domain (9 file)
│       ├── enums.prisma          # OrderStatus, PaymentMethod, PaymentStatus, MessageRole, ConversationStatus
│       ├── store.prisma          # Store (single-row)
│       ├── catalog.prisma        # Category, Product
│       ├── customer.prisma       # Customer
│       ├── conversation.prisma   # Conversation, Message
│       ├── order.prisma          # Order, OrderItem, Payment
│       ├── ai.prisma             # AiConfig (single-row)
│       ├── audit.prisma          # ActivityLog, UsageCounter
│       └── wa_session.prisma     # WaSession (single-row)
│
├── generated/prisma/             # Prisma generated client (gitignored)
│
├── src/
│   ├── index.ts                  # Entrypoint — start server, graceful shutdown
│   ├── server.ts                 # Express app factory — middleware chain + routes
│   │
│   ├── config/
│   │   ├── db.ts                 # PrismaClient singleton (global cache, @prisma/adapter-pg)
│   │   ├── env.ts                # Typed env accessor — num()/bool() helpers, namespaced config
│   │   └── logger.ts             # Winston logger (Console transport, JSON format) + morgan stream
│   │
│   ├── routes/
│   │   ├── index.ts              # Combines all routers under /api
│   │   ├── qr.ts                 # GET /, GET /status, POST /, DELETE /
│   │   ├── chat.ts               # POST /
│   │   ├── store.ts              # GET /, PUT /
│   │   ├── ai-config.ts          # GET /, PUT /
│   │   └── debug.ts              # Dev-only: GET /traces, GET /traces/:id, DELETE /traces, GET /status, POST /circuit/reset
│   │
│   ├── controllers/
│   │   ├── qr.ts                 # getQr, getStatus, upsertQr, clearQr
│   │   ├── chat.ts               # postChat
│   │   ├── store.ts              # getStore, upsertStore
│   │   ├── ai-config.ts          # getAiConfig, upsertAiConfig
│   │   └── debug.ts              # getRecentTraces, getTraceDetail, deleteTraces, getStatus, postResetCircuit
│   │
│   ├── schemas/
│   │   ├── wa-session.ts         # upsertQrSchema
│   │   ├── chat.ts               # chatRequestSchema
│   │   ├── store.ts              # upsertStoreSchema
│   │   ├── ai-config.ts          # upsertAiConfigSchema
│   │   └── debug.ts              # getTracesQuerySchema, getTraceDetailParamsSchema
│   │
│   ├── middleware/
│   │   ├── auth.ts               # requireAuth — Bearer API_TOKEN check
│   │   ├── error.ts              # errorHandler — AppError-aware, 500 fallback
│   │   └── validate.ts           # validate({body?, query?, params?}) — Zod safeParseAsync
│   │
│   ├── utils/
│   │   ├── errors.ts             # AppError hierarchy (BadRequest, Unauthorized, Forbidden, NotFound, InternalServer)
│   │   └── response.ts           # sendResponse — unified JSON format
│   │
│   ├── types/
│   │   └── wa-session.ts         # WaSessionData type
│   │
│   ├── models/
│   │   ├── base.ts               # BaseModel<T> — abstract class dengan Prisma delegate pattern
│   │   ├── wa-session.ts         # WaSessionModel — find, upsert, clearQr
│   │   ├── store.ts              # StoreModel — find, upsert
│   │   ├── ai-config.ts          # AiConfigModel — find (Decimal→Number normalize), upsert
│   │   ├── catalog.ts            # ProductModel, CategoryModel
│   │   ├── customer.ts           # CustomerModel — upsertByPhone, incrementOrders
│   │   ├── conversation.ts       # ConversationModel — findOrCreateActive, touch, setStatus
│   │   ├── message.ts            # MessageModel — recentByConversation, existsByWaMsgId, append
│   │   ├── order.ts              # OrderModel — createFromItems ($transaction)
│   │   └── activity-log.ts       # ActivityLogModel — log
│   │
│   ├── ai/
│   │   ├── types.ts              # LLMOutput union, ChatMessage, CompletionOptions, CompletionResult, TokenUsage
│   │   ├── schemas.ts            # Zod discriminated union LLMOutputSchema (6 intents)
│   │   ├── circuit-breaker.ts    # withCircuit() — 3 failures → 60s open → half-open
│   │   ├── engine.ts             # complete() — OpenRouter call + retry (2×) + fallback model + 30s timeout
│   │   ├── prompts.ts            # buildSystemPrompt() — canary, delimiters, security rules, output format
│   │   ├── actions.ts            # handleIntent() — order, inquiry, greeting, complaint, unknown, escalate
│   │   └── pipeline.ts           # processMessage() — 18-step orchestrator
│   │
│   ├── guardrails/
│   │   ├── input.ts              # normalizeInput (strip control chars + NFKC, cap length), detectInjection (regex EN+ID)
│   │   ├── output.ts             # sanitizeReply (strip code fences, cap length), hasLeak (canary + system prompt keywords)
│   │   ├── pii.ts                # scanPii, hasPii, redactPii (phone, email, NIK, API key, address — Indonesia)
│   │   ├── ratelimit.ts          # checkRateLimit — in-memory sliding window (short + long)
│   │   ├── budget.ts             # isBudgetExceeded, recordLlmUsage — UsageCounter table, daily budget
│   │   ├── classifier.ts         # classifyInput (ML), judgeInput (deep LLM), checkGrounding (fact-check)
│   │   └── firewall/
│   │       ├── types.ts          # ScanResult, ScanVerdict, OutputScanResult
│   │       ├── encoding.ts       # normalizeUnicode (NFKC), detectObfuscation (base64/hex/homoglyph), normalizeLeet
│   │       ├── injection.ts      # scanInput (9 attack classes), classifyVerdict (HIGH→BLOCK, MEDIUM→BLOCK, LOW→UNCERTAIN)
│   │       ├── context.ts        # analyzeTurn (drift tracking, identity challenge scoring), resetConversationState
│   │       ├── output.ts         # scanOutput (canary leak, delimiter leak, system prompt recon, PII leak, exfiltration)
│   │       └── index.ts          # Barrel re-exports
│   │
│   └── debug/
│       └── tracer.ts             # TraceContext (timed steps), ring buffer (500 traces), storeTrace/getTraces
│
└── test/
    ├── firewall.test.ts          # 30+ tests: encoding, injection, verdict, context, output scan, PII
    ├── guardrails.test.ts        # Tests: normalizeInput, detectInjection, sanitizeReply, hasLeak, checkRateLimit
    ├── intent.test.ts            # 45 test cases for 6 intents (requires OPENROUTER_API_KEY)
    └── golden-reply.test.ts      # Safety checks for known-good replies
```

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                               │
│                                                                  │
│  Express 5 (helmet → cors → morgan → json → routes → 404 → err) │
└──────────────────────────┬──────────────────────────────────────┘
                           │ req / res
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Routes (routers/)                          │
│                                                                  │
│  /api/qr  /api/chat  /api/store  /api/ai-config  /api/debug     │
│                                                                  │
│  ┌─────────── middleware per-route: requireAuth, validate ─────┐ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Controllers (controllers/)                   │
│                                                                  │
│  • Extract params dari req (body/query/params)                   │
│  • Panggil model method                                          │
│  • Return sendResponse(res, status, message, data?)              │
│  • NO try-catch — error dilempar ke AppError → errorHandler      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Models (models/)                              │
│                                                                  │
│  BaseModel<T>                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  delegate  →  this.db.<model>  (Prisma delegate)        │    │
│  │  getAll / getById / create / update / delete             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  • Single-row models: WaSessionModel, StoreModel, AiConfigModel │
│    → find() = getById("default"), upsert() = upsert(id:"default")│
│  • Relational models: ProductModel, CustomerModel, etc.         │
│    → custom queries (findByNames, upsertByPhone, createFromItems)│
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma ORM + PostgreSQL                        │
│                                                                  │
│  @prisma/adapter-pg — pool pg with max:1, timeout:5s            │
│  12 models across 9 files, 2 databases: wani_api + wa_bot       │
└─────────────────────────────────────────────────────────────────┘
```

### Alur End-to-End (contoh: POST /api/chat)

```
wa-bot ──POST /api/chat──▶  requireAuth  ──▶  validate(chatRequestSchema)
                                  │
                                  ▼
                          postChat controller
                                  │
                                  ▼
                       processMessage() 18-step pipeline
                                  │
                    ┌─────────────┼──────────────┐
                    ▼             ▼              ▼
              guardrails      AI engine      database
              (firewall,     (OpenRouter)   (Customer,
               PII, rate,    circuit breaker  Conversation,
               budget)        retry+fallback  Message, Order,
                                              ActivityLog)
                    │             │              │
                    └─────────────┼──────────────┘
                                  ▼
                          sendResponse(res, 200, "ok", { reply, intent })
                                  │
                                  ▼
                          wa-bot receives reply
```

---

## API Surface

### Unified Response Format

```typescript
// Success (status < 400)
{ "status": "success", "message": string, "data": T | null }

// Error (status >= 400)
{ "status": "failure", "message": string, "data": null | ZodIssue[] }
```

### Authentication

```
Authorization: Bearer {API_TOKEN}
```

### Endpoints

| Method | Path | Auth | Controller | Description |
|--------|------|------|------------|-------------|
| `GET` | `/api/qr` | — | `getQr` | QR code string |
| `GET` | `/api/qr/status` | — | `getStatus` | Connection status + phone |
| `POST` | `/api/qr` | 🔒 | `upsertQr` | Push QR / update status (from wa-bot) |
| `DELETE` | `/api/qr` | 🔒 | `clearQr` | Clear QR on successful connect |
| `POST` | `/api/chat` | 🔒 | `postChat` | Process WA message → AI reply |
| `GET` | `/api/store` | — | `getStore` | Store profile |
| `PUT` | `/api/store` | 🔒 | `upsertStore` | Update store profile |
| `GET` | `/api/ai-config` | — | `getAiConfig` | AI config (model, prompt, etc.) |
| `PUT` | `/api/ai-config` | 🔒 | `upsertAiConfig` | Update AI config |
| `GET` | `/api/products` | — | `listProducts` | Product list (paginated, searchable, filterable) |
| `GET` | `/api/products/:id` | — | `getProduct` | Product detail with category |
| `POST` | `/api/products` | 🔒 | `createProduct` | Create product |
| `PUT` | `/api/products/:id` | 🔒 | `updateProduct` | Update product |
| `DELETE` | `/api/products/:id` | 🔒 | `deleteProduct` | Delete product |
| `GET` | `/api/products/categories` | — | `listCategories` | Category list with product count |
| `POST` | `/api/products/categories` | 🔒 | `createCategory` | Create category |
| `PUT` | `/api/products/categories/:id` | 🔒 | `updateCategory` | Update category |
| `DELETE` | `/api/products/categories/:id` | 🔒 | `deleteCategory` | Delete category |
| `GET` | `/api/orders` | — | `listOrders` | Order list (paginated, filter by status/date) |
| `GET` | `/api/orders/:id` | — | `getOrder` | Order detail + items + payment + customer |
| `PUT` | `/api/orders/:id/status` | 🔒 | `updateOrderStatus` | Update status (with transition validation) |
| `PUT` | `/api/orders/:id/notes` | 🔒 | `updateOrderNotes` | Update notes |
| `PUT` | `/api/orders/:id/payment` | 🔒 | `updateOrderPayment` | Create or update payment |
| `GET` | `/api/customers` | — | `listCustomers` | Customer list (paginated, search name/phone) |
| `GET` | `/api/customers/:id` | — | `getCustomer` | Customer detail + orders + conversation + messages |
| `PUT` | `/api/customers/:id` | 🔒 | `updateCustomer` | Update name/notes |
| `GET` | `/api/conversations/:id` | — | `getConversation` | Conversation messages |
| `PUT` | `/api/conversations/:id/status` | 🔒 | `updateConversationStatus` | Update conversation status |
| `POST` | `/api/conversations/:id/messages` | 🔒 | `sendMessage` | Send HUMAN message |
| `GET` | `/api/dashboard/stats` | — | `getStats` | Aggregated dashboard stats |
| `GET` | `/api/logs` | — | `listLogs` | Activity log (paginated, filterable) |
| `GET` | `/api/usage` | — | `getUsage` | LLM usage counters (today) |
| `POST` | `/api/auth/register` | — | `register` | Register new account |
| `POST` | `/api/auth/login` | — | `login` | Login (JWT token) |
| `GET` | `/api/auth/me` | — | `me` | Current user (token auto-verify) |
| `POST` | `/api/auth/logout` | — | `logout` | Logout |
| `POST` | `/api/auth/forgot-password` | — | `forgotPassword` | Generate reset token |
| `POST` | `/api/auth/reset-password` | — | `resetPassword` | Reset password with token |
| `GET` | `/api/debug/traces` | — | `getRecentTraces` | Dev: recent pipeline traces |
| `GET` | `/api/debug/traces/:id` | — | `getTraceDetail` | Dev: trace detail |
| `DELETE` | `/api/debug/traces` | — | `deleteTraces` | Dev: clear trace buffer |
| `GET` | `/api/debug/status` | — | `getStatus` | Dev: uptime + memory usage |
| `POST` | `/api/debug/circuit/reset` | — | `postResetCircuit` | Dev: reset circuit breaker |

### Website Endpoints (belum diimplementasikan — web-gen integration)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/website/generate` | 🔒 | Generate website from config |
| `GET` | `/api/website/download` | — | Download generated ZIP |
| `POST` | `/api/website/publish` | 🔒 | Publish website to hosting |

Lihat `dashboard/API_SPEC.md` untuk kontrak lengkap request/response tiap endpoint.

---

## BaseModel Pattern

### Generic CRUD (BaseModel<T>)

```typescript
abstract class BaseModel<T> {
  protected static get db()        // PrismaClient singleton
  protected static get delegate()  // abstract → Prisma delegate

  static async getAll<T>()          // delegate.findMany()
  static async getById<T>(id)      // delegate.findUnique()
  static async create<T>(data)     // delegate.create()
  static async update<T>(id, data) // delegate.update()
  static async delete(id)          // delegate.delete()
}
```

Semua model tinggal extend `BaseModel` dan override `get delegate()`:

```typescript
class WaSessionModel extends BaseModel<WaSession> {
  protected static get delegate() { return this.db.waSession }
  static find()        { return this.getById("default") }
  static upsert(data)  { return this.delegate.upsert({ where: { id: "default" }, ... }) }
  static clearQr()     { return this.delegate.update({ where: { id: "default" }, data: { qr: null } }) }
}
```

### Single-Row Pattern

Tiga model menggunakan id `"default"` dengan `@default("default")` di Prisma:

| Model | Table | Key Methods |
|-------|-------|-------------|
| `WaSessionModel` | `wa_sessions` | `find()`, `upsert(data)`, `clearQr()` |
| `StoreModel` | `store` | `find()`, `upsert(data)` |
| `AiConfigModel` | `ai_configs` | `find()` (normalize Decimal→Number), `upsert(data)` |

Semua operasi adalah upsert — tidak ada create terpisah. Ini memastikan single-row invariant.

### Custom Models (relasional)

| Model | Custom Methods |
|-------|----------------|
| `ProductModel` | `listAvailable()`, `findByNames(names)`, `listAll()` |
| `CustomerModel` | `upsertByPhone(phone, name?)`, `incrementOrders(id)` |
| `ConversationModel` | `findOrCreateActive(customerId)`, `touch(id)`, `setStatus(id, status)` |
| `MessageModel` | `recentByConversation(convId, limit)`, `existsByWaMsgId(waMsgId)`, `append(data)` |
| `OrderModel` | `createFromItems(customerId, items, notes?)` — gak extend BaseModel, pakai `$transaction` |
| `ActivityLogModel` | `log(type, description, referenceId?, metadata?)` |

---

## Middleware Chain

Urutan middleware di `src/server.ts`:

```
1. helmet()          → Security headers (X-Frame-Options, CSP, etc.)
2. cors()            → Cross-origin resource sharing
3. morgan("short")   → HTTP request logging via Winston stream
4. express.json()    → JSON body parser
5. routes (/api)     → All route modules (qr, chat, store, ai-config, debug)
6. 404 catch-all     → sendResponse(res, 404, "not found")
7. errorHandler      → AppError-aware error handler
```

### requireAuth

```typescript
// middleware/auth.ts
// Extracts Bearer token → compares with API_TOKEN env
// Throws UnauthorizedError() on mismatch/missing
// Sync — not async
```

### validate

```typescript
// middleware/validate.ts
// Factory: validate({ body?: ZodSchema, query?: ZodSchema, params?: ZodSchema })
// Returns async middleware
// Uses safeParseAsync → on failure: throws BadRequestError(error.issues)
// On success: mutates req[part] with parsed data
```

### errorHandler

```typescript
// middleware/error.ts
// Express 5 signature: (err, req, res, next)
// err instanceof AppError → sendResponse(res, err.statusCode, err.message, err.details)
// Otherwise → console.error + 500 + stack in development
```

---

## Error Handling

### AppError Hierarchy

```
AppError (message, statusCode, details?)
├── BadRequestError     → 400 (default: "bad request")
├── UnauthorizedError   → 401 (default: "unauthorized")
├── ForbiddenError      → 403 (default: "forbidden")
├── NotFoundError       → 404 (default: "not found")
└── InternalServerError → 500 (default: "internal server error")
```

Semua subclass punya sensible defaults — bisa `throw new UnauthorizedError()` tanpa argumen.

### sendResponse

```typescript
function sendResponse(res: Response, statusCode: number, message: string, data?: unknown): void
// statusCode >= 400 → status: "failure", else → status: "success"
```

---

## AI Pipeline

### 18-Step Orchestrator

```
incoming WA msg
  │
  ├─ 1. normalizeInput()         — strip control chars + NFKC + trim + cap
  ├─ 2. upsert customer + conv   — CustomerModel + ConversationModel
  ├─ 3. dedup by waMsgId          — skip if already processed
  ├─ 4. persist inbound           — MessageModel.append (role: CUSTOMER)
  ├─ 5. checkRateLimit()          — per-customer sliding window (short 8/30s + long 60/1h)
  ├─ 6. scanPii()                 — log PII matches
  │
  ├─ 7. 3-tier injection defense
  │   ├─ Tier 1 regex [always, ~0ms]
  │   │   scanInput() → classifyVerdict()
  │   │   ├─ SAFE      ──── proceed
  │   │   ├─ BLOCK     ──── blocked → reply with polite message
  │   │   └─ UNCERTAIN ────→ Tier 2
  │   │
  │   ├─ Tier 2 classifier [conditional, ~500-1000ms]
  │   │   classifyInput() via OpenRouter fast model
  │   │   ├─ SAFE       ──── proceed
  │   │   ├─ INJECTION  ──── blocked
  │   │   └─ SUSPICIOUS ────→ Tier 3
  │   │
  │   └─ Tier 3 deep judge [conditional, ~1000-2000ms]
  │       judgeInput() with conversation history
  │       ├─ SAFE  ──── proceed
  │       └─ BLOCK ──── blocked
  │
  ├─ 8. isBudgetExceeded()       — daily LLM call budget (UsageCounter)
  ├─ 9. load context             — Store + Products + AiConfig → build system prompt
  ├─10. build messages           — history (10) + current message (wrapped in delimiters)
  ├─11. complete()               — OpenRouter via circuit breaker (retry 2×, fallback, 30s)
  ├─12. parse LLM output         — JSON extraction + LLMOutputSchema validation
  ├─13. handleIntent()           — execute action per intent
  ├─14. sanitizeReply()          — strip code fences, cap length
  ├─15. scanOutput()             — canary leak, delimiter leak, system prompt, PII, exfiltration
  ├─16. redactPii()              — replace leaked PII with [TYPE] markers
  ├─17. checkGrounding()         — [inquiry/order only] LLM-as-judge factual check
  ├─18. record usage + persist   — UsageCounter, MessageModel.append (role: BOT), touch conversation
  │
  ▼
  reply
```

Setiap langkah di-trace oleh `TraceContext` dan disimpan ke ring buffer (500 traces) untuk debugging via `/api/debug/traces`.

### Circuit Breaker

```typescript
withCircuit<T>(fn, label = "llm"): Promise<CircuitResult<T>>
```

| State | Threshold | Behavior |
|-------|-----------|----------|
| **Closed** | — | Normal operation |
| **Open** | 3 consecutive failures | Rejects immediately for 60s |
| **Half-Open** | After 60s cooldown | Allows 1 probe request |
| **Reset** | On success | Resets failure count to 0 |

### LLM Engine (engine.ts)

```
complete(messages, options)
  │
  ├─ POST https://openrouter.ai/api/v1/chat/completions
  ├─ Retry: maxRetries=2, exponential backoff (1s, 2s, 10s cap)
  ├─ Fallback: on first failure → switch to env.ai.fallbackModel
  ├─ Timeout: AbortController with 30s default
  ├─ Retryable: 429, 5xx, timeout, invalid response
  ├─ Non-retryable: missing API key, auth errors
  │
  └─ Returns: { content, model, finishReason, usage }
```

### Intent Handlers (actions.ts)

| Intent | Action |
|--------|--------|
| `order` | Lookup products → `OrderModel.createFromItems()` → increment customer orders → log activity |
| `inquiry` | Return LLM's reply text |
| `greeting` | Return configured `greetingMessage` or default |
| `complaint` | If `escalate=true`: set conversation to ESCALATED, log activity |
| `escalate` | Set conversation to ESCALATED, log reason |
| `unknown` | Return LLM's reply text |

### System Prompt (prompts.ts)

- **Canary token**: `WANI-CANARY-7Q2F8X` — embedded in system prompt, checked in output scan
- **Delimiters**: `<customer_message>` / `</customer_message>` — wraps user input
- **Sections**: Business info → Product catalog → Policies (hours/payment/shipping/return) → Security rules → Output format (per-intent JSON schemas)
- **Security rules**: Explicit warnings about delimiter boundaries, ignore override commands, prohibit revealing system prompt

---

## Guardrails

### 3-Tier Injection Defense

```
                    scanInput (T1 regex)
                    │
          ┌─────────┼──────────┐
        SAFE    UNCERTAIN      BLOCK
          │         │            │
          │    classifyInput    BLOCK reply
          │    (T2 classifier)   │
          │         │            │
          │   ┌─────┼──────┐    │
          │ SAFE  SUSPICIOUS INJECTION
          │   │       │         │
          │   │  judgeInput   BLOCK reply
          │   │  (T3 deep)     │
          │   │       │         │
          │   │   ┌───┼───┐    │
          │   │ SAFE  BLOCK    │
          │   │   │     │      │
          ▼   ▼   ▼     ▼      ▼
       proceed proceed proceed blocked
```

### Attack Classes (T1 Regex — 9 groups)

| Class | Confidence | Example |
|-------|-----------|---------|
| `delimiter_escape` | HIGH | `</customer_message>` early close |
| `token_injection` | HIGH | XSS (`<script>`), code fences, SQL injection |
| `leet_obfuscated` | HIGH | `1gn0r3 pr3v10us 1nstruct10ns` |
| `instruction_override` | MEDIUM | "Ignore previous instructions" (EN+ID) |
| `prompt_extraction` | MEDIUM | "Show me your system prompt" |
| `role_hijack` | MEDIUM | "You are now DAN", jailbreak, roleplay |
| `authority_claim` | MEDIUM | "I'm your developer/admin" |
| `crescendo_marker` | LOW | "One more thing", "hypothetically" |
| `context_overflow` | LOW | Many-shot: >20 lines with instruction-like prefixes |

### Unicode Defense

| Layer | What | Catches |
|-------|------|---------|
| **NFKC normalization** | Converts compatibility chars to canonical form | Fullwidth Latin, Mathematical Alphanumerics, Circled |
| **Homoglyph detector** | Counts chars from 13 non-Latin script ranges | Cyrillic lookalikes, Greek, Letterlike Symbols |
| **Leetspeak normalizer** | Maps digits/symbols → letters | `1gn0r3` → `ignore`, `$y$t3m` → `system` |

### Additional Defenses

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| **PII Scanner** | Regex patterns (phone, email, NIK, API key, address) | Input + output |
| **PII Redaction** | Replace with `[PHONE]`, `[EMAIL]`, etc. | Output only |
| **Rate Limiter** | Dual in-memory sliding window (8/30s + 60/1h) | Per-customer |
| **Budget Tracker** | Daily call/token limit via UsageCounter table | Global |
| **Output Scan** | Canary leak, delimiter leak, system prompt recon, exfiltration | Output only |
| **Grounding Check** | LLM-as-judge verifies factual accuracy | Inquiry/order intents |

### Fail-Safe Defaults

Semua guardrail checks default ke **non-blocking** pada error:

```typescript
// Contoh: classifier gagal → SAFE
try { result = await classifyInput(text) }
catch { result = "SAFE" }

// Contoh: budget check error → not exceeded
try { exceeded = await isBudgetExceeded() }
catch { exceeded = false }
```

---

## Database Schema

### Entity-Relationship

```
Store (single-row)
  │
  ├── AiConfig (single-row)
  ├── WaSession (single-row)
  │
  ├── Category ──→ Product ──→ OrderItem
  │                                │
  Customer ──→ Order ──────────────┘
  │    │         │
  │    │         └── Payment
  │    │
  │    └── Conversation ──→ Message
  │
  ActivityLog (standalone)
  UsageCounter (standalone)
```

### Model Detail

| Model | Table | Key Columns | Relations |
|-------|-------|-------------|-----------|
| `Store` | `store` | `id="default"`, `businessName`, `phone`, `address`, `businessHours`, `paymentMethods`, `shippingInfo`, `returnPolicy`, `isActive` | — |
| `AiConfig` | `ai_configs` | `id="default"`, `isActive`, `systemPrompt` (Text), `model`, `greetingMessage`, `knowledgeBase` (Text), `maxTokens`, `temperature` (Decimal(3,2)) | — |
| `WaSession` | `wa_sessions` | `id="default"`, `status`, `phone`, `qr` | — |
| `Category` | `categories` | `id` (uuid), `name` (unique), `description` | → Product[] |
| `Product` | `products` | `id` (uuid), `name`, `price` (Decimal(12,2)), `stock`, `isAvailable`, `imageUrl` | → Category, → OrderItem[] |
| `Customer` | `customers` | `id` (uuid), `phone` (unique), `name`, `totalOrders` | → Order[], → Conversation[] |
| `Conversation` | `conversations` | `id` (uuid), `status` (ConversationStatus), `lastMessageAt` | → Customer, → Message[] |
| `Message` | `messages` | `id` (uuid), `role` (MessageRole), `content` (Text), `waMsgId` (unique), `metadata` (Json) | → Conversation |
| `Order` | `orders` | `id` (uuid), `status` (OrderStatus), `totalAmount` (Decimal(12,2)), `source`, `notes` | → Customer, → OrderItem[], → Payment? |
| `OrderItem` | `order_items` | `id` (uuid), `qty`, `unitPrice` (Decimal(12,2)), `subtotal` (Decimal(12,2)) | → Order, → Product |
| `Payment` | `payments` | `id` (uuid), `method` (PaymentMethod), `amount` (Decimal(12,2)), `status` (PaymentStatus), `paidAt` | → Order (unique) |
| `ActivityLog` | `activity_logs` | `id` (uuid), `type`, `referenceId`, `description` (Text), `metadata` (Json), `createdAt` | — |
| `UsageCounter` | `usage_counters` | `id` (YYYY-MM-DD), `llmCalls`, `tokensIn`, `tokensOut` | — |

### Enums

| Enum | Values |
|------|--------|
| `OrderStatus` | PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED |
| `PaymentMethod` | CASH, TRANSFER, QRIS |
| `PaymentStatus` | PENDING, PAID, FAILED, REFUNDED |
| `MessageRole` | CUSTOMER, BOT, HUMAN |
| `ConversationStatus` | ACTIVE, RESOLVED, ARCHIVED, ESCALATED |

### Database Config

- **Two databases** on same PG server: `wani_api` (API) + `wa_bot` (bot)
- **Prisma adapter**: `@prisma/adapter-pg` with `PrismaPg`
- **Connection pool**: `max: 1`, `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 300000`
- **Monetary values**: `Decimal(12, 2)` via `@db.Decimal(12, 2)`
- **Indexes**: Product(name), Conversation(status+customerId), Message(conversationId+createdAt), Order(customerId), ActivityLog(createdAt)
- **Prisma config**: `prisma.config.ts` dengan `defineConfig`, migrations path di `prisma/migrations/`
- **Split schemas**: Model definitions di `prisma/models/*.prisma`, digabung via `schema.prisma` yang mereference folder

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WhatsApp Bot (wa-bot/)                         │
│                                                                          │
│  receives incoming message                                               │
│       │                                                                  │
│       ├─ POST /api/qr (QR code)                                         │
│       ├─ POST /api/chat (message → reply)                               │
│       └─ GET /api/qr/status (connection check)                          │
│                                                                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTP (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Server (api/)                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    AI Pipeline (18 steps)                         │    │
│  │                                                                  │    │
│  │  Normalize → Customer → Dedup → Persist → Rate → PII → Firewall │    │
│  │  → Budget → Load Context → LLM → Parse → Intent → Sanitize →    │    │
│  │  → Output Scan → Redact → Grounding → Record → Reply             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    REST Endpoints                                 │    │
│  │                                                                  │    │
│  │  GET /api/qr           ──── WaSession (single-row)              │    │
│  │  GET /api/store        ──── Store (single-row)                   │    │
│  │  GET /api/ai-config    ──── AiConfig (single-row)                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Prisma (SQL)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                                       │
│                                                                          │
│  wani_api DB:                                                            │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────┐ │
│  │ Store     │  │ Category │  │ Customer  │  │ Order     │  │ WaSession │
│  │ AiConfig  │  │ Product  │  │ Conversat.│  │ OrderItem │  │         │
│  │           │  │          │  │ Message   │  │ Payment   │  │         │
│  └───────────┘  └──────────┘  └───────────┘  └───────────┘  └────────┘ │
│                                                                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Dashboard (dashboard/)                          │
│                                                                          │
│  Vite dev proxy: /api/* → localhost:3001/*                              │
│                                                                          │
│  Hooks (MOCK = true/false):                                             │
│  ├─ useWaStatus()     → GET /api/qr + GET /api/qr/status               │
│  ├─ useProducts()     → GET/POST/PUT/DELETE /api/products              │
│  ├─ useOrders()       → GET /api/orders + PUT /api/orders/:id/status   │
│  ├─ useCustomers()    → GET /api/customers + GET conversations         │
│  └─ useSettings()     → GET/PUT /api/store + GET/PUT /api/ai-config    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Debug & Tracing

### TraceContext

```
TraceContext.begin("pipeline")
  ├─ step(name, fn)     — timed step
  ├─ set(key, value)    — set metadata
  └─ finish()           — finalize + store in ring buffer
```

Setiap eksekusi `processMessage()` menghasilkan trace dengan:

- `id` (uuid)
- `timestamp`
- `duration` (total ms)
- `steps` — array of `{ name, duration, error? }`
- `metadata` — `{ phone, intent, blocked, model, usage, customerId, conversationId }`

### Ring Buffer

- Circular buffer: max 500 traces
- Di-memory — hilang saat restart
- Diakses via `/api/debug/traces` (list) dan `/api/debug/traces/:id` (detail)
- Bisa di-clear via `DELETE /api/debug/traces`

### Debug Endpoints (development only — `NODE_ENV !== "production"`)

| Endpoint | Deskripsi |
|----------|-----------|
| `GET /api/debug/traces?limit=N` | Recent N traces (default 20) |
| `GET /api/debug/traces/:id` | Single trace detail |
| `DELETE /api/debug/traces` | Clear ring buffer |
| `GET /api/debug/status` | Uptime + memory usage |
| `POST /api/debug/circuit/reset` | Reset circuit breaker |

---

## Development Workflow

```bash
# Setup
bun install
bun run prisma:generate     # Generate Prisma client
bun run prisma:migrate      # Apply dev migrations

# Development
bun run src/index.ts         # Start server on port 3001

# Production migration
bun run prisma:deploy        # Apply production migrations

# Testing
bun test                     # Run all tests (bun:test)
```

### Aturan

1. **Jangan turunkan versi package** saat ada error. Cari solusi di dokumentasi/Stack Overflow/GitHub issues.
2. **Tanya dulu sebelum ngoding.** Semua perubahan besar lewat review di chat dulu.
3. **Jangan commit kecuali diminta.** — sesuai instruksi AGENTS.md.

---

## Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| **P1** | ✅ Selesai | Express 5 setup + middleware chain + error handling |
| **P2** | ✅ Selesai | BaseModel + single-row models (WaSession, Store, AiConfig) |
| **P3** | ✅ Selesai | Relational models (Product, Customer, Conversation, Message, Order, ActivityLog) |
| **P4** | ✅ Selesai | AI pipeline 18-step + guardrails 3-tier + circuit breaker |
| **P5** | ✅ Selesai | Unit + firewall + golden reply tests |
| **P6** | ✅ Selesai | Products CRUD endpoints (GET list, GET/:id, POST, PUT/:id, DELETE/:id, GET categories) |
| **P7** | ✅ Selesai | Orders endpoints (GET list, GET/:id, PUT/:id/status, PUT/:id/notes, PUT/:id/payment) |
| **P8** | ✅ Selesai | Customers + Chats endpoints (list, detail + orders + conversations, send message) |
| **P9** | ✅ Selesai | Dashboard stats endpoint (aggregated overview) |
| **P10** | ✅ Selesai | Auth endpoints (register, login, me, logout, forgot/reset password) |
| **P11** | ✅ Selesai | Activity log + Usage endpoints |
| **P12** | ✅ Selesai | Dashboard integrasi — semua hooks pakai real API |
| **P13** | ✅ Selesai | Website endpoints + web-gen integration (config, generate, download ZIP, publish) |
