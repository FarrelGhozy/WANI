# Konfigurasi

Semua konfigurasi runtime lewat **environment variable**. Tidak ada file config tersembunyi selain `prisma.config.ts` (yang membaca env juga).

| Sumber template | Dipakai untuk |
|-----------------|---------------|
| `.env.example` (root) | Docker Compose (produksi & dev) |
| `api/.env.example` | Menjalankan API langsung dengan Bun di lokal |
| `dashboard/.env.example` | Menjalankan Vite dev server di lokal |
| `wa-bot` / `web-gen` | Membaca env yang sama dari shell / file `.env` paketnya |

---

## 1. Presedensi Konfigurasi LLM

```
AiConfig (DB, per ownerId)   ← paling tinggi: model, systemPrompt, temperature, maxTokens,
                               greetingMessage, knowledgeBase, isActive,
                               llmBaseUrl, llmApiKey, fallbackModel
        ↓ (field null/kosong → jatuh ke bawah)
Environment variable          LLM_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE, LLM_BASE_URL,
                              LLM_API_KEY / OPENROUTER_API_KEY, LLM_FALLBACK_MODEL
        ↓
Default di kode               src/config/env.ts
```

Detail: `llmCall` step memilih `aiConfig.model || env.ai.defaultModel`, `apiKey: aiConfig.llmApiKey || env.ai.llmApiKey`, dan `fallbackModel: aiConfig.fallbackModel || env.ai.fallbackModel`.

| Nilai default di `env.ts` | Nilai |
|---------------------------|-------|
| `LLM_BASE_URL` | `https://openrouter.ai/api/v1/chat/completions` |
| `LLM_MODEL` | `deepseek-v4-flash-free` |
| `LLM_FALLBACK_MODEL` | `north-mini-code-free` |
| `LLM_MAX_TOKENS` | `2048` |
| `LLM_TEMPERATURE` | `0.7` |
| API key | `LLM_API_KEY` → fallback `OPENROUTER_API_KEY` |

> Default `model` saat row `AiConfig` baru dibuat adalah `opencode/deepseek-v4-flash-free` (lihat `models/ai-config.ts`), sementara default schema Prisma & env adalah `deepseek-v4-flash-free`. Keduanya adalah slug provider, bukan hardcode endpoint — pastikan slug cocok dengan `LLM_BASE_URL` yang dipakai.

Header khusus dikirim otomatis bila `LLM_BASE_URL` mengandung `openrouter.ai`: `HTTP-Referer: https://wani.app` dan `X-Title: WANI`.

---

## 2. Environment Variable

### 2.1 Database & API (root `.env.example` + `api/.env.example`)

| Variabel | Default | Wajib | Keterangan |
|----------|---------|-------|------------|
| `POSTGRES_PASSWORD` | — | ✅ (compose) | Password user Postgres |
| `DATABASE_USER` | `postgres` | — | User Postgres |
| `DATABASE_HOST` | `db` (compose) / `localhost` (lokal) | — | Host Postgres |
| `DATABASE_PORT` | `5432` | — | Port Postgres |
| `DATABASE_NAME_API` / `DATABASE_NAME` | `wani_api` | — | DB untuk API |
| `DATABASE_NAME_BOT` / `DATABASE_NAME` | `wa_bot` | — | DB untuk bot |
| `DATABASE_PASSWORD` | — | ✅ (lokal) | Dipakai `prisma.config.ts` di lokal (compose memakai `POSTGRES_PASSWORD`) |
| `API_PORT` / `PORT` | `3001` | — | Port API (compose: `expose`, bukan publish) |
| `NODE_ENV` | `development` | — | `production` mematikan endpoint debug & mewajibkan `JWT_SECRET` |
| `API_TOKEN` | — | ✅ | Shared secret bot ↔ API (`Authorization: Bearer <API_TOKEN>`) |
| `JWT_SECRET` | — | ✅ produksi | Di dev, bila kosong dibuat acak per proses (token invalid setelah restart) |
| `JWT_EXPIRES` | `7d` | — | Masa berlaku token JWT |
| `WABOT_DATABASE_URL` | dibangun otomatis di compose | — | Hanya untuk fitur reset sesi WA (hapus `Creds`/`SignalKey`) |

### 2.2 LLM & Guardrails

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `LLM_BASE_URL` | OpenRouter chat completions | Root `.env.example` memakai OpenCode Zen, `api/.env.example` memakai OpenRouter |
| `LLM_API_KEY` | — | Kunci provider (wajib agar `/api/health` hijau & pipeline jalan) |
| `OPENROUTER_API_KEY` | — | Alias legacy, masih dibaca |
| `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_MAX_TOKENS`, `LLM_TEMPERATURE` | lihat §1 | Default LLM |
| `RATE_LIMIT_SHORT_MAX` / `RATE_LIMIT_SHORT_WINDOW_MS` | `8` / `30000` | Sliding window pendek per pelanggan |
| `RATE_LIMIT_LONG_MAX` / `RATE_LIMIT_LONG_WINDOW_MS` | `60` / `3600000` | Sliding window panjang per pelanggan |
| `MAX_INPUT_CHARS` | `4000` | Pesan masuk lebih panjang dipotong |
| `MAX_REPLY_CHARS` | `1500` | Balasan lebih panjang dipotong |
| `DAILY_LLM_BUDGET` | `2000` | Budget panggilan LLM per hari (global, key tanggal) |
| `CLASSIFIER_ENABLED` / `CLASSIFIER_MODEL` | `true` / `north-mini-code-free` | Tier 2 firewall |
| `JUDGE_ENABLED` / `JUDGE_MODEL` | `true` / `north-mini-code-free` | Tier 3 firewall |
| `GROUNDING_CHECK_ENABLED` / `GROUNDING_MODEL` | `true` / `north-mini-code-free` | Cek faktual output |

Semua nilai boolean memakai `1` / `true` (case-insensitive) sebagai `true`; angka non-valid jatuh ke default.

### 2.3 WhatsApp Bot

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `API_URL` | `http://api:3001` (compose) | Base URL API yang dipakai bot |
| `API_TOKEN` | — | Harus sama dengan API |
| `OUTGOING_POLL_INTERVAL` | `3000` | Interval polling `GET /api/outgoing` (ms) |
| `DATABASE_*` | — | DB `wa_bot` |

### 2.4 Dashboard

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `VITE_API_URL` | `/api` | Base URL API; urutan resolusi: `import.meta.env.VITE_API_URL` → `window.__ENV__.API_URL` → `/api` |

- **Dev lokal**: `dashboard/.env` → `VITE_API_URL=http://localhost:3001/api` (Vite dev server **tidak** mem-proxy `/api`).
- **Docker**: nginx mem-proxy `/api/`, `/uploads/`, `/s/` ke `api:3001`, dan `docker-entrypoint.sh` menulis `/env.js` berisi `window.__ENV__.API_URL`.

### 2.5 Email (SMTP, opsional)

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | port `587`, from `WANI <noreply@wani.app>` | Bila kosong, `sendEmail()` hanya mencatat log "skip" dan tetap sukses |

Dipakai oleh: verifikasi email (register & resend), reset password.

### 2.6 Lain-lain

| Variabel | Keterangan |
|----------|------------|
| `ASTRO_TELEMETRY_DISABLED=1` | Mematikan telemetri Astro saat build template (dipakai image API) |
| `OWNER_ID` | Dideklarasikan (commented) di `.env.example` bot, **tidak dibaca kode** — jangan diandalkan |

---

## 3. Contoh `.env` Minimum untuk Produksi

```dotenv
POSTGRES_PASSWORD=<acak>
DATABASE_USER=postgres
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME_API=wani_api
DATABASE_NAME_BOT=wa_bot

API_PORT=3001
API_TOKEN=<acak, sama untuk api & wa-bot>
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES=7d

LLM_BASE_URL=https://openrouter.ai/api/v1/chat/completions
LLM_API_KEY=<kunci>
LLM_MODEL=deepseek-v4-flash-free
LLM_FALLBACK_MODEL=north-mini-code-free

API_URL=http://api:3001
OUTGOING_POLL_INTERVAL=3000
VITE_API_URL=/api

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app password>
SMTP_FROM=WANI <noreply@wani.app>
```

> Compose produksi **tidak** memakai `docker-compose.dev.yml`; image diambil dari GHCR. Semua variabel di atas di-`${...}` dari file `.env` root — variabel yang tidak diisi akan menjadi string kosong di container.
