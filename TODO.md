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
- [x] 4l. `qr.ts` — WaSession tetap global (no change)
- [x] 4m. `auth.ts` — no change (User model sendiri)
- [x] 4n. `dashboard.ts` — `getDashboardStats(ownerId)` scopes all counts
- [x] 4o. AI pipeline: `PipelineInput.ownerId` → `PipelineContext.ownerId` → `ActionCtx.ownerId` propagated through all steps (contextLoader → products/payment/store/aiConfig by owner, ensureCustomer → upsertByOwnerPhone, actions → order/activityLog scoped, firewall/outputGuardrails → activityLog scoped)
- [x] 4p. WA bot: sends `ownerId` from `OWNER_ID` env var in chat requests
- [x] 4q. All 238 tests pass (0 fail)

### Tahap 5: Frontend — Verify

- [ ] 5a. Login sebagai user baru → liat dashboard kosong
- [ ] 5b. Tambah store → setup wizard
- [ ] 5c. Sidebar tampilin nama user (udah ada dari `useAuth`)
- [ ] 5d. Test CRUD semua fitur sebagai user baru

### Tahap 6: Test

- [ ] 6a. Manual test: register 2 user, verify data terisolasi
- [ ] 6b. Test WA bot flow masih jalan

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

**Tests**: 129 pass (unit), 6 pass (e2e), 0 fail. Dashboard `bun run build` clean.

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
