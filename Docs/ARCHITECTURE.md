# Arsitektur WANI

Dokumen ini menjelaskan bagaimana komponen-komponen WANI bekerja bersama. Untuk detail per paket lihat [SERVICES/](SERVICES/README.md).

---

## 1. Prinsip

1. **Satu otak, banyak muka.** Semua logika bisnis (AI, order, guardrails, generator) ada di `api/`. `wa-bot/` hanya transport WhatsApp, `dashboard/` hanya UI, `web-gen/` hanya render template.
2. **API adalah batas sistem.** Tidak ada paket lain yang menyentuh DB `wani_api` — hanya `api/`. `wa-bot/` punya DB sendiri (`wa_bot`) dan berbicara ke API lewat HTTP.
3. **Data per-pemilik (`ownerId`).** Setiap row yang bersifat bisnis dimiliki satu user. Satu exception: `WaSession` global (satu nomor WhatsApp dipakai bersama).
4. **Fail-open untuk guardrail non-kritis, fail-closed untuk auth.** Classifier/judge/grounding error → dianggap aman (fail-open). JWT/API_TOKEN salah → 401 (fail-closed).
5. **Typed end-to-end.** Bun + TypeScript `module: "Preserve"`, Zod untuk semua input, `import type` wajib (`verbatimModuleSyntax`).

---

## 2. Peta Komponen

| Komponen | Lokasi | Tanggung jawab |
|----------|--------|----------------|
| REST API | `api/src/` | Route, controller, model, schema, AI pipeline, guardrails, generator |
| Dashboard | `dashboard/src/` | UI admin `/app/*`, konsumsi REST API dengan JWT |
| Landing page | `landingpage/src/` | Halaman publik, dibundel dashboard di route `/` |
| WhatsApp bot | `wa-bot/src/` | Socket Baileys, auth state di Postgres, relay pesan |
| Web generator | `web-gen/src/` | Render template jadi static site + ZIP (library, di-import API) |
| PostgreSQL | `docker-compose.yml` (`db`) | Dua database: `wani_api` (API) & `wa_bot` (bot) |
| Backup service | `scripts/backup-db.sh` | `pg_dump -Fc` harian kedua DB, retensi 7 hari |

---

## 3. Alur Runtime

### 3.1 Pairing & status WhatsApp

```
bot start ──► makeWASocket ──qr──► print QR di terminal
                       └──────────► POST /api/qr {qr}           (Bearer API_TOKEN)
                                            │
dashboard ──poll GET /api/qr/status─────────┘  → render QR / status / nomor

sock "open" ──► DELETE /api/qr  +  POST /api/qr {status:"connected", phone}
```

Pairing tanpa scan QR: dashboard `POST /api/qr/pairing {phone}` menyimpan `pairingPhone`; bot mendeteksi lewat polling status, memanggil `sock.requestPairingCode(phone)`, lalu `POST /api/qr {pairingCode}`.

Reset sesi: dashboard `POST /api/qr/reset` menghapus row `WaSession` + tabel `Creds`/`SignalKey` di DB bot (via `WABOT_DATABASE_URL`). Bot mendeteksi status `disconnected` tanpa `phone` & `qr` → `sock.logout()` → restart socket bersih.

### 3.2 Pesan pelanggan → balasan AI

```
WA msg (notify, @s.whatsapp.net, bukan fromMe)
   │
   ├─ POST /api/chat {phone, name, text, waMsgId}      (Bearer API_TOKEN)
   │
   └─ api/src/ai/pipeline/processMessage()  ← 16 step: normalize → … → outboundPersister
        ├─ simpan Customer / Conversation / Message (inbound)
        ├─ guardrails: rate limit, PII scan, 3-tier firewall, budget
        ├─ bangun prompt (Store + Product + AiConfig) → LLM (OpenRouter-compatible)
        ├─ parse JSON → intent action (order/inquiry/greeting/…) 
        └─ output guardrails: sanitize → scan → redact → grounding
   │
   └─ respons { reply, intent, qrisImageUrl }
        ├─ reply dikirim via sock.sendMessage (image + caption bila QRIS)
        └─ pesan outbound BOT tersimpan di DB
```

Detail langkah: [AI_PIPELINE.md](AI_PIPELINE.md) · [GUARDRAILS.md](GUARDRAILS.md)

### 3.3 Balasan manusia (dashboard → WA)

Dashboard menulis `Message { role: "HUMAN" }` lewat `POST /api/conversations/:id/messages`. Bot mengambilnya lewat polling `GET /api/outgoing` (Bearer API_TOKEN, tiap `OUTGOING_POLL_INTERVAL` ms), mengirim ke WA, lalu `PATCH /api/outgoing/:id/delivered` — yang menandai `waMsgId = "sent-<id>"` sehingga pesan tidak terkirim dua kali.

Query `listOutgoing` mengambil maksimal 20 pesan dengan `waMsgId = null` dan `role = "HUMAN"` **atau** `msgType = "notification"`.

### 3.4 Generate & publikasi website

```
dashboard ──PUT /api/website (config: tema, hero, sosial, selectedProductIds)──► WebSite
          ──POST /api/website/generate {template}──► api/controllers/website.ts
                 ├─ ambil Store + Product (available, terfilter selectedProductIds) + stats Order
                 ├─ slug = gen-YYYYMMDD-HHmmss → output api/generated-sites/<slug>
                 └─ import("@web-gen/index.ts").generate(...)  → Astro build atau render HTML
          ──GET /api/website/download?slug=  ──► ZIP (archiver)
          ──POST /api/website/publish        ──► WebSite.published = true
preview: GET /s/<slug>  (express.static api/generated-sites) · GET /s/preview → redirect /s/latest/
```

`publish` **hanya menandai status** — tidak men-deploy apa pun dan tidak menyalin file.

---

## 4. Multi-tenancy

| Aspek | Keputusan | Konsekuensi |
|-------|-----------|-------------|
| Penanda pemilik | `ownerId: String` polos (tanpa relasi Prisma ke `User`) | Menghindari dependensi sirkular; pemisahan ditegakkan di layer model |
| Scoping | Hampir semua query di layer model memakai `ownerId` (`ownerFilter`, `ownerWhere`, `updateOwned`, `deleteOwned`). **Pengecualian yang masih ada:** `ConversationModel.setStatus(id)` dan `ConversationModel.touch(id)` meng-update berdasarkan `id` saja, dan `sendMessage` tidak memverifikasi kepemilikan percakapan | Perlu diperhatikan bila menambah endpoint yang menerima `id` dari klien |
| Unique | `User.email`, `Store.ownerId`, `AiConfig.ownerId`, `WebSite.ownerId`, `[ownerId, phone]` (Customer), `[ownerId, name]` (Category), `[ownerId, slug]` (WebsiteGeneration) | Satu toko/AI config/website per user |
| Endpoint publik | `getOwnerIdOrFirst(req)` — JWT bila ada, jika tidak user tertua di DB, fallback `"default"` | Dashboard publik tetap jalan tanpa login; bot memakai user pertama |
| Exception | `WaSession` single-row global (`id = "default"`) | Satu koneksi WhatsApp untuk semua tenant |
| `UsageCounter` | Global, tanpa `ownerId`, key `YYYY-MM-DD` | Budget harian berlaku untuk seluruh instalasi |

---

## 5. Middleware Chain API

Urutan pada `api/src/server.ts` (dari luar ke dalam):

```
metricsMiddleware           → hitung request Prometheus
helmet (CSP, HSTS, CORP)    → header keamanan
cors                        → semua origin
rateLimit global            → 120 req/menit/IP
rateLimit auth              → /api/auth/login|register 10 / 15 menit
rateLimit forgot-password   → 3 / jam
morgan → Winston            → access log
express.json                → body parser
/api → optionalJwt → routes → handler
errorHandler                → AppError → status + envelope JSON
static: /s (generated-sites), /uploads
404 handler                 → { status:"failure", message:"not found" }
```

`optionalJwt` mem-parse token bila ada dan **diam-diam mengabaikan** token invalid, sehingga `req.user` bisa `undefined` di endpoint publik.

---

## 6. Topologi Deploy

```
docker compose (network "wani")
├── db        postgres:17-alpine  + init-dbs.sh (wani_api, wa_bot)
├── api       ghcr.io/farrelghozy/wani-api:<tag>        expose 3001 (internal)
│             entrypoint: prisma migrate deploy → bun dist/index.js
│             volume: generated-sites, uploads
├── dashboard ghcr.io/farrelghozy/wani-dashboard:<tag>  port 5173:80
│             nginx serve SPA + proxy /api, /uploads, /s → api:3001
│             entrypoint menulis /env.js (window.__ENV__.API_URL)
├── wa-bot    ghcr.io/farrelghozy/wani-wa-bot:<tag>     tanpa port
│             entrypoint: prisma migrate deploy → bot
└── backup    postgres:17-alpine, loop 86400s: pg_dump kedua DB → volume backups
```

Detail & variabel: [DEPLOYMENT.md](DEPLOYMENT.md) · [CONFIGURATION.md](CONFIGURATION.md)

---

## 7. Keputusan Desain Penting

| Keputusan | Alasan |
|-----------|--------|
| Bot tidak query DB API; semua lewat HTTP | Batas keamanan jelas, API bisa diskalakan terpisah |
| Auth state WA di Postgres (`Creds` + `SignalKey`) | Sesi bot tahan restart container; tidak perlu volume file |
| `WaSession` global, bukan per-tenant | Satu nomor WA fisik = satu sesi; multi-nomor belum didukung |
| Pipeline berbentuk step bertipe (`Either`) | Tiap guardrail bisa gagal tanpa melempar exception; mudah dites per step |
| Guardrail LLM berbasis OpenRouter model cepat | Lebih murah/cepat dari model besar, cukup untuk klasifikasi biner |
| `optionalJwt` global | Endpoint publik tetap melayani dashboard (tanpa login) dan bot sekaligus |
| Generator di-import langsung (bukan microservice) | Tidak ada hop jaringan; `web-gen` tanpa akses DB |
