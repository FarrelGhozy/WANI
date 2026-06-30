# Analisis Mendalam — WANI Platform

> **Tanggal:** 2026-07-01
> **Cakupan:** api/, dashboard/, web-gen/, wa-bot/, docker-compose.yml, Docs/

---

## 1. Gambaran Arsitektur

WANI adalah platform omnichannel UMKM dengan 4 service independent (Bun + TypeScript) yang berbagi PostgreSQL backend:

```
┌──────────────┐  HTTP (Vite proxy)  ┌──────────────┐
│  Dashboard   │ ◄─────────────────► │  API Server  │
│  React 19    │    /api/* → :3001   │  Express 5   │
│  Vite 8      │                     │  port 3001   │
└──────────────┘                     └──────┬───────┘
                                             │ Bearer / JWT
                                             │ POST /api/chat
                                             │ POST/DELETE /api/qr
                                     ┌──────▼───────┐
                                     │   WA Bot     │
                                     │  Baileys 7   │
                                     │  Prisma 7    │
                                     └──────────────┘
```

### Tech Stack per Modul

| Layer | API | Dashboard | Web-Gen | WA-Bot |
|-------|-----|-----------|---------|--------|
| Runtime | Bun | Bun (Vite) | Bun | Bun |
| Framework | Express 5 | React 19 | Astro 7 | Baileys 7 |
| ORM | Prisma 7 | — | — | Prisma 7 |
| DB | PostgreSQL | — | — | PostgreSQL |
| CSS | — | Tailwind v4 | Tailwind v4 | — |
| AI | OpenRouter | — | — | — |
| Testing | bun:test | — | — | bun:test |

---

## 2. Analisis per Modul

### 2.1 API (`api/`) — 75% Kematangan

**Kekuatan:**
- Layered architecture (routes → controllers → models → Prisma) yang rapi
- AI Pipeline 18-step dengan guardrails berlapis (3-tier injection defense, PII scanner, rate limit, budget, grounding check)
- Circuit breaker + retry + fallback model untuk LLM calls
- 45 endpoint RESTful dengan Zod validation
- JWT + API token auth yang solid
- Debug tracer dengan ring buffer
- Error class hierarchy (AppError → BadRequestError, UnauthorizedError, etc.)

**Kelemahan Kritis:**
1. Password reset token dikembalikan di HTTP response (security leak)
2. `contextLoader.ts` — fallback businessName pakai nama model LLM, bukan nama toko
3. Stock tidak direstor saat order dicancel
4. `as any` usage di beberapa controller
5. Model name mismatch antara env.ts default vs DB default

**Test Coverage:**
- 16 test files, unit tests only
- Tidak ada integration tests (HTTP server, DB)
- Tidak ada E2E tests
- AI engine, circuit breaker, actions tidak di-test
- Coverage ~40%

### 2.2 Dashboard (`dashboard/`) — 65% Kematangan

**Kekuatan:**
- 11 halaman lengkap (Dashboard, Products, Orders, Customers, Settings, Website, Auth)
- Custom UI primitives (27 komponen) — tidak ada dependency UI library external
- Hooks-per-domain pattern dengan cancellation flags
- Client-side filtering/sorting yang baik
- Tailwind v4 + React Compiler
- Docker ready dengan nginx reverse proxy

**Kelemahan Kritis:**
1. **Zero test coverage** — 6,789 baris TypeScript/TSX tanpa test
2. `convLoading` selalu `false` — loading spinner conversation tidak pernah tampil
3. `ForgotPasswordPage` pakai mock `setTimeout` bukan API call
4. Duplicate data fetching karena hooks tidak dishare via Context
5. Duplicate upload logic di 4 komponen
6. `useWaStatus` polling dua kali (Layout + Dashboard)

### 2.3 Web-Gen (`web-gen/`) — 55% Kematangan

**Kekuatan:**
- Dual generation path: HTML templates (custom Mustache engine) + Astro templates
- 6 template designs (classic, modern, vibrant, cyberpunk, minimalist, default)
- Self-hosted fonts via Google Fonts downloader
- Tailwind CSS v4 build pipeline
- ZIP download dan publish flow
- Integrasi dengan API module via direct import

**Kelemahan Kritis:**
1. **Zero test coverage** — tidak ada satupun test
2. Hardcoded path ke `../../api/uploads/` — coupling filesystem
3. Tidak ada HTML escaping di template engine (XSS risk)
4. Dua sistem template parallel (Astro + HTML) — maintenance burden ganda
5. `bun install` dijalankan setiap kali generate (tidak ada caching)
6. Regex-based Tailwind config extraction — fragile
7. Build CSS sequential, tidak parallel

### 2.4 WA-Bot (`wa-bot/`) — 50% Kematangan

**Kekuatan:**
- Baileys 7 dengan persistent auth via Prisma
- QR code auto-push ke API
- Outgoing message polling
- Graceful shutdown handlers
- Docker ready

**Kelemahan Kritis:**
1. `.env` committed dengan live secrets — CRITICAL security risk
2. Recursive reconnect tanpa guard/debounce — memory leak
3. `process.exit(0)` race dengan async `sock.logout()`
4. Silent catch blocks di polling functions
5. Tidak ada Prisma disconnect di shutdown
6. Tidak ada health check di container
7. Tidak ada message deduplication

**Test Coverage:**
- 1 test file (whatsapp-auth.test.ts) — 11 test cases
- Tidak ada test untuk index.ts (main bot logic)
- Coverage ~15%

---

## 3. Security Analysis

### Temuan Kritis

| # | Issue | Modul | Severity |
|---|-------|-------|----------|
| 1 | Password reset token dikembalikan di HTTP response | api | **CRITICAL** |
| 2 | `.env` dengan live credentials committed ke git | wa-bot | **CRITICAL** |
| 3 | JWT secret hardcoded fallback `"wani-dev-secret-change-in-production"` | api | HIGH |
| 4 | HTML unescaped di template engine (potential XSS) | web-gen | HIGH |
| 5 | Tidak ada password complexity rules | api | MEDIUM |

### Positif
- Helmet CSP terkonfigurasi
- PII scanner/redactor untuk data Indonesia
- 3-tier injection defense
- API token + JWT double auth layer
- Rate limiting per customer
- Daily LLM budget tracking

---

## 4. Test Coverage Gap Analysis

| Modul | Unit | Integration | E2E | Total |
|-------|------|-------------|-----|-------|
| **api** | 40% | 0% | 0% | ~25% |
| **dashboard** | 0% | 0% | 0% | 0% |
| **web-gen** | 0% | 0% | 0% | 0% |
| **wa-bot** | 15% | 0% | 0% | ~10% |
| **TOTAL** | — | — | — | **<20%** |

Target: **80%+** (sesuai aturan testing)

---

## 5. Performance Analysis

### Bottlenecks Teridentifikasi

1. **Web-gen CSS build sequential** — 5 template × 60s = 5 menit
2. **`bun install` setiap generate website** — tidak ada cache
3. **Duplicate API calls** di dashboard karena hooks tidak dishare
4. **Dual `useWaStatus` polling** — 2 interval timer jalan bersamaan
5. **`useSettings` dipanggil di Layout** — fire di setiap navigasi
6. **Tidak ada connection pooling di WA-bot** (pool:1)
7. **Rate limiter in-memory** — reset saat restart

### Positif
- React Compiler untuk optimalisasi render
- Tailwind v4 dengan JIT (CSS minimal)
- Client-side filtering/sorting (tanpa API roundtrip)
- Static site generation (zero server runtime untuk website)
- Circuit breaker mencegah cascading failure

---

## 6. Missing Features (dari TODO.md + temuan baru)

### Backend (API)
- [ ] Email sending (forgot password)
- [ ] Refresh token mechanism
- [ ] RBAC granular permissions
- [ ] RAG / vector store untuk knowledgeBase
- [ ] Multi-store support
- [ ] Stock restoration on cancel
- [ ] Push webhook untuk outgoing messages

### Frontend (Dashboard)
- [ ] Skeleton loading states
- [ ] Unified error toast system
- [ ] Login auto-redirect
- [ ] Real forgot password flow

### Web-Gen
- [ ] Elegant template HTML
- [ ] Template caching
- [ ] Product search di HTML templates
- [ ] Dynamic features section

### WA-Bot
- [ ] Message deduplication
- [ ] Health check endpoint
- [ ] Session backup
- [ ] Reconnect backoff

### DevOps
- [ ] CI/CD pipeline (lint + typecheck + test + build)
- [ ] Monitoring / health checks
- [ ] Production build untuk dashboard
- [ ] Log aggregation

---

## 7. Rekomendasi Prioritas

### Immediate (Minggu 1)
1. Fix BUG-001: Password reset token leak
2. Fix BUG-008: `.env` committed — rotate semua credentials
3. Fix BUG-002: `convLoading` stuck false
4. Fix BUG-004: businessName fallback ke model LLM
5. Fix BUG-006: WA reconnect recursive leak
6. Fix BUG-007: process.exit race condition

### Short-term (Minggu 2-3)
7. Tambah test coverage ke 80% (mulai dari API)
8. Implementasi email sending
9. Fix stock restoration on cancel
10. Fix BUG-005: web-gen hardcoded path
11. Fix duplicate polling di dashboard

### Mid-term (Bulan 1-2)
12. RAG / vector store
13. Multi-store support
14. CI/CD pipeline
15. E2E tests untuk critical flows

### Long-term (Bulan 3+)
16. Production monitoring
17. Multi-tenant architecture
18. Analytics dashboard
