# TODO: Multi-Tenant Data Isolation

**Goal:** Setiap user punya data sendiri (Store, Product, Order, Customer, dll).
Registrasi → login → liat dashboard kosong, bukan data user lain.

## Tahapan

### Tahap 1: ✅ Prisma Schema — Add `ownerId` ke semua model

- [x] 1a. `Store` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1b. `AiConfig` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1c. `WebSite` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1d. `Category` — tambah `ownerId String`
- [x] 1e. `Product` — tambah `ownerId String`
- [x] 1f. `Customer` — tambah `ownerId String` (hapus `@@unique([phone])`, ganti `@@unique([ownerId, phone])`)
- [x] 1g. `Order` — tambah `ownerId String`
- [x] 1h. `Conversation` — tambah `ownerId String`
- [x] 1i. `Message` — tambah `ownerId String`
- [x] 1j. `StorePaymentMethod` — tambah `ownerId String` (ganti `storeId @default("default")` jadi `ownerId`)
- [x] 1k. `ActivityLog` — tambah `ownerId String`
- [x] 1l. `WebsiteGeneration` — tambah `ownerId String`
- [x] 1m. Run `bun run prisma:migrate`

### Tahap 2: ✅ Middleware — Owner Scoping

- [x] 2a. Buat helper `ownerFilter()` / `getOwnerId()` di `api/src/middleware/owner.ts`
- [x] 2b. Pastikan `req.user.id` selalu ada setelah `requireJwt`

### Tahap 3: ✅ Migration — Backfill data existing

- [x] 3a. Migration `20260704223100_add_owner_id` handles backfill via `COALESCE(subquery, nil_uuid)` — works on fresh & existing deployments
- [x] 3b. Already applied via `bun run prisma:migrate`

### Tahap 4: ✅ Controllers + AI Pipeline — Scope queries by `ownerId`

- [x] 4a. `store.ts` — `getOwnerId(req)` for JWT, `getOwnerIdOrFirst(req)` for public
- [x] 4b. `ai-config.ts` — same pattern
- [x] 4c. `product.ts` — `ProductModel.list/create/update` now accept ownerId
- [x] 4d. `category.ts` — `CategoryModel.listAll/createCategory` now accept ownerId
- [x] 4e. `order.ts` — `OrderModel.list/createFromItems/getStats/getStatusCounts` now accept ownerId
- [x] 4f. `customer.ts` — `CustomerModel.list/upsertByOwnerPhone` now accept ownerId
- [x] 4g. `conversation.ts` — `ConversationModel.findOrCreateActive` now accepts ownerId
- [x] 4h. `store-payment.ts` — `listByOwner/listActive/hasAny` instead of `listByStore`/`storeId`
- [x] 4i. `website.ts` — all queries scoped by ownerId
- [x] 4j. `log.ts` — `ActivityLogModel.log/list` now accept ownerId
- [x] 4k. `upload.ts` — unchanged (handles file upload, no owner scope needed)
- [x] 4l. ~~`qr.ts` — WaSession tetap global (no change)~~ → **direvisi di Tahap 7: Multi-Tenant Bot**
- [x] 4m. `auth.ts` — no change (User model sendiri)
- [x] 4n. `dashboard.ts` — `getDashboardStats(ownerId)` scopes all counts
- [x] 4o. AI pipeline: `PipelineInput.ownerId` → `PipelineContext.ownerId` → `ActionCtx.ownerId` propagated through all steps (contextLoader → products/payment/store/aiConfig by owner, ensureCustomer → upsertByOwnerPhone, actions → order/activityLog scoped, firewall/outputGuardrails → activityLog scoped)
- [x] 4p. WA bot: sends `ownerId` from `OWNER_ID` env var in chat requests
- [x] 4q. All 238 tests pass (0 fail)

### Tahap 5: Frontend — Verify

- [x] 5a. Login sebagai user baru → liat dashboard kosong + welcome banner + CTA atur toko
- [x] 5b. Tambah store → form "Buat Toko" di Settings → Store tab kalo store masih null
- [x] 5c. Sidebar tampilin nama user (`user?.name`) kalo store blom ada
- [x] 5d. Test CRUD semua fitur sebagai user baru — produk, store, payment methods (via API)

### Tahap 6: Test

- [x] 6a. Manual test: register 2 user, verify data terisolasi ✅
  - User 1: store `User Satu` (ownerId `9c8f0...`), produk `Produk User 1`
  - User 2: store `User Dua` (ownerId `49ce7...`), produk `Produk User 2`
  - Zero cross-contamination: tiap user cuma liat data sendiri
- [x] 6b. Test WA bot flow masih jalan ✅
  - `POST /api/chat` → greeting → `"Halo! Ada yang bisa kami bantu?"` (intent: greeting)
  - `POST /api/chat` → order request → context-aware reply about available products (intent: inquiry)
  - Pipeline 18-step works end-to-end (guardrails → LLM → intent → sanitize)

### Tahap 7: Multi-Socket per Tenant (1 Process, N Sockets)

**Goal:** Setiap user punya koneksi WhatsApp sendiri (WASocket terpisah).
Tiap user bisa pairing nomor HP sendiri → bot manage N sockets dalam 1 process.

#### 7a. Verifikasi & Branching

- [ ] 7a1. Pastikan semua perubahan Tahap 1-6 udah tercommit di `main`
- [ ] 7a2. Branch baru `feat/multi-tenant-bot` dibuat

#### 7b. Migration & Schema — wa-bot ✅

- [x] 7b1. `wa-bot/prisma/models/creds.prisma` — tambah `ownerId`, ganti `@id` jadi `@@id([ownerId, id])`
- [x] 7b2. `wa-bot/prisma/models/signal_key.prisma` — tambah `ownerId`, ganti `@id` jadi `@@id([ownerId, id])`
- [x] 7b3. Run `bun run prisma:migrate -- --name add_owner_id` di `wa-bot/`

#### 7c. Migration & Schema — api ✅

- [x] 7c1. `api/prisma/models/wa_session.prisma` — ganti `id String @id @default("default")` → `ownerId String @id`
- [x] 7c2. `api/src/types/wa-session.ts` — ganti `WaSessionData`: hapus `id`, pastikan `ownerId` jadi required
- [x] 7c3. `api/src/schemas/wa-session.ts` — tambah `ownerId: z.string()` di `upsertQrSchema`
- [x] 7c4. Run `prisma migrate deploy` di `api/`

#### 7d. API — WaSession Model + Controller ✅

- [x] 7d1. `api/src/models/wa-session.ts` — `find(ownerId)`, `upsert(ownerId, data)`, `clearQr(ownerId)`
- [x] 7d2. `api/src/controllers/qr.ts` — semua handler passing ownerId ke model
- [x] 7d3. `api/src/utils/wa-bot-db.ts` — `clearBotCreds(ownerId)` scoped
- [x] 7d4. `api/src/models/dashboard.ts` — `WaSessionModel.find(ownerId)`
- [x] 7d5. Tests updated — 245 pass, 0 fail

#### 7e. API — WaSession Routes & Controller

- [ ] 7e1. `api/src/routes/qr.ts` — restructure endpoint grouping:
  - `${prefix}/qr` → JWT (dashboard user)
  - `${prefix}/qr/bot` → API_TOKEN (bot)
- [ ] 7e2. Dashboard endpoints: semua pake `requireJwt`, otomatis scoped ke `getOwnerId(req)`
  - `GET /api/qr` → QR ku
  - `GET /api/qr/status` → status ku
  - `POST /api/qr/pairing` → minta pairing untuk ku
  - `POST /api/qr/refresh-pairing` → refresh pairing ku
  - `POST /api/qr/reset` → reset session ku
- [ ] 7e3. Bot endpoints: pake `requireAuth`, terima `ownerId` dari body/path
  - `POST /api/qr/bot` → upsert QR/pairingCode/pairingPhone (body: `{ ownerId, qr?, status?, ... }`)
  - `DELETE /api/qr/bot/:ownerId` → clear QR untuk owner tertentu
- [ ] 7e4. `GET /api/qr/active-tenants` → `requireAuth`, return list ownerId yg punya session aktif
- [ ] 7e5. `api/src/controllers/qr.ts` — pisah handler jadi dashboard vs bot, scoped semua query by `ownerId`

#### 7f. wa-bot — WhatsApp Auth

- [ ] 7f1. `wa-bot/src/services/whatsapp-auth.ts` — `usePrismaAuthState(prisma, ownerId)`. Filter Creds by `ownerId + "pairing"`, filter SignalKey by `ownerId`

#### 7g. wa-bot — BotInstance (file baru)

- [ ] 7g1. `wa-bot/src/instance.ts` — class `BotInstance`, extracted logic dari `index.ts` saat ini:
  - Constructor: `BotInstance(ownerId)`
  - State: `sock`, `connected`, `wsAlive`, `reconnectAttempts`, `isReconnecting`, `pollTimer`, `pollErrors`, `reconnectTimer`, `cleanupRegistered`
  - Methods: `start()`, `stop()`, `handleConnectionUpdate()`, `handleMessagesUpsert()`, `checkAndGeneratePairingCode()`, `pollOutgoing()`, `pollResetSignal()`
  - Tiap instance punya `api` axios instance sendiri (base URL + API_TOKEN + ownerId header)
  - Tiap instance polling `GET /api/qr/bot/:ownerId/*` (scoped)
  - Tiap instance kirim `ownerId` di body `POST /api/chat`

#### 7h. wa-bot — BotManager (file baru)

- [ ] 7h1. `wa-bot/src/manager.ts` — class `BotManager`:
  - `Map<string, BotInstance>` — key by ownerId
  - `start()`: load existing active tenants via `GET /api/qr/active-tenants`, start instance for each
  - `stop()`: stop all instances cleanup
  - `pollForNewTenants()`: every 10s, check active tenants → start new, stop removed
  - `startInstance(ownerId)`: create + start BotInstance, store in Map
  - `stopInstance(ownerId)`: stop + remove from Map

#### 7i. wa-bot — Index (simplified)

- [ ] 7i1. `wa-bot/src/index.ts` — sederhana: init `BotManager`, `manager.start()`, graceful shutdown `manager.stop()`

#### 7j. Dashboard — WaSessionTab

- [ ] 7j1. Periksa `useWaStatus` hook — pastikan endpoint masi jalan (JWT auth, dapet data sendiri)
- [ ] 7j2. Minor adjustment kalo ada perubahan response shape

#### 7k. Backfill — Migration data existing

- [ ] 7k1. Untuk user existing yg udah punya WaSession row default → insert ulang pake ownerId mereka
- [ ] 7k2. wa-bot Creds/SignalKey existing → tambah ownerId (fallback ke owner pertama)

#### 7l. Test

- [ ] 7l1. `bun run test` di `api/` — semua existing tests pass
- [ ] 7l2. `bun run tsc --noEmit` di `wa-bot/` — type check
- [ ] 7l3. Manual: register 2 user, pairing masing-masing, verify AI reply pake data toko masing-masing
- [ ] 7l4. Manual: disconnect user A → user B tetep jalan


### Bug Fixes Found During Testing

- **`jwt.ts:50`** — `optionalJwt` used `JWT_SECRET` (undefined constant) instead of `getJwtSecret()`. Caused `req.user` to never be set for public endpoints with JWT, breaking `getOwnerIdOrFirst(req)` fallback for authenticated requests.
- **`routes/store.ts:9`** — `GET /api/store` used `requireJwt` middleware, but spec says public (`—`). Controller already uses `getOwnerIdOrFirst(req)` for public fallback. Removed `requireJwt`.

---

# Code Review Findings — 2026-07-04

## Status: 19/19 HIGH ✅ | 24/24 MEDIUM ✅ (M6/M7 kept, used in tests)

## 🔴 HIGH PRIORITY — All resolved ✅

| # | Fix | Commit |
|---|---|---|
| H1 | `llmCall.ts` — `chat()` → `complete()` with history `[system, ...history, current]` | code review batch |
| H2 | `routes/website.ts` — added `requireJwt` on `/download` | code review batch |
| H3 | `controllers/log.ts` — Prisma → `ActivityLogModel.getDailyUsage()` | code review batch |
| H4 | `circuit-breaker.ts` — added mutex lock (`withLock()`) | `9e48cc8` |
| H5 | `coordinator.ts` — added `ctx.trace.begin(step.name)` per step | `9e48cc8` |
| H6 | `firewall/context.ts` — periodic cleanup every 10 min + `lastAccess` | code review batch |
| H7 | `actions.ts` — try/catch wrapping `handleIntent()` | code review batch |
| H8 | 3 context files — `useMemo` wrapper | code review batch |
| H9 | `useWebsite.ts` — 500ms debounce on `updateConfig()` | code review batch |
| H10 | `security.test.ts` — fix assert: `GET /api/store` → `PUT /api/store` | code review batch |
| H11 | `intent.test.ts` — `skipIf(!apiKey)` instead of no-op | `9e48cc8` |
| H12 | `dedup.test.ts` — added waMsgId exists/not-exists cases | `9e48cc8` |
| H13 | New test files: `budget.test.ts`, `grounding.test.ts`, `engine.test.ts`, `actions.test.ts` | `9e48cc8` |
| H14 | `useAuth.ts` — guard before destructuring `json.data` | code review batch |
| H15 | `useWebsite.ts` — removed `useProductsSafe()`, use `useContext` directly | `9e48cc8` |
| H16 | `ErrorBoundary.tsx` + `Toast.tsx` — replaced `lucide-react` with `Icons.tsx` SVGs | `9e48cc8` |
| H17 | `wa-bot/src/index.ts` — removed fire-and-forget QR safety net per-message | `9e48cc8` |
| H18 | `whatsapp-auth.ts` — batch deletes per type, parallel upserts | `9e48cc8` |
| H19 | `order.prisma` — added `@@index([orderId])` + `@@index([productId])` + migration | `9e48cc8` |

**Tests**:
- `bun run test` → 238 pass, 0 fail, 5 skip (env-based)
- `bun run test:e2e` → 6 pass, 0 fail
- Dashboard: `vitest run` → 97 pass, 0 fail (7 test files)
- Dashboard `bun run build` → clean (519 KB JS, 50 KB CSS)

---

## 🟡 MEDIUM PRIORITY

### H1 — History percakapan TIDAK pernah dikirim ke LLM [BUG FUNGSIONAL]
**File:** `api/src/ai/pipeline/steps/messageBuilder.ts:28` + `steps/llmCall.ts:18-25`
Step 10 load 10 history messages ke `ctx.historyMessages`, tapi Step 11 panggil `chat()` yang cuma kirim `[system, user]`. AI gak punya memori percakapan.

### H2 — Download website publik tanpa auth [SECURITY]
**File:** `api/src/routes/website.ts:12`
`GET /api/website/download` gak pake `requireJwt`. Siapa pun bisa download ZIP.

### H3 — Prisma langsung dari controller (violasi arsitektur)
**Files:** `controllers/log.ts:26`, `controllers/monitoring.ts:12`, `models/dashboard.ts:25-29`, `models/customer.ts:147,158`
4 tempat bypass Model layer — panggil Prisma langsung.

### H4 — Circuit breaker race condition
**File:** `api/src/ai/circuit-breaker.ts:10-47`
State mutable module-level tanpa locking. Di concurrent request, state machine unpredictable.

### H5 — TraceContext `set()` no-op di 9 dari 11 step [DATA LOSS]
Semua step file kecuali firewall + output guardrails. `trace.set()` diam-diam gak nulis karena `currentStep` kosong.

### H6 — `convMemory` gak pernah di-cleanup [MEMORY LEAK]
**File:** `api/src/guardrails/firewall/context.ts:14`
Map per-customer tumbuh terus seumur proses.

### H7 — Intent handlers gak punya error boundary
**File:** `api/src/ai/actions.ts:54-59`
`handleOrder` dan handlers lain gak punya try-catch. DB failure → unhandled rejection → 500.

### H8 — Context values gak di-memoize [PERFORMANCE]
**Files:** `dashboard/src/contexts/*.tsx`
Tiap render bikin object value baru → semua consumer re-render tiap poll/data fetch.

### H9 — Website page API call tiap keystroke [PERFORMANCE]
**File:** `dashboard/src/hooks/useWebsite.ts:78-91`
`updateConfig()` dipanggil tiap onChange tanpa debounce. ~5 request/detik.

### H10 — Security test assert status code salah [TEST FAIL]
**File:** `api/test/security.test.ts:53-56`
Test expect 401 di `GET /api/store` yang PUBLIC.

### H11 — Intent test zero assertions
**File:** `api/test/intent.test.ts:65-69`
Test tanpa `expect()` — pass vacuously.

### H12 — Dedup logic untested (critical path)
**File:** `api/test/pipeline/dedup.test.ts` (22 lines, 1 test case)
Dedup path (`waMsgId` provided) never tested.

### H13 — `complete()`, `handleIntent()`, `processMessage()`, budget, grounding — ZERO test coverage
**Files:** `engine.ts`, `actions.ts`, `pipeline/index.ts`, `budget.ts`, `classifier.ts`

### H14 — Non-null assertion di `useAuth.login()` [TYPE SAFETY]
**File:** `dashboard/src/hooks/useAuth.ts:27`
`json.data!` — kalo API return `data: null`, destructuring throw runtime error.

### H15 — `useWebsite` duplicate `useProducts` instance via fallback
**File:** `dashboard/src/hooks/useWebsite.ts:12-16`
`useProductsSafe()` creates 2nd independent `useProducts()` instance kalo di luar ProductsProvider.

### H16 — `lucide-react` dipake cuma buat 6 icon (inkonsisten)
**Files:** `ErrorBoundary.tsx:2`, `Toast.tsx:3`
171 line inline SVG icons di `Icons.tsx`, tapi 2 component import dari `lucide-react`.

### H17 — API calls fire-and-forget tiap pesan WA [WA BOT]
**File:** `wa-bot/src/index.ts:116-117`
Tiap inbound message, bot kirim 2 fire-and-forget API call tanpa rate limit.

### H18 — SignalKeyStore `set()` O(n) sequential DB queries
**File:** `wa-bot/src/services/whatsapp-auth.ts:37-51`
Batch of 1000 keys = 1000 sequential upsert/delete.

### H19 — `OrderItem` gak punya index di foreign keys
**File:** `api/prisma/models/order.prisma:21-31`

---

## 🟡 MEDIUM PRIORITY

| # | File | Masalah | Status |
|---|------|---------|--------|
| M1 | `models/*.ts` (4 files) | Pola pagination/where duplikasi — tambah `findManyPaginated` helper di BaseModel | ✅ `b9b1fe9` |
| M2 | `controllers/store-payment.ts:36` | `as any` pada Prisma input — ganti `Record<string, unknown>` | ✅ `b9b1fe9` |
| M3 | `middleware/owner.ts:5` | Module-level mutable state + race condition first access | ✅ |
| M4 | `models/user.ts:15,25,34` | Missing return type annotations — pakai `as Promise<...>` aja | ✅ |
| M5 | `controllers/store-payment.ts:37-43` | Redundant `in` checks — partial fix with M2 | ✅ `b9b1fe9` |
| M6 | `input.ts:36`, `output.ts:21`, `pii.ts:55` | 3 exported functions (`detectInjection`, `hasLeak`, `hasPii`) | ⏭️ kept — used in tests |
| M7 | `firewall/context.ts:16-18` | `resetConversationState` defined tapi zero callers | ⏭️ kept — used in tests |
| M8 | `pii.ts:14` | `ADDRESS_RE` — greedy `.{3,80}` + long alternation → ReDoS potencial | ✅ |
| M9 | `firewall/encoding.ts:10-14` | Leetspeak normalizer convert ALL digits → false positive di harga/alamat | ✅ |
| M10 | `pii.ts:10-14` / `firewall/output.ts:6-12` | PII patterns duplikasi di 2 tempat — drift risk | ✅ |
| M11 | `hooks/*.ts` | `useCallback` di return statement — non-idiomatic, risk hooks violation | ✅ |
| M12 | `pages/Settings.tsx:50` | Dynamic `import()` expression sebagai type annotation | ✅ |
| M13 | Banyak file | Inconsistent `.ts`/`.tsx` extensions di imports | ✅ |
| M14 | `pages/ProductForm.tsx:101` | `set()` function name shadow `setForm` | ✅ `b9b1fe9` |
| M15 | `components/OrderTimeline.tsx:41` | PROCESSING step pake `paidAt` timestamp — semantically wrong | ✅ |
| M16 | `hooks/useWaStatus.ts` | Fetch `/qr` unnecessary setelah connected | ✅ `e485309` |
| M17 | `api/test/security.test.ts:5-6` | Env vars di module scope — shared mutable state antar test | ✅ |
| M18 | `wa-bot/src/config/db.ts:6-12` | Non-null assertion tanpa validation — `"undefined"` literal di URL | ✅ |
| M19 | `wa-bot/src/config/db.ts:19` | Pool `max: 1` bottleneck throughput | ✅ |
| M20 | `init-dbs.sh:5-6` | Hardcoded DB names — ignore .env vars | ✅ |
| M21 | `web-gen/src/generator.ts:389-393` | Fallback path assume co-located packages | ✅ |
| M22 | Banyak model Prisma | Missing indexes (categoryId, isAvailable, phone, ownerId+type) | ✅ |
| M23 | `.env.example:19` | default `LLM_BASE_URL` non-standard (opencode.ai, bukan openrouter.ai) | ✅ |
| M24 | `pipeline/index.ts` | 18-step pipeline gak punya integration test sama sekali | ✅ `e2e/pipeline.test.ts` |

---

## 🟢 LOW PRIORITY (nice to have)

| # | File | Masalah |
|---|------|---------|
| L1 | `middleware/owner.ts:34,38` | Dead code: `ownerFilter`, `ownerWhere` — gak dipake |
| L2 | `models/store.ts:17-18` | `as any` di upsert spread |
| L3 | Routes `:id` tanpa Zod | Param validation missing di beberapa routes |
| L4 | `controllers/order.ts:23-63` | Helper functions bikin controller bloat |
| L5 | `config/db.ts:26` | `import.meta.env.PROD == null` guard — fragile |
| L6 | `types/ai.ts:12-18` vs `schemas.ts:41-48` | Type union vs Zod union — no compile-time bridge |
| L7 | `pii.ts:12` | `API_KEY_RE` — `[\w-]{20,}` matches normal identifiers (UUID, JWT) |
| L8 | `prompts.ts:66-133` | No product count cap di system prompt |
| L9 | `components/Icons.tsx` | 4 unused icon exports |
| L10 | `pages/Website.tsx` | 512-line page — should split menjadi sub-components |
| L11 | `lib/api.ts:10-17` | Auth token dikirim ke semua request termasuk public |
| L12 | `api/tsconfig.json:8` | `jsx: "react-jsx"` di backend — dead config |
| L13 | `web-gen/tsconfig.json:21` | `include: ["src"]` — test dir gak di-typecheck |
| L14 | `generator.ts:264-273` | `spawnSync` ENOENT error silent |
| L15 | Docker healthcheck | WA Bot healthcheck hanya cek PID 1 |
| L16 | Prisma relations | No `onDelete` cascade rules |
| L17 | `Store.paymentMethods` | Legacy String field duplikasi dengan `StorePaymentMethod` model |
| L18 | Rate limiter tests | Hardcoded ke config default — fragile |
