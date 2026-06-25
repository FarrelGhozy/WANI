# WANI — Project TODO

## ⚡ Optimasi — Segera

### ✅ Tier 1 — Selesai

| # | Item | Package | Commit |
|---|------|---------|--------|
| 1 | **`findByNames()` → `where: { name: { in } }`** | api | ✅ |
| 2 | **`OrderModel` extend `BaseModel` + `createMany` + `upsert`** | api | ✅ |
| 3 | **`getOrThrow()` di BaseModel** | api | ✅ |
| 4 | **Hapus duplicate `VALID_TRANSITIONS` controller** | api | ✅ |
| 5 | **`requireJwt` di `auth.me` + `website.download`** | api | ✅ |
| 6 | **`Promise.all()` 3 DB queries pipeline** | api | ✅ |
| 7 | **Hapus `hasPii()` double scan** | api | ✅ |
| 8 | **Hapus `MOCK = false` code** | dashboard | ✅ |
| 9 | **`useAuth` → `fetchApi()`** | dashboard | ✅ |

Catatan: #7 (NFKC) dipertahankan di `scanInput()` karena public API — pipeline tetap hanya normalize sekali.

### 🟡 Tier 2 — Type Safety & Dead Code

| # | Item | Package | File | Detail |
|---|------|---------|------|--------|
| 11 | **`$Enums.*` conversions** | api | `message.ts:5`, `order.ts:85-91`, `website.ts` | Hardcoded strings → `$Enums.MessageRole`, `$Enums.OrderStatus.*`, typed params |
| 12 | **Dead exports guardrails** | api | 6 files | `detectInjection()`, `normalizeUnicode()`, `resetConversationState()`, `hasLeak()`, `VALID_INTENTS`, `redactPii()` — only used in tests or never imported |
| 13 | **`formatPrice` 6× duplication** | dashboard | 5 files | Extract to `src/utils/format.ts` |
| 14 | **Generic `useApiData<T>` hook** | dashboard | 5 hooks | Eliminates ~20 lines of loading/error boilerplate per hook |
| 15 | **Circuit breaker gap** | api | `classifier.ts:75,117,160` | T2/T3/grounding bypass circuit breaker. Fix: wrap in `withCircuit()` |
| 16 | **Regex hoisting + `[].concat()`** | api | `injection.ts:78,144` | Regex recompiled per call; array alloc per call |

### 🟢 Tier 3 — Polish

| # | Item | Package | Detail |
|---|------|---------|--------|
| 17 | `(r: any)` → Prisma type | api | `activity-log.ts:71` |
| 18 | `debug.ts` inconsistencies | api | Manual 404, hardcoded circuit state |
| 19 | `hashPassword()` helper | api | `auth.ts` duplicate `Bun.password.hash()` |
| 20 | Rate limiter Map leak | api | `ratelimit.ts:10` — periodic cleanup |
| 21 | `todayKey()` double call | api | `budget.ts` — cache date string |
| 22 | `useRef` callback stabilization | dashboard | `getProduct`, `getOrder`, `updateStatus` |
| 23 | Shared `types.ts` | dashboard | Centralize type definitions |

---

## Terimplementasi ✅

- **WA Session** — QR push/pull/clear/status, auto-reconnect
- **AI Pipeline (18-step)** — normalize → PII → rate limit → 3-tier firewall → budget → context → LLM → parse → intent → sanitize → output scan → PII redact → grounding → persist
- **Guardrails** — T1 regex injection, T2 classifier, T3 judge, PII scanner/redactor, rate limit, daily budget, output leak detection, grounding check, Unicode defense (NFKC + homoglyph + leetspeak)
- **Circuit Breaker** — 3 failures → 60s open → half-open → retry
- **Debug Tracer** — Ring buffer (500 cap), per-request TraceContext, duration tracking
- **Debug Routes** — GET /api/debug/traces, GET /api/debug/traces/:id, DELETE /api/debug/traces, GET /api/debug/status, POST /api/debug/circuit/reset
- **API Spec** — Lengkap dengan request/response shapes
- **Frontend (Dashboard)** — 5 pages (Dashboard, Products, Orders, Customers, Settings), **semua hooks panggil API real** (via `fetchApi()`), React 19 + Vite 8 + Tailwind v4
- **Bot (wa-bot/)** — Baileys connect, QR terminal + API POST, forward messages to API, send reply back
- **API Endpoints** — Semua ~40 endpoint sudah diimplementasikan (routes, controllers, models, schemas, Zod validation)
- **Tests** — 152 test, 0 failures (firewall, guardrails, auth, middleware, errors, schemas, intent, golden-reply)
- **Prisma Migrations** — 3 migrations applied (core tables + users/website + store logo)
- **Docker Compose** — 4 service definitions (db, api, dashboard, wa-bot)
- **Dockerfile** — Ada untuk api, dashboard, wa-bot

## 🔴 Critical — Harus Dibenerin

| # | Item | Package | Detail |
|---|------|---------|--------|
| 1 | **`OPENROUTER_API_KEY` kosong** | api/, root `.env` | Semua LLM call bakal gagal. Isi key valid di `api/.env` dan root `.env` |
| 2 | **`wa-bot/` node_modules tidak ada** | wa-bot/ | `bun install` belum pernah dijalankan — bot ga bisa jalan lokal |
| 3 | **`wa-bot/` Prisma client tidak ada** | wa-bot/ | `generated/prisma/` tidak ditemukan — jalanin `bun run prisma:generate` setelah instalasi |
| 4 | **Template web-gen dependencies belum diinstall** | web-gen/ | `web-gen/src/templates/default/node_modules/` kosong — jalanin `bun install` di direktori template |

## 🟡 Medium — Perlu Diperbaiki

| # | Item | Package | Detail |
|---|------|---------|--------|
| 5 | **5 TypeScript error di API** | api/ | `activity-log.ts:69` (SortOrder type), `customer.ts:14`, `log.ts:8`, `order.ts:14`, `product.ts:16` (ParsedQs mismatch). Runtime OK karena pake `req.validatedQuery`, tapi perlu dibenerin biar type-safe |
| 6 | **`wa-bot/.env` tidak ada** | wa-bot/ | Hanya ada `.env.example` — bot ga bisa jalan lokal tanpa env |
| 7 | **`dashboard/` punya `package-lock.json` + `bun.lock`** | dashboard/ | Inconsistent — pake bun aja, hapus `package-lock.json` |
| 8 | **`dashboard/.env` tidak ada** | dashboard/ | Minor — proxy fallback ke `localhost:3001`, tapi best practice pake env |
| 9 | **`web-gen/.env` tidak ada** | web-gen/ | Minor — cuma telemetry disable |

## 🔄 Pending Improvements

### AI / Guardrails

| # | Item | Prioritas | Catatan |
|---|------|-----------|---------|
| 1 | **Grounding check** | Medium | `checkGrounding()` udah diimplementasi tapi butuh validasi end-to-end dengan real LLM |
| 2 | **T2/T3 classifier tuning** | Low | Threshold confidence bisa di-tuning berdasarkan production data |
| 3 | **Embeddings / RAG** | Low | `knowledgeBase` masih plain text — belum ada vector store |
| 4 | **Multilingual defense** | Low | Regex injection detection baru EN+ID |

### Dashboard

| # | Item | Prioritas | Catatan |
|---|------|-----------|---------|
| 5 | **Final MOCK toggle cleanup** | Low | `useAuth.ts` dan `useWaStatus.ts` masih punya `MOCK = false` — ga dipake, tapi bisa dihapus |
| 6 | **Error handling UI** | Medium | Belum ada unified error toast / notification system |
| 7 | **Loading states** | Medium | Beberapa page belum punya skeleton loading |

### Infra / DevOps

| # | Item | Prioritas | Catatan |
|---|------|-----------|---------|
| 8 | **PostgreSQL lokal** | High | Untuk development lokal butuh PG running — bisa pake `docker compose up db` |
| 9 | **CI/CD pipeline** | Medium | Lint + typecheck + test + build |
| 10 | **Health check endpoint** | Low | `GET /api/health` untuk monitoring |
| 11 | **Production build dashboard** | Medium | Pastiin `vite build` output siap serve production |

### Bot

| # | Item | Prioritas | Catatan |
|---|------|-----------|---------|
| 12 | **Bot auto-start documentation** | Low | Cara jalanin bot setelah API siap |
| 13 | **Multi-device session backup** | Low | Belum ada mekanisme backup creds |

## Evaluasi — Jalan Normal

### Syarat Minimal (Urutan Setup)

```
1. PostgreSQL running          → docker compose up db
2. API env lengkap             → isi OPENROUTER_API_KEY + DB_URL di api/.env
3. API dependencies            → cd api && bun install && bun run prisma:generate && bun run prisma:migrate
4. API start                   → cd api && bun run src/index.ts (port 3001)
5. Bot dependencies            → cd wa-bot && bun install && bun run prisma:generate
6. Bot env                     → cd wa-bot && cp .env.example .env (isi API_TOKEN)
7. Bot start                   → cd wa-bot && bun run src/index.ts
8. Dashboard dependencies      → cd dashboard && bun install
9. Dashboard start             → cd dashboard && bun run dev (port 5173)
```

### Catatan Penting

- **AI pipeline TIDAK akan jalan** tanpa `OPENROUTER_API_KEY` — semua LLM call timeout/fail
- **Bot ga bisa QR-generate** tanpa API endpoint `POST /api/qr` (wait, ini udah jalan sih)
- **Database harus PostgreSQL 17** — Prisma pake `@prisma/adapter-pg` yang spesifik PG
- **Port conflict**: API (3001), Dashboard (5173), PostgreSQL (5432)
- **wa-bot dan API** harus jalan bareng biar chat flow lengkap
