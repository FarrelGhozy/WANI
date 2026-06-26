# WANI — Project TODO

## ✅ Baru Selesai

| # | Item | Package | Detail |
|---|------|---------|--------|
| 24 | **Logo WANI** — desain + implementasi | dashboard | Chat bubble + W icon, wordmark (teal + amber), PNG conversion via sharp |
| 25 | **Login page redesign** | dashboard | Teal gradient bg, logo center di atas card, hilangin subtitle "Dashboard" |
| 26 | **Login error UX** | dashboard | Shake animation, "Email atau password tidak cocok", red border kedua field, fix stale closure navigation |
| 27 | **Final MOCK cleanup** | dashboard | `useAuth.ts` + `useWaStatus.ts` — MOCK toggle sudah dihapus sepenuhnya |
| 28 | **TypeScript cleanup** | api | `tsc --noEmit` lulus 0 error — semua ParsedQs mismatch sudah dibenerin |
| 29 | **wa-bot `.env`** | wa-bot | Sudah ada (sebelumnya: "tidak ada") |
| 30 | **web-gen `.env`** | web-gen | Sudah ada (sebelumnya: "tidak ada") |
| 31 | **`useRef` cleanup** | dashboard | ✅ Resolved — no `useRef` ditemukan di hooks |
| 32 | **🔴 Critical deps** | wa-bot/web-gen | `bun install` + Prisma generate + template deps — semua beres |
| 33 | **🧹 Cleanup** | dashboard | Hapus `package-lock.json`, buat `.env` |
| 34 | **`(r: any)` → Prisma type** | api | `activity-log.ts:71` — pake `Prisma.ActivityLogModel` |
| 35 | **`debug.ts` fix** | api | `any` → `unknown`, manual 404 → NotFoundError, hardcoded circuit → `getCircuitState()` |
| 36 | **`hashPassword()` helper** | api | Ekstrak ke `utils/auth.ts`, pake di register + resetPassword |
| 37 | **Rate limiter Map cleanup** | api | `setInterval` tiap 5 menit bersihin stale entries |
| 38 | **`todayKey()` cache** | api | Cache date string, refresh tiap 10 menit |
| 39 | **Shared `types.ts`** | dashboard | Centralize semua domain type di `src/types.ts`, hooks import + re-export |

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

~~Semua item di 🔴 Critical dan 🟡 Medium sudah diresolve.~~

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
| 5 | **Error handling UI** | Medium | Belum ada unified error toast / notification system |
| 6 | **Loading states** | Medium | Beberapa page belum punya skeleton loading |
| 7 | **Login auto-redirect** | Low | User yang sudah login seharusnya langsung redirect ke dashboard dari `/login` |

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
