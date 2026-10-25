# API Contract

Base URL: `http://<host>:3001/api` (semua endpoint di bawah `/api`, kecuali aset statis `/s/*` dan `/uploads/*`).

Kontrak ini mencerminkan route yang benar-benar ter-mount di `api/src/routes/index.ts`.

---

## 1. Format Respons

Selalu envelope JSON seragam (`api/src/utils/response.ts`):

```json
{ "status": "success", "message": "products retrieved", "data": { } }
```

- `status`: `"success"` bila HTTP < 400, `"failure"` bila ≥ 400.
- `data`: `null` bila tidak ada payload (mis. hasil DELETE).
- **Error validasi** → `400`, `message: "validation failed"`, `data` berisi array `issue` Zod.
- **Error internal** → `500`, `data: { stack }` **hanya** saat `NODE_ENV=development`.

| Kelas error | HTTP |
|-------------|------|
| `BadRequestError` | 400 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `InternalServerError` | 500 |
| Route tidak dikenal | 404 `"not found"` |

---

## 2. Model Auth

Empat tingkat, diterapkan per route:

| Tingkat | Header | Middleware | Dipakai oleh |
|---------|--------|-----------|--------------|
| **Publik** | opsional `Authorization: Bearer <jwt>` | `optionalJwt` (global) | Endpoint baca (GET) & halaman publik |
| **JWT** | `Authorization: Bearer <jwt>` wajib | `requireJwt` | Semua mutasi dashboard |
| **Service API key** | `Authorization: Bearer wani_sk_…` | `requireServiceAuth(scope)` | Webhook WAHA (`/sessions/messages`), integrasi service |
| **Legacy API_TOKEN** | `Authorization: Bearer <API_TOKEN>` | `requireServiceAuth(scope)` | Hanya bila `ALLOW_LEGACY_API_TOKEN=true` dan token ≥ 32 karakter |

Catatan penting:

- Managed API key dibuat lewat `/api/api-keys`, terikat ke owner, punya scope (`sessions:messages`, `sessions:qr`, `chat:write`, `outgoing:read`, `outgoing:write`), dan dapat dicabut.
- `optionalJwt` dipasang **global** di `/api`. Token invalid diabaikan tanpa error (bukan 401), sehingga `req.user` bisa `undefined` di endpoint publik.
- Endpoint publik memakai `getOwnerIdOrFirst(req)`: pakai `req.user.id` bila ada, jika tidak → **user tertua di DB**, jika DB kosong → `"default"`.
- `JWT_SECRET` kosong di dev → dibuat acak per proses (token lama jadi invalid setelah restart). Di produksi, API melempar error saat start bila `JWT_SECRET` tidak diset.
- `POST /api/auth/login` menolak akun dengan `emailVerified = false` → `403 "email not verified, please check your email"`.

### Rate limit

| Cakupan | Batas | Catatan |
|---------|-------|---------|
| Global (semua `/api`) | 120 req / menit / IP | `standardHeaders`, `legacyHeaders: false` |
| `/api/auth/login`, `/api/auth/register` | 10 / 15 menit / IP | Request sukses tidak dihitung (`skipSuccessfulRequests`) |
| `/api/auth/forgot-password` | 3 / jam / IP | Message: `"Too many password reset requests, please try again later"` |

> Selain itu ada rate limit **per pelanggan** di dalam AI pipeline (bukan HTTP) — lihat [GUARDRAILS.md](GUARDRAILS.md).

---

## 3. Endpoint

Keterangan auth: 🌐 publik (JWT opsional) · 🔒 JWT wajib · 🤖 service API key (atau legacy `API_TOKEN`)

### 3.1 WhatsApp Session (WAHA)

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/sessions` | 🔒 | Sesi owner; query opsional `status` (`STOPPED`/`STARTING`/`SCAN_QR_CODE`/`WORKING`/…) |
| POST | `/api/sessions` | 🔒 | Body `{ storeName }`; buat/ambil sesi WAHA (`store-<ownerId>`) |
| DELETE | `/api/sessions` | 🔒 | Logout + hapus sesi WAHA dan row `WaSession` |
| POST | `/api/sessions/sync` | 🔒 | Sinkronkan status dari WAHA; refresh QR saat `SCAN_QR_CODE` |
| POST | `/api/sessions/reset` | 🔒 | Logout + hapus sesi WAHA, lalu buat sesi baru dari state bersih |
| POST | `/api/sessions/pairing` | 🔒 | Body `{ phone }` (10–15 digit) → minta pairing code |
| POST | `/api/sessions/refresh-pairing` | 🔒 | Minta ulang pairing code untuk nomor yang tersimpan |
| POST | `/api/sessions/messages` | 🤖 `sessions:messages` | Webhook pesan masuk dari WAHA (lihat §3.2) |

Data sesi (`WaSession`) berisi `waSessionName`, `status`, `phone`, `qr`, `pairingPhone`, `pairingCode`, `lastSyncedAt`.

### 3.2 WhatsApp Webhook (WAHA → AI)

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/sessions/messages` | 🤖 `sessions:messages` | Pesan masuk dari WAHA; dijalankan lewat AI pipeline |

Body menerima bentuk webhook WAHA (`{ event, session, payload: { from, body, id } }`) atau bentuk legacy (`{ ownerId?, phone, name?, text, waMsgId? }`). Event non-pesan diabaikan.

Respons `200 "ok"`:

```json
{
  "status": "success",
  "message": "ok",
  "data": { "reply": "…", "intent": "order", "qrisImageUrl": "/uploads/qris-….png" }
}
```

`qrisImageUrl` bernilai `null` bila intent bukan order/QRIS. Owner di-resolve dari service API key; untuk payload legacy tanpa owner, API memakai `getOwnerIdOrFirst()` atau nama sesi `store-<ownerId>`.

### 3.3 Toko & Pembayaran

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/store` | 🌐 | Profil toko + `hasPaymentMethods: boolean` (dinamis) |
| PUT | `/api/store` | 🔒 | Body: `businessName, phone, logoUrl, address, businessHours, paymentMethods, shippingInfo, returnPolicy, isActive` |
| GET | `/api/store/payment-methods` | 🌐 | Semua metode milik owner (termasuk yang `isActive: false`), urut `sortOrder` |
| POST | `/api/store/payment-methods` | 🔒 | Discriminated union per `type` (lihat bawah); `label` dibuat otomatis bila kosong |
| PUT | `/api/store/payment-methods/:id` | 🔒 | Partial update (semua field opsional) |
| DELETE | `/api/store/payment-methods/:id` | 🔒 | |

`POST` body wajib sesuai `type`:

| `type` | Field wajib tambahan |
|--------|---------------------|
| `QRIS` | `qrImageUrl` |
| `BANK_TRANSFER` | `bankName`, `accountNumber`, `accountName` |
| `E_WALLET` | `providerName`, `phoneNumber` |
| `COD` | `instructions` |

Field opsional umum: `label`, `instructions`, `isActive`, `sortOrder`.

### 3.4 AI Config

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/ai-config` | 🔒 | `data` = config owner, `{}` bila belum ada |
| PUT | `/api/ai-config` | 🔒 | `isActive, systemPrompt, model, greetingMessage, knowledgeBase, maxTokens, temperature (0–2), llmBaseUrl, llmApiKey, fallbackModel` |

### 3.5 Produk & Kategori

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/products` | 🌐 | Query: `page` (1), `limit` (20), `search`, `categoryId`, `isAvailable` (`true`/`false`), `sort` (`name`/`price`/`stock`/`createdAt`/`updatedAt`), `order` (`asc`/`desc`) |
| GET | `/api/products/:id` | 🌐 | Detail produk |
| POST | `/api/products` | 🔒 | `name` (wajib), `categoryId`, `description`, `price` (wajib ≥ 0), `stock`, `isAvailable`, `imageUrl` |
| PUT | `/api/products/:id` | 🔒 | Partial |
| DELETE | `/api/products/:id` | 🔒 | |
| GET | `/api/products/categories` | 🌐 | `data: { items }` |
| POST | `/api/products/categories` | 🔒 | `{ name, description? }` |
| PUT | `/api/products/categories/:id` | 🔒 | |
| DELETE | `/api/products/categories/:id` | 🔒 | |

**Bentuk list** (semua endpoint list yang dipaginasi):

```json
{ "items": [ … ], "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
```

### 3.6 Order

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/orders` | 🌐 | Query: `page`, `limit`, `status` (`PENDING`/`CONFIRMED`/`PROCESSING`/`COMPLETED`/`CANCELLED`), `customerId`, `dateFrom`, `dateTo`, `sort` (`createdAt`/`updatedAt`/`totalAmount`/`status`), `order` |
| GET | `/api/orders/:id` | 🌐 | Termasuk `items`, `payment`, `customer` |
| PUT | `/api/orders/:id/status` | 🔒 | `{ status }`; transisi divalidasi: `PENDING→CONFIRMED\|CANCELLED`, `CONFIRMED→PROCESSING\|CANCELLED`, `PROCESSING→COMPLETED\|CANCELLED`, `COMPLETED`/`CANCELLED` final. Stok dipotong saat `CONFIRMED` dan dikembalikan saat `CANCELLED` — masing-masing sekali, dijaga flag `stockReleased` |
| PUT | `/api/orders/:id/notes` | 🔒 | `{ notes }` |
| PUT | `/api/orders/:id/payment` | 🔒 | `{ method, amount, status, paidAt? }` — upsert (create bila belum ada) |

### 3.7 Pelanggan & Percakapan

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/customers` | 🌐 | Query: `page`, `limit`, `search`, `sort` (`createdAt`/`updatedAt`/`name`/`totalOrders`), `order` |
| GET | `/api/customers/:id` | 🔒 | Detail pelanggan |
| PUT | `/api/customers/:id` | 🔒 | `{ name?, notes? }` |
| GET | `/api/conversations/:id` | 🔒 | `data: { id, messages: [{ id, role, content, msgType, waMsgId, metadata, createdAt }] }` (100 pesan terakhir) |
| PUT | `/api/conversations/:id/status` | 🔒 | `{ status: ACTIVE \| RESOLVED \| ARCHIVED \| ESCALATED }` |
| POST | `/api/conversations/:id/messages` | 🔒 | `{ text }` → `201 "message sent"`; pesan disimpan sebagai `role: "HUMAN"` |

### 3.8 Dashboard, Log & Usage

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/dashboard/stats` | 🔒 | `{ ordersToday, ordersPending, productsActive, customersTotal, conversationsActive, qr: { qr, status, phone } }` |
| GET | `/api/logs` | 🔒 | Query: `page`, `limit`, `type`, `referenceId`, `dateFrom`, `dateTo`, `sort`, `order` |
| GET | `/api/usage` | 🔒 | Counter LLM harian **global** (tidak per owner) |

### 3.9 Auth

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/auth/register` | 🌐 | `{ name, email, password (≥8) }` → `201 "registration successful, please check your email"`; otomatis membuat `Store` + mengirim email verifikasi |
| POST | `/api/auth/login` | 🌐 | `{ email, password }` → `{ token, user }`; `403` bila email belum diverifikasi |
| GET | `/api/auth/me` | 🔒 | Data user publik (`id, name, email, role, createdAt`) |
| POST | `/api/auth/logout` | 🌐 | Stateless JWT — server hanya membalas `"logged out"` |
| GET | `/api/auth/verify-email?token=` | 🌐 | Verifikasi email (token berlaku 24 jam) |
| POST | `/api/auth/resend-verification` | 🌐 | `{ email }`; selalu `"verification email sent"` (anti-enumeration) |
| POST | `/api/auth/forgot-password` | 🌐 | `{ email }`; selalu `"reset link sent"` (anti-enumeration), token berlaku 1 jam |
| POST | `/api/auth/reset-password` | 🌐 | `{ token, password (≥8) }` |

Email dikirim via SMTP; bila `SMTP_*` kosong, `sendEmail()` melewati pengiriman tanpa error.

### 3.10 Website

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/website` | 🌐 | `data` = `WebSite.config` (`{}` bila belum ada) |
| PUT | `/api/website` | 🔒 | `heroHeadline, heroSubheadline, aboutText, primaryColor, secondaryColor, phone, selectedProductIds, template, theme (classic\|modern\|vibrant\|elegant), contactEmail, contactMapsUrl, socialMedia, heroImageUrl, aboutImageUrl, logoUrl, faviconUrl, ctaText` |
| POST | `/api/website/generate` | 🔒 | `{ template }` (default `"default"`) → `{ slug, outputPath }`; slug `gen-YYYYMMDD-HHmmss` |
| GET | `/api/website/download?slug=` | 🔒 | ZIP; tanpa `slug` → generation terbaru owner. `404` bila belum ada |
| POST | `/api/website/publish` | 🔒 | Menandai `WebSite.published = true` untuk generation terbaru — **tidak** men-deploy/menyalin file. `404` bila belum ada generation atau foldernya hilang |
| GET | `/api/website/generations` | 🔒 | Riwayat generation owner |
| DELETE | `/api/website/generations/:id` | 🔒 | Hapus row + folder slug; symlink `latest` dipindah ke generation sebelumnya |

### 3.11 Upload

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/upload` | 🔒 | `multipart/form-data`, field `file` (PNG/JPEG/WebP, maks 2 MB), optional `prefix` (huruf/angka) → `201 { url: "/uploads/<prefix>-<uuid>.<ext>" }` |

### 3.12 API Keys

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/api-keys` | 🔒 | `data: { items }` — key milik owner (tanpa secret) |
| POST | `/api/api-keys` | 🔒 | Body `{ name, scopes[], expiresInDays (1–365) }` → `data: { apiKey, token }`; token hanya ditampilkan sekali |
| DELETE | `/api/api-keys/:id` | 🔒 | Cabut key (`revokedAt`) |

### 3.13 Monitoring

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/health` | 🌐 | `200 "healthy"` bila DB reachable **dan** `LLM_API_KEY` (atau `OPENROUTER_API_KEY`) terisi; jika tidak → `503 "unhealthy"` dengan `data.checks` |
| GET | `/api/metrics` | 🌐 | `text/plain`, format Prometheus (`prom-client`) |

### 3.14 Debug (hanya `NODE_ENV !== "production"`)

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| GET | `/api/debug/traces` | — | Trace pipeline terbaru |
| GET | `/api/debug/traces/:id` | — | Detail trace |
| DELETE | `/api/debug/traces` | — | Bersihkan trace |
| GET | `/api/debug/status` | — | Status circuit breaker & tracer |
| POST | `/api/debug/circuit/reset` | — | Reset circuit breaker |

> ⚠️ Route debug **tanpa auth apa pun**. Jangan pernah mengaktifkan `NODE_ENV` selain `production` di deployment publik.

---

## 4. Aset Statis (di luar `/api`)

| Path | Isi |
|------|-----|
| `GET /s/:slug` | Static site hasil generate (`generated-sites/<slug>`) |
| `GET /s/preview` | Redirect ke `/s/latest/` |
| `GET /uploads/:file` | File hasil upload (QRIS, logo, gambar produk/hero) |

---

## 5. Contoh Alur Lengkap

```bash
# 1. Login
curl -s -X POST localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"toko@example.com","password":"rahasia123"}'
# → data.token

# 2. Simpan AI config
curl -s -X PUT localhost:3001/api/ai-config \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"model":"deepseek-v4-flash-free","systemPrompt":"Kamu CS ramah."}'

# 3. WAHA mengirim webhook pesan pelanggan
curl -s -X POST localhost:3001/api/sessions/messages \
  -H "Authorization: Bearer $SERVICE_API_KEY" -H 'Content-Type: application/json' \
  -d '{"event":"message","session":"store-<ownerId>","payload":{"from":"628123456789@c.us","body":"pesan kopi 2","id":"ABC123"}}'
# → data.reply, data.intent, data.qrisImageUrl

# 4. Cek status sesi WhatsApp
curl -s localhost:3001/api/sessions -H "Authorization: Bearer $TOKEN"
```

---

## 6. Perubahan yang Sudah Usang di Dokumentasi Lama

| Klaim lama | Realitas sekarang |
|-----------|-------------------|
| `GET /api/store` butuh JWT | Publik (JWT opsional) |
| `GET /api/ai-config` publik | 🔒 JWT |
| `/api/products/categories` tanpa auth untuk POST/PUT/DELETE | 🔒 JWT |
| Dashboard memanggil `/login`, `/products` | Sekarang `/app/login`, `/app/products`, dst. |
| ~40 endpoint | 60+ endpoint (termasuk auth, website generations, sessions, api-keys, monitoring, debug) |
| Pipeline 18 langkah | **16 step** bertipe |
| `Store`/`WebSite` single-row `id="default"` | Sekarang UUID + `ownerId @unique` |
| Sesi WhatsApp di endpoint QR lama | Sekarang `/api/sessions*` lewat WAHA |
