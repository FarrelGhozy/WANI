# WANI — WhatsApp Niaga

## PENGEMBANGAN PLATFORM DIGITAL OMNICHANNEL BERBASIS AI UNTUK PEMBERDAYAAN UMKM

WANI (WhatsApp Niaga) adalah platform omnichannel berbasis AI yang dirancang untuk memberdayakan UMKM Indonesia. Dengan integrasi chatbot WhatsApp cerdas, dashboard manajemen toko, dan website generator otomatis, WANI membantu pelaku UMKM mengelola bisnis secara modern, efisien, dan profesional dalam satu ekosistem terpadu.

![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=000)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=fff)
![Express](https://img.shields.io/badge/Express_5-000?logo=express&logoColor=fff)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=fff)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-4169E1?logo=postgresql&logoColor=fff)
![Baileys](https://img.shields.io/badge/Baileys_6-25D366?logo=whatsapp&logoColor=fff)
![Astro](https://img.shields.io/badge/Astro_7-BC52EE?logo=astro&logoColor=fff)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)
![OpenCode Zen](https://img.shields.io/badge/OpenCode_Zen-000?logo=lightning&logoColor=fff)

Platform omnichannel UMKM dengan AI chatbot WhatsApp, dashboard manajemen, dan website generator. Empat service independent (Bun + TypeScript) berbagi PostgreSQL backend.

> **🌐 Live Demo:** [https://wani.utc.web.id/](https://wani.utc.web.id/)

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
                                     │  Baileys 6   │
                                     │  Prisma 7    │
                                     └──────────────┘
```

## Prerequisites

- **Bun 1.3+**
- **PostgreSQL 17** — dua database: `wani_api` (api) + `wa_bot` (wa-bot)
- **OpenCode Zen API key** (gratis) — untuk AI pipeline

---

## Quick Start — Docker

Cara termudah: semua service berjalan di container.

```bash
cp .env.example .env
# Edit .env: isi POSTGRES_PASSWORD, JWT_SECRET, LLM_API_KEY
docker compose up --build
```

| Service | Port | Akses |
|---------|------|-------|
| Dashboard | `5173` | http://localhost:5173 |
| API | `3001` | http://localhost:3001 |
| PostgreSQL | `5432` | internal |

Database `wani_api` + `wa_bot` dibuat otomatis via `init-dbs.sh`.

> **Catatan:** wa-bot akan otomatis connect ke API setelah API siap. QR code muncul di terminal wa-bot dan dashboard.

### Docker Environment Variables

Semua konfigurasi lewat `.env` (root project). Lihat [`.env.example`](.env.example) untuk daftar lengkap.

| Variable | Wajib | Default | Deskripsi |
|----------|-------|---------|-----------|
| `POSTGRES_PASSWORD` | ✅ | — | Password PostgreSQL |
| `DATABASE_USER` | | `postgres` | User PostgreSQL |
| `API_TOKEN` | ✅ | — | Shared secret bot↔API auth |
| `JWT_SECRET` | ✅ | — | Secret untuk JWT auth |
| `LLM_API_KEY` | ✅ | — | API key OpenCode Zen (dapat gratis di opencode.ai) |
| `LLM_MODEL` | | `opencode/deepseek-v4-flash-free` | Model utama |

---

## Manual Setup

### 1. Clone & Install dependencies

```bash
cd api && bun install
cd ../dashboard && bun install
cd ../web-gen && bun install
cd ../wa-bot && bun install
```

### 2. Setup environment variables

Setiap subproject punya `.env.example` — copy ke `.env` masing-masing:

```bash
cp api/.env.example api/.env
cp wa-bot/.env.example wa-bot/.env
```

**`api/.env`** — isi minimal:

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `DATABASE_PASSWORD` | `postgres` | Password PostgreSQL |
| `API_TOKEN` | `rahasia123` | Shared secret |
| `JWT_SECRET` | `jwt-rahasia456` | Secret JWT |
| `LLM_API_KEY` | `sk-xxx` | API key OpenCode Zen |

**`wa-bot/.env`**:

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `DATABASE_PASSWORD` | `postgres` | Sama dengan API |
| `API_TOKEN` | `rahasia123` | **Harus sama** dengan API |
| `API_URL` | `http://localhost:3001` | URL API server |

### 3. Buat database

```bash
createdb -U postgres wani_api
createdb -U postgres wa_bot
```

### 4. Jalankan migrasi Prisma

```bash
cd api   && bun run prisma:migrate
cd ../wa-bot && bun run prisma:migrate
```

### 5. Start services (urutan penting)

```bash
# Terminal 1 — API server
cd api && bun run src/index.ts
# → http://localhost:3001

# Terminal 2 — WhatsApp bot (tunggu API nyala)
cd wa-bot && bun run src/index.ts
# → QR code di terminal, scan dengan WhatsApp

# Terminal 3 — Dashboard
cd dashboard && bun run dev
# → http://localhost:5173
```

---

## Project Structure

```
WANI/
├── api/            Express 5 + Prisma 7 — REST server + AI pipeline + guardrails
├── dashboard/      React 19 + Vite 8 — frontend UI
├── web-gen/        Bun + Astro 7 — static site generator UMKM
├── wa-bot/         Baileys 6 + Prisma 7 — WhatsApp bot
├── docker-compose.yml
├── .env.example
└── init-dbs.sh
```

### API (`api/`)

Express 5 dengan layered architecture: routes → controllers → models → Prisma → PostgreSQL. Fitur utama:

- **AI Pipeline 18-step** — normalize → guardrails 3-tier → LLM (OpenCode Zen) → intent handler → output scan
- **Circuit breaker** — 3 gagal beruntun → open 60s → half-open → retry
- **Guardrails** — PII scanner, rate limit, budget tracker, injection defense (regex + classifier + LLM judge), output grounding
- **Full CRUD** — Products, Categories, Orders, Customers, Conversations, Store Payment Methods
- **Auth** — JWT (login/register) + API Token (bot)
- **~55 endpoints** — lihat [ARSITEKTUR.md](api/ARSITEKTUR.md) untuk daftar lengkap

### Dashboard (`dashboard/`)

React 19 + Vite 8 (Rolldown) + TypeScript 6. React Compiler via Babel plugin.

| Halaman | Fitur |
|---------|-------|
| Dashboard | Statistik toko + warning banner pembayaran |
| Products | CRUD produk, filter kategori, list/grid view |
| Orders | Daftar + detail pesanan, update status + konfirmasi pembayaran |
| Customers | Daftar + detail pelanggan, chat inline |
| Settings | Profil toko, AI config, WA session, pembayaran |
| Website | Konfigurasi + generate website UMKM |

Semua hooks panggil real API (`fetchApi()` via Vite proxy `/api/*` → `localhost:3001`).

### WA Bot (`wa-bot/`)

Baileys 6 WhatsApp Web client dengan PostgreSQL persistent auth.

- QR code → POST ke API + print terminal
- Auto-reconnect (kecuali explicit logout)
- Forward pesan ke `POST /api/chat` → kirim balasan AI
- Deteksi URL QRIS di reply → kirim sebagai image message

### Web-Gen (`web-gen/`)

Static site generator UMKM — Astro 7 templates → HTML/CSS/JS statis. Bisa generate, preview, download ZIP, dan publish.

---

## API Reference

Semua response format:

```json
{ "status": "success"|"failure", "message": "...", "data": null | {} | [] }
```

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| `GET` | `/api/qr` | — | QR code string |
| `GET` | `/api/qr/status` | — | Status koneksi + nomor HP |
| `POST` | `/api/qr` | 🔒 API_TOKEN | Push QR / update status |
| `DELETE` | `/api/qr` | 🔒 API_TOKEN | Clear QR (saat connect) |
| `POST` | `/api/chat` | 🔒 API_TOKEN | Proses pesan WA → AI reply |
| `GET` | `/api/store` | — | Profil toko + `hasPaymentMethods` |
| `PUT` | `/api/store` | 🔒 JWT | Update profil toko |
| `GET` | `/api/ai-config` | 🔒 JWT | Konfigurasi AI |
| `PUT` | `/api/ai-config` | 🔒 JWT | Update AI config |
| `GET` | `/api/products` | — | Daftar produk (paginated, searchable) |
| `GET` | `/api/products/:id` | — | Detail produk |
| `POST` | `/api/products` | 🔒 JWT | Tambah produk |
| `PUT` | `/api/products/:id` | 🔒 JWT | Update produk |
| `DELETE` | `/api/products/:id` | 🔒 JWT | Hapus produk |
| `GET` | `/api/products/categories` | — | Daftar kategori |
| `POST` | `/api/products/categories` | 🔒 JWT | Tambah kategori |
| `PUT` | `/api/products/categories/:id` | 🔒 JWT | Update kategori |
| `DELETE` | `/api/products/categories/:id` | 🔒 JWT | Hapus kategori |
| `GET` | `/api/orders` | — | Daftar pesanan |
| `GET` | `/api/orders/:id` | — | Detail pesanan + items + payment |
| `PUT` | `/api/orders/:id/status` | 🔒 JWT | Update status |
| `PUT` | `/api/orders/:id/notes` | 🔒 JWT | Update catatan |
| `PUT` | `/api/orders/:id/payment` | 🔒 JWT | Buat/update pembayaran |
| `GET` | `/api/customers` | — | Daftar pelanggan |
| `GET` | `/api/customers/:id` | — | Detail pelanggan |
| `PUT` | `/api/customers/:id` | 🔒 JWT | Update pelanggan |
| `GET` | `/api/conversations/:id` | — | Pesan percakapan |
| `PUT` | `/api/conversations/:id/status` | 🔒 JWT | Update status percakapan |
| `POST` | `/api/conversations/:id/messages` | 🔒 JWT | Kirim pesan HUMAN |
| `GET` | `/api/dashboard/stats` | — | Statistik dashboard |
| `GET` | `/api/logs` | — | Activity log (paginated) |
| `GET` | `/api/usage` | — | Counter LLM usage (hari ini) |
| `POST` | `/api/auth/register` | — | Register |
| `POST` | `/api/auth/login` | — | Login → JWT |
| `GET` | `/api/auth/me` | 🔒 JWT | Current user |
| `POST` | `/api/auth/logout` | — | Logout |
| `POST` | `/api/auth/forgot-password` | — | Generate reset token |
| `POST` | `/api/auth/reset-password` | — | Reset password |
| `GET` | `/api/store/payment-methods` | — | Daftar metode pembayaran |
| `POST` | `/api/store/payment-methods` | 🔒 JWT | Tambah metode bayar |
| `PUT` | `/api/store/payment-methods/:id` | 🔒 JWT | Edit metode bayar |
| `DELETE` | `/api/store/payment-methods/:id` | 🔒 JWT | Hapus metode bayar |
| `POST` | `/api/upload` | 🔒 JWT | Upload file (QRIS image) |
| `GET` | `/api/website` | — | Website config |
| `PUT` | `/api/website` | 🔒 JWT | Update website config |
| `POST` | `/api/website/generate` | 🔒 JWT | Generate static site |
| `GET` | `/api/website/download` | 🔒 JWT | Download ZIP |
| `POST` | `/api/website/publish` | 🔒 JWT | Tandai sebagai published |
| `GET` | `/s/:slug` | — | Serve generated static site |
| `GET` | `/api/debug/traces` | — | Pipeline traces (dev) |
| `GET` | `/api/debug/traces/:id` | — | Trace detail (dev) |
| `DELETE` | `/api/debug/traces` | — | Clear traces (dev) |
| `GET` | `/api/debug/status` | — | Server status (dev) |
| `POST` | `/api/debug/circuit/reset` | — | Reset circuit breaker (dev) |
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/metrics` | — | Prometheus metrics |
| `GET` | `/api/outgoing` | 🔒 API_TOKEN | List outgoing messages (wa-bot) |
| `PATCH` | `/api/outgoing/:id/delivered` | 🔒 API_TOKEN | Mark message delivered |

> 🔒 API_TOKEN = `requireAuth` (Bearer API_TOKEN), 🔒 JWT = `requireJwt` (JWT dari login)

---

## Data Model

### wani_api — 13 tabel

```
Store (single-row)
  ├── AiConfig (single-row)
  ├── WaSession (single-row)
  ├── WebSite (single-row)
  ├── StorePaymentMethod (multi-row)
  ├── Category ──→ Product ──→ OrderItem
  Customer ──→ Order ─────────────┘
  │    │         └── Payment
  │    └── Conversation ──→ Message
  User · ActivityLog · UsageCounter
```

### wa_bot — 2 tabel

| Tabel | Fungsi |
|-------|--------|
| `Creds` | AuthenticationCreds serialized JSON (persistent login) |
| `SignalKey` | Signal protocol keys Baileys |

### Enums

| Enum | Values |
|------|--------|
| `OrderStatus` | PENDING, CONFIRMED, PROCESSING, COMPLETED, CANCELLED |
| `PaymentMethod` | CASH, TRANSFER, QRIS, E_WALLET |
| `PaymentStatus` | PENDING, PAID, FAILED, REFUNDED |
| `MessageRole` | CUSTOMER, BOT, HUMAN |
| `ConversationStatus` | ACTIVE, RESOLVED, ARCHIVED, ESCALATED |

---

## AI Pipeline (18-step)

```
WA message → normalize → upsert customer+conv → dedup → persist → rate limit
→ PII scan → 3-tier injection defense (regex → classifier → LLM judge)
→ budget check → load context (store + products + ai config)
→ LLM (OpenCode Zen, circuit breaker, retry)
→ parse JSON output → handle intent (order/inquiry/greeting/complaint/escalate)
→ sanitize → output scan → PII redact → grounding check → record → reply
```

Detail lengkap: [`api/ARSITEKTUR.md`](api/ARSITEKTUR.md)

## Commands Reference

| Action | API | Dashboard | WA Bot | Web-Gen |
|--------|-----|-----------|--------|---------|
| Install | `bun install` | `bun install` | `bun install` | `bun install` |
| Run dev | `bun run src/index.ts` | `bun run dev` | `bun run src/index.ts` | — |
| Build | — | `bun run build` | — | `bun run build:template` |
| Type check | `bun run tsc --noEmit` | `bun run build` | — | `bun run tsc --noEmit` |
| Prisma generate | `bun run prisma:generate` | — | `bun run prisma:generate` | — |
| Prisma migrate | `bun run prisma:migrate` | — | `bun run prisma:migrate` | — |
| Prisma deploy | `bun run prisma:deploy` | — | `bun run prisma:deploy` | — |
| Test | `bun test` | — | — | — |

## Live Demo

Platform berjalan di **https://wani.utc.web.id/* — Dashboard production dengan real API backend.

## Architecture Docs

- [`api/ARSITEKTUR.md`](api/ARSITEKTUR.md) — API architecture, endpoints, AI pipeline, guardrails, database schema
- [`dashboard/ARCHITECTURE.md`](dashboard/ARCHITECTURE.md) — Component tree, routing, design system
- [`dashboard/API_SPEC.md`](dashboard/API_SPEC.md) — Full API contract spec (request/response shapes)

## Tautan

| Tautan | URL |
|--------|-----|
| Website Live Demo | [https://wani.utc.web.id/](https://wani.utc.web.id/) |
| Repository GitHub | [https://github.com/FarrelGhozy/WANI.git](https://github.com/FarrelGhozy/WANI.git) |
| Proposal Projek | [https://docs.google.com/document/d/1CSzb5ozLBQJIwKp_Wc98Wl4170_KCNQGNEyUAyXO7JI/edit?usp=sharing](https://docs.google.com/document/d/1CSzb5ozLBQJIwKp_Wc98Wl4170_KCNQGNEyUAyXO7JI/edit?usp=sharing) |
