# WANI — Project TODO

## Terimplementasi ✅

- **WA Session** — QR push/pull/clear/status, auto-reconnect
- **AI Pipeline (18-step)** — normalize → PII → rate limit → 3-tier firewall → budget → context → LLM → parse → intent → sanitize → output scan → PII redact → grounding → persist
- **Guardrails** — T1 regex injection, T2 classifier, T3 judge, PII scanner/redactor, rate limit, daily budget, output leak detection, grounding check, Unicode defense (NFKC + homoglyph + leetspeak)
- **Circuit Breaker** — 3 failures → 60s open → half-open → retry
- **Debug Tracer** — Ring buffer (500 cap), per-request TraceContext, duration tracking
- **Debug Routes** — GET /api/debug/traces, GET /api/debug/traces/:id, DELETE /api/debug/traces, GET /api/debug/status, POST /api/debug/circuit/reset
- **API Spec** — Lengkap dengan request/response shapes
- **Frontend (Dashboard)** — 5 pages (Dashboard, Products, Orders, Customers, Settings), mock-only hooks, React 19 + Vite 8 + Tailwind v4
- **Bot** — Baileys connect, QR terminal + API POST, forward messages to API, send reply back

## Belum / Sedang Dikerjakan 🔄

### Backend (API)

| # | Item | Prioritas | Catatan |
|---|------|-----------|---------|
| 1 | **Products CRUD** | High | Endpoints sudah di-spec, controller/model perlu dibuat |
| 2 | **Orders CRUD** + Payment | High | Endpoints sudah di-spec, perlu model + controller |
| 3 | **Customers CRUD** | High | Endpoints sudah di-spec, perlu model + controller |
| 4 | **Dashboard Stats** | Medium | Endpoint `/api/dashboard/stats` |
| 5 | **Conversations** | Medium | List, detail, update status, send human message |
| 6 | **Activity Log** | Medium | GET /api/logs (sudah ada ActivityLogModel) |
| 7 | **Usage Stats** | Low | GET /api/usage dari UsageCounter |
| 8 | **WA Settings** | Low | GET /api/qr/settings, POST /api/qr/disconnect |
| 9 | **Tests** (full coverage) | Medium | Unit test untuk pipeline, guardrails (67 tests exist) |
| 10 | **Embeddings / RAG** | Low | knowledgeBase masih plain text |

### Frontend (Dashboard)

Setelah API endpoint jadi, flip `MOCK = false` di tiap hook:
- `useProducts.ts` → Products CRUD
- `useOrders.ts` → Orders CRUD
- `useCustomers.ts` → Customers + Chat
- `useSettings.ts` → Store, AI Config, WA Session
- `useWaStatus.ts` → QR + status

### Deploy / Infra

| # | Item | Catatan |
|---|------|---------|
| 1 | Docker setup | 3 services (api, dashboard, bot) |
| 2 | PG migrations | prisma:migrate untuk production |
| 3 | CI/CD | Lint + test + build |
| 4 | Monitoring | Pipeline trace viewer di UI |
