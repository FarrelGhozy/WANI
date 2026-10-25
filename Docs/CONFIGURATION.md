# Konfigurasi

Semua konfigurasi runtime lewat **environment variable**. Tidak ada file config tersembunyi selain `prisma.config.ts` (yang membaca env juga).

| Sumber template | Dipakai untuk |
|-----------------|---------------|
| `.env.example` (root) | Docker Compose (produksi & dev) — dipakai API **dan** WAHA |
| root `.env` (API lokal) | Disalin/dibaca API saat dijalankan langsung dengan Bun (`bun --env-file=../.env`) |
| `dashboard/.env.example` | Menjalankan Vite dev server di lokal |
| `web-gen` | Membaca env yang sama dari shell / file `.env` paketnya |

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

### 2.1 Database & API (root `.env.example`)

| Variabel | Default | Wajib | Keterangan |
|----------|---------|-------|------------|
| `DATABASE_PASSWORD` | — | ✅ | Password user Postgres (dipakai `db`, `api`, `waha`, `backup`) |
| `DATABASE_USER` | `postgres` | — | User Postgres |
| `DATABASE_HOST` | `db` (compose) / `localhost` (lokal) | — | Host Postgres |
| `DATABASE_PORT` | `5432` | — | Port Postgres |
| `DATABASE_NAME` | `wani_api` | — | DB untuk API. WAHA memakai database `postgres` di server yang sama |
| `PORT` | `3001` | — | Port API (compose: `expose`, bukan publish) |
| `NODE_ENV` | `development` | — | `production` mematikan endpoint debug & mewajibkan `JWT_SECRET` |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://wani.app,https://wani.utc.web.id` | — | Allowlist CORS (dipisah koma) |
| `ALLOW_LEGACY_API_TOKEN` | `false` | — | `true` mengaktifkan `API_TOKEN` lama untuk endpoint service |
| `API_TOKEN` | — | — | Legacy shared secret (min. 32 karakter); hanya berlaku bila `ALLOW_LEGACY_API_TOKEN=true` |
| `JWT_SECRET` | — | ✅ produksi | Di dev, bila kosong dibuat acak per proses (token invalid setelah restart) |
| `JWT_EXPIRES` | `7d` | — | Masa berlaku token JWT |

**Managed API key** untuk integrasi (termasuk webhook WAHA) dibuat lewat `POST /api/api-keys` dan disimpan di tabel `ApiKey`, bukan di env. Scope yang tersedia: `sessions:messages`, `sessions:qr`, `chat:write`, `outgoing:read`, `outgoing:write`. Webhook `/api/sessions/messages` membutuhkan scope `sessions:messages`.

> **Validasi startup (produksi).** Saat `NODE_ENV=production`, API menolak start bila `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, atau `JWT_SECRET` kosong. `JWT_SECRET` juga harus ≥ 32 karakter dan bukan nilai contoh (`change-me…`). `DATABASE_PASSWORD` dan `WAHA_API_KEY` tidak boleh memakai placeholder dari `.env.example`.

### 2.2 LLM & Guardrails

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `LLM_BASE_URL` | OpenRouter chat completions | Root `.env.example` memakai OpenCode Zen; ganti ke OpenRouter bila perlu |
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

### 2.3 WhatsApp (WAHA)

API dan WAHA membaca **root `.env` yang sama**; Compose meneruskan variabel yang dibutuhkan ke masing-masing container.

| Variabel | Default | Wajib | Keterangan |
|----------|---------|-------|------------|
| `WAHA_API_KEY` | — | ✅ | Shared key API ↔ WAHA; API mengirim `X-Api-Key`, WAHA memvalidasinya |
| `WAHA_API_URL` | `http://localhost:3000/api` (lokal) / `http://waha:3000/api` (Compose) | — | Base URL REST WAHA |
| `WHATSAPP_DEFAULT_ENGINE` | `GOWS` | — | Engine WhatsApp di service WAHA |
| `WHATSAPP_SESSIONS_POSTGRESQL_URL` | `postgres://…@db:5432/postgres` | — | State sesi/autentikasi WAHA (database `postgres`) |
| `WAHA_MEDIA_STORAGE` / `WAHA_MEDIA_POSTGRESQL_URL` | `POSTGRESQL` / `…/postgres` | — | Penyimpanan media WAHA |
| `WAHA_DASHBOARD_ENABLED` | `false` (prod) / `true` (lokal) | — | Dashboard bawaan WAHA |
| `WAHA_DASHBOARD_USERNAME` / `WAHA_DASHBOARD_PASSWORD` | `admin` / — | — | Kredensial dashboard WAHA (lokal) |
| `WAHA_PRINT_QR` | `false` (prod) / `true` (lokal) | — | Cetak QR ke log WAHA |
| `WAHA_LOG_LEVEL` / `WAHA_LOG_FORMAT` | `info` (prod) / `debug` (lokal) / `PRETTY` | — | Logging WAHA |

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
| `TZ` | Zona waktu container WAHA (default Compose `Asia/Jakarta`) |

---

## 3. Contoh `.env` Minimum untuk Produksi

```dotenv
DATABASE_PASSWORD=<acak>
DATABASE_USER=postgres
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=wani_api

PORT=3001
ALLOWED_ORIGINS=https://wani.app,https://wani.utc.web.id
ALLOW_LEGACY_API_TOKEN=false
# API_TOKEN=<acak ≥32 karakter>   # hanya selama migrasi ke managed API key
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES=7d

WAHA_API_KEY=<uuid tanpa dash>
WAHA_API_URL=http://waha:3000/api

LLM_BASE_URL=https://openrouter.ai/api/v1/chat/completions
LLM_API_KEY=<kunci>
LLM_MODEL=deepseek-v4-flash-free
LLM_FALLBACK_MODEL=north-mini-code-free

VITE_API_URL=/api

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<email>
SMTP_PASSWORD=<app password>
SMTP_FROM=WANI <noreply@wani.app>
```

> Compose produksi memakai `docker-compose.yml`; image diambil dari GHCR. Semua variabel di atas di-`${...}` dari file `.env` root — variabel yang tidak diisi akan menjadi string kosong di container. `WAHA_API_URL` di-set langsung oleh Compose ke `http://waha:3000/api`.
