# Deployment

Sistem dijalankan sebagai satu Docker Compose stack. Image produksi di-*build* dan di-*push* otomatis oleh GitHub Actions ke GHCR.

---

## 1. Ringkasan Stack

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| `db` | `postgres:17-alpine` | internal 5432 | `pgdata` |
| `api` | `ghcr.io/farrelghozy/wani-api:1.0.9` | `expose 3001` (internal) | `generated-sites`, `uploads` |
| `dashboard` | `ghcr.io/farrelghozy/wani-dashboard:1.0.10` | `5173:80` | — |
| `waha` | `devlikeapro/waha:latest` | internal `3000` (tidak dipublish) | state di database `postgres` |
| `backup` | `postgres:17-alpine` + `scripts/backup-db.sh` | — | `backups` |

Semua service berada di network bridge `wani`, memakai `restart: unless-stopped`, healthcheck, dan logging `json-file` dengan rotasi (`max-size: 10m`, `max-file: 3`).

> Nomor versi image di `docker-compose.yml` di-*pin*; setelah CI mem-push tag baru, update tag tersebut agar deploy ikut naik.

---

## 2. Deploy Pertama Kali

```bash
git clone <repo> && cd WANI
cp .env.example .env
# Wajib diisi: DATABASE_PASSWORD, WAHA_API_KEY, JWT_SECRET (openssl rand -hex 32),
#              LLM_API_KEY (atau OPENROUTER_API_KEY)
docker compose up -d
docker compose ps
curl -s localhost:5173            # dashboard
curl -s localhost:5173/api/health # API diakses lewat proxy dashboard
```

⚠️ **API tidak mem-publish port** (`expose`, bukan `ports`). Semua trafik masuk lewat dashboard/nginx:
`/api/*`, `/uploads/*`, `/s/*` di-proxy ke `api:3001`. Untuk debugging dari host, pakai
`docker compose exec api bun -e "fetch('http://localhost:3001/api/health').then(r=>r.text()).then(console.log)"`.

### Database

`init-dbs.sh` dijalankan Postgres saat volume `pgdata` masih kosong dan membuat database `wani_api` (nama dapat diubah via `DATABASE_NAME`).

WAHA memakai database `postgres` pada server yang sama untuk state sesi/autentikasi dan media. Database khusus bot sudah tidak ada.

Migrasi **tidak** dijalankan manual: entrypoint `api/docker-entrypoint.sh` menjalankan `prisma migrate deploy` dalam loop sampai DB siap, lalu `exec` proses utama.

---

## 3. Development Compose

Untuk menjalankan WAHA saja di lokal (network host, port `3000`):

```bash
bun run dev:waha          # docker compose -f docker-compose.local.yml up -d waha
bun run dev               # WAHA + API + dashboard
```

`docker-compose.local.yml` hanya mendefinisikan service `waha`; API dan dashboard dijalankan langsung dengan Bun. Stack penuh tetap memakai `docker compose up --build` dari root.

---

## 4. Konfigurasi Produksi

Semua variabel diteruskan dari file `.env` root ke container. Daftar lengkap: [CONFIGURATION.md](CONFIGURATION.md).

| Wajib | Keterangan |
|-------|------------|
| `DATABASE_PASSWORD` | Password Postgres |
| `DATABASE_USER` | User Postgres |
| `DATABASE_NAME` | Nama database API (`wani_api`) |
| `PORT` | Port internal API (healthcheck memakai 3001) |
| `WAHA_API_KEY` | API key bersama API ↔ WAHA |
| `WAHA_API_URL` | `http://waha:3000/api` di Compose |
| `ALLOWED_ORIGINS` | Origin dashboard yang diizinkan CORS |
| `ALLOW_LEGACY_API_TOKEN` | `true` hanya selama migrasi ke managed API key |
| `API_TOKEN` | Legacy token (≥ 32 karakter) bila `ALLOW_LEGACY_API_TOKEN=true` |
| `JWT_SECRET` | Wajib di produksi; tanpa ini API melempar error |
| `LLM_API_KEY` (atau `OPENROUTER_API_KEY`) | Tanpa ini `/api/health` mengembalikan 503 |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_FALLBACK_MODEL` | Endpoint + model LLM |
| `VITE_API_URL` | Dashboard → `/api` (di-proxy nginx) |

API key untuk integrasi sebaiknya dibuat lewat dashboard (`/api/api-keys`) dengan scope `sessions:messages`; webhook WAHA memakai key tersebut.

Variabel guardrail (`RATE_LIMIT_*`, `MAX_*`, `DAILY_LLM_BUDGET`, `*_ENABLED`, `*_MODEL`) punya default aman — ubah sesuai kapasitas.

---

## 5. CI/CD (GitHub Actions)

| Workflow | Trigger path | Langkah | Push image |
|----------|--------------|---------|-----------|
| `api.yaml` | `api/**`, `web-gen/**` (push `main`, PR, tag `api-v*.*.*`) | install → `prisma generate` → `bun run test` → build & push | Ya (kecuali PR) |
| `dashboard.yaml` | `dashboard/**` (tag `dashboard-v*.*.*`) | install → `bun run lint` → `bun run test` → build & push | Ya (kecuali PR) |

Tag image: push ke `main` → `:<commit-sha>` + `:latest`; push tag semver → `:<versi>` + `:latest`.

Catatan penting:

- Perubahan `web-gen/**` **ikut memicu** workflow API karena image API membundel template web-gen.
- WAHA memakai image upstream `devlikeapro/waha:latest`; tidak ada workflow yang membangun image WAHA.
- CI tidak menjalankan `test:e2e` API maupun Vitest dashboard — jalankan lokal sebelum PR.

### Isi image

| Image | Detail build |
|-------|--------------|
| API | `oven/bun:1`; install api + web-gen (production); `prisma generate`; pre-build `build-fonts.ts` + `build-css.ts`; `bun build --target bun`; runner membawa `dist/`, `node_modules`, `prisma/`, `generated/`, serta `templates/` + `assets/` web-gen; entrypoint `migrate deploy` |
| Dashboard | build dashboard + `landingpage`, `ARG VITE_API_URL=/api` (juga ditulis ulang saat start lewat `/env.js`); runtime `nginx:alpine` + `default.conf` |
| WAHA | image upstream `devlikeapro/waha`, tanpa build lokal; state di database `postgres` |

---

## 6. Backup & Restore

Service `backup` menjalankan `scripts/backup-db.sh` setiap 24 jam (`while true; do /backup.sh; sleep 86400; done`):

- `pg_dump -Fc` untuk `wani_api` → `/backups/<db>_<YYYYmmdd_HHMMSS>.dump`
- State sesi/media WAHA berada di database `postgres` dan **tidak** ikut script backup ini
- Retensi default 7 hari (`RETENTION_DAYS`), file lebih lama dihapus otomatis
- Volume `backups` (tidak di-bind ke host)

Perintah praktis:

```bash
# Lihat daftar backup
docker compose exec backup ls -lh /backups

# Backup manual sekarang
docker compose exec backup /backup.sh

# Copy keluar container
docker compose cp backup:/backups ./backups-local

# Restore (contoh wani_api)
docker compose exec -T db pg_restore -U "$DATABASE_USER" -d wani_api --clean --if-exists \
  < backups-local/wani_api_20261022_030000.dump
```

Restore bersifat destruktif (`--clean --if-exists`) — pastikan sudah punya salinan terbaru dan service API dihentikan sementara agar tidak ada penulisan bersamaan.

---

## 7. Operasional Rutin

| Kebutuhan | Perintah |
|-----------|----------|
| Lihat log | `docker compose logs -f api` (atau `dashboard`, `waha`) |
| Update versi image | Ubah tag di `docker-compose.yml` → `docker compose pull && docker compose up -d` |
| Jalankan migrasi manual | `docker compose exec api bunx prisma migrate deploy` |
| Cek kesehatan | `docker compose ps` (kolom health) atau `GET /api/health` via dashboard |
| Reset sesi WhatsApp | Dari dashboard: Settings → WA Session → reset (API logout + hapus sesi WAHA, lalu buat sesi baru; nomor harus scan/pairing ulang) |
| Melihat QR | Buka Settings → WA Session; QR diambil lewat `POST /api/sessions/sync`. Di produksi `WAHA_PRINT_QR=false` |
| Prune volume lama | `docker volume prune` **hati-hati**: menghapus `pgdata` berarti kehilangan data `wani_api` dan state WAHA |

### Healthcheck yang terpasang

- `db`: `pg_isready`
- `api`: `fetch('/api/health')` (memerlukan DB + LLM key)
- `dashboard`: `wget -qO- http://localhost:80`
- `waha`: `wget -qO- http://127.0.0.1:3000/health`

---

## 8. Skalabilitas & Batasan

- **Satu instance API**: rate limit per pelanggan, state drift firewall, dan circuit breaker bersifat in-memory. Menjalankan lebih dari satu replika membuat perlindungan itu tidak konsisten dan `/s/latest` symlink tidak dibagi antar replika tanpa volume bersama.
- **Satu service WAHA**: state sesi disimpan di database `postgres`; jangan menjalankan dua instance WAHA dengan database berbeda untuk nomor yang sama.
- **WaSession per owner**: satu nomor WhatsApp per toko (`store-<ownerId>`); multi-nomor per toko belum didukung.
- **Uploads & generated-sites** disimpan di volume Docker; backup rutin hanya mencakup database. Sertakan volume `uploads`/`generated-sites` bila isinya penting.
- **`POST /api/website/publish`** hanya menandai status; tidak ada deployment ke hosting eksternal.
