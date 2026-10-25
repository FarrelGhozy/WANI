# Service: WAHA (WhatsApp HTTP API)

WhatsApp ditangani oleh **WAHA** (`devlikeapro/waha`), sebuah service Docker terpisah di `docker-compose.yml`. API berkomunikasi dengan WAHA lewat HTTP (`api/src/services/waha.ts`) dan tetap menjadi satu-satunya tempat logika bisnis. Tidak ada lagi paket bot terpisah maupun library socket WhatsApp di dalam repo.

---

## 1. Menjalankan

WAHA sudah termasuk dalam stack Compose. Untuk menjalankannya sendiri:

```bash
# produksi / stack utama
docker compose up -d waha

# lokal (WAHA di network host, dashboard & API dijalankan dengan Bun)
bun run dev:waha          # = docker compose -f docker-compose.local.yml up -d waha
```

Prasyarat: database `db` sehat dan `WAHA_API_KEY` sudah diisi di `.env` root (dipakai oleh API **dan** WAHA).

| Lingkungan | `WAHA_API_URL` | Port |
|------------|----------------|------|
| Docker Compose | `http://waha:3000/api` | internal `3000` (tidak dipublish) |
| Dev lokal | `http://localhost:3000/api` (default) | host `3000` via `docker-compose.local.yml` |

---

## 2. Peran & Batas

| Aspek | Penanggung jawab |
|-------|------------------|
| Koneksi ke WhatsApp, QR, pairing code, status sesi | WAHA |
| State autentikasi sesi & media WhatsApp | Database PostgreSQL milik WAHA (database `postgres`) |
| Mirror status sesi untuk dashboard (`WaSession`) | API |
| AI pipeline, order, guardrails, pengiriman balasan | API |

API **tidak** mengakses database internal WAHA. Semua interaksi lewat REST WAHA dengan header `X-Api-Key`.

---

## 3. Struktur Integrasi

| File | Peran |
|------|-------|
| `api/src/services/waha.ts` | Client WAHA: create/get session, sync status, ambil QR, pairing, reset, delete, `sendText` |
| `api/src/controllers/sessions.ts` | Handler HTTP dashboard + webhook pesan masuk |
| `api/src/routes/sessions.ts` | Definisi route `/api/sessions*` + auth |
| `api/src/models/wa-session.ts` | Akses tabel `WaSession` (mirror status per owner) |
| `api/src/config/env.ts` | Membaca `WAHA_API_URL` dan `WAHA_API_KEY` |

Nama sesi di WAHA mengikuti pola `store-<ownerId>`, sehingga satu toko memiliki satu sesi WhatsApp.

---

## 4. Endpoint API

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| `GET` | `/api/sessions` | 🔒 JWT | Ambil sesi milik owner (opsional filter `?status=`) |
| `POST` | `/api/sessions` | 🔒 JWT | Buat / ambil sesi WAHA untuk owner |
| `DELETE` | `/api/sessions` | 🔒 JWT | Logout + hapus sesi WAHA dan row `WaSession` |
| `POST` | `/api/sessions/sync` | 🔒 JWT | Sinkronkan status dari WAHA; refresh QR saat `SCAN_QR_CODE` |
| `POST` | `/api/sessions/reset` | 🔒 JWT | Logout, hapus, lalu buat sesi baru dari state bersih |
| `POST` | `/api/sessions/pairing` | 🔒 JWT | Body `{ phone }` → minta pairing code ke WAHA |
| `POST` | `/api/sessions/refresh-pairing` | 🔒 JWT | Minta ulang pairing code untuk nomor yang tersimpan |
| `POST` | `/api/sessions/messages` | Service API key (`sessions:messages`) | Webhook pesan masuk dari WAHA |

Autentikasi webhook memakai **managed API key** yang dibuat di dashboard (`/api/api-keys`). Untuk masa migrasi, `API_TOKEN` lama masih diterima bila `ALLOW_LEGACY_API_TOKEN=true` dan nilainya minimal 32 karakter.

---

## 5. Alur Pesan Masuk

```
Pesan WhatsApp
   │
   ▼
WAHA ──webhook──► POST /api/sessions/messages
                   (service API key, scope sessions:messages)
                        │
                        ├─ normalisasi payload WAHA
                        ├─ resolve owner (API key / nama sesi)
                        └─ processMessage() → AI pipeline
                              │
                              └─ balasan dikirim lewat WahaService.sendText()
```

Event non-pesan (mis. status/ack) diabaikan oleh webhook. Payload berbentuk WAHA (`{ event, session, payload }`) maupun bentuk lama (`{ phone, text }`) sama-sama diterima agar integrasi lama tidak langsung putus.

Detail pipeline: [../AI_PIPELINE.md](../AI_PIPELINE.md).

---

## 6. Lifecycle Sesi

| Aksi | Yang terjadi |
|------|--------------|
| **Connect** | API `POST /sessions` ke WAHA (`start: true`) → simpan `WaSession` (`waSessionName`, status) |
| **Scan QR** | Dashboard memanggil `POST /api/sessions/sync`; API mengambil QR `format=raw` dari WAHA dan menyimpannya di `WaSession.qr` |
| **Pairing code** | Dashboard `POST /api/sessions/pairing { phone }` → API memanggil endpoint pairing WAHA dan menyimpan kode |
| **Connected** | Status WAHA `WORKING`; QR lama dihapus dari `WaSession`, nomor disimpan |
| **Reset** | API logout + hapus sesi di WAHA, lalu membuat sesi baru dengan nama yang sama |
| **Disconnect** | API logout + hapus sesi WAHA, lalu menghapus row `WaSession` |

Status yang dipakai mengikuti enum WAHA: `STOPPED`, `STARTING`, `SCAN_QR_CODE`, `PASSKEY_REQUIRED`, `PASSKEY_CONFIRMATION_REQUIRED`, `WORKING`, `FAILED`.

---

## 7. Konfigurasi

### API

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `WAHA_API_KEY` | ✅ | Dikirim sebagai `X-Api-Key`; harus sama dengan nilai di service WAHA |
| `WAHA_API_URL` | — | Default `http://localhost:3000/api`; di Compose `http://waha:3000/api` |
| `ALLOW_LEGACY_API_TOKEN` | — | `true` untuk mengaktifkan `API_TOKEN` lama (min. 32 karakter) |
| `API_TOKEN` | — | Hanya dipakai bila legacy mode aktif |

### Service WAHA (diisi dari `.env` root)

| Variabel | Default Compose | Keterangan |
|----------|-----------------|------------|
| `WAHA_API_KEY` | — | API key yang divalidasi WAHA |
| `WHATSAPP_DEFAULT_ENGINE` | `GOWS` | Engine WhatsApp |
| `WHATSAPP_SESSIONS_POSTGRESQL_URL` | `postgres://…@db:5432/postgres` | State sesi disimpan di database `postgres` |
| `WAHA_MEDIA_STORAGE` / `WAHA_MEDIA_POSTGRESQL_URL` | `POSTGRESQL` | Media juga disimpan di database `postgres` |
| `WAHA_DASHBOARD_ENABLED` | `false` (prod) / `true` (lokal) | Dashboard bawaan WAHA |
| `WAHA_PRINT_QR` | `false` (prod) / `true` (lokal) | Cetak QR ke log WAHA |
| `WAHA_LOG_LEVEL` / `WAHA_LOG_FORMAT` | `info` (prod) / `debug` (lokal) / `PRETTY` | Logging WAHA |

---

## 8. Database

| Database | Isi |
|----------|-----|
| `wani_api` | Semua data bisnis + tabel `WaSession` (mirror status sesi) |
| `postgres` | State sesi/autentikasi dan media milik WAHA |

Database khusus bot sudah tidak ada. Lihat [../DATA_MODEL.md](../DATA_MODEL.md).

---

## 9. Test

```bash
cd api && bun run test
```

Cakupan terkait WAHA: `api/test/services/waha.test.ts` (client WAHA) dan `api/test/wa-session.test.ts` (model `WaSession`). Test integrasi pipeline dijalankan terpisah dengan `bun run test:e2e`.

---

## 10. Batasan yang Perlu Diketahui

- Satu owner = satu sesi WAHA (`store-<ownerId>`); multi-nomor per toko belum didukung.
- WAHA tidak dipublish ke host pada stack produksi — hanya API di network `wani` yang boleh menghubunginya.
- QR dan status selalu diambil ulang lewat `POST /api/sessions/sync`; dashboard tidak membuka koneksi langsung ke WAHA.
- `WAHA_API_KEY` bocor berarti siapa pun bisa mengendalikan sesi WhatsApp — perlakukan seperti kredensial produksi.
