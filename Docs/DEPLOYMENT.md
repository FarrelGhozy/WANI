# Deployment

Sistem dijalankan sebagai satu Docker Compose stack. Image produksi di-*build* dan di-*push* otomatis oleh GitHub Actions ke GHCR.

---

## 1. Ringkasan Stack

| Service | Image | Port | Volume |
|---------|-------|------|--------|
| `db` | `postgres:17-alpine` | internal 5432 | `pgdata` |
| `api` | `ghcr.io/farrelghozy/wani-api:1.0.9` | `expose 3001` (internal) | `generated-sites`, `uploads` |
| `dashboard` | `ghcr.io/farrelghozy/wani-dashboard:1.0.10` | `5173:80` | — |
| `wa-bot` | `ghcr.io/farrelghozy/wani-wa-bot:1.0.9` | tanpa port | — |
| `backup` | `postgres:17-alpine` + `scripts/backup-db.sh` | — | `backups` |

Semua service berada di network bridge `wani`, memakai `restart: unless-stopped`, healthcheck, dan logging `json-file` dengan rotasi (`max-size: 10m`, `max-file: 3`).

> Nomor versi image di `docker-compose.yml` di-*pin*; setelah CI mem-push tag baru, update tag tersebut agar deploy ikut naik.

---

## 2. Deploy Pertama Kali

```bash
git clone <repo> && cd WANI
cp .env.example .env
# Wajib diisi: POSTGRES_PASSWORD, API_TOKEN, JWT_SECRET (openssl rand -hex 32),
#              LLM_API_KEY (atau OPENROUTER_API_KEY)
docker compose up -d
docker compose ps
curl -s localhost:5173            # dashboard
curl -s localhost:3001/api/health # tidak diakses langsung dari host!
```

⚠️ **API tidak mem-publish port** (`expose`, bukan `ports`). Semua trafik masuk lewat dashboard/nginx:
`/api/*`, `/uploads/*`, `/s/*` di-proxy ke `api:3001`. Untuk debugging dari host, pakai
`docker compose exec api bun -e "fetch('http://localhost:3001/api/health').then(r=>r.text()).then(console.log)"`.

### Database

`init-dbs.sh` dijalankan Postgres saat volume `pgdata` masih kosong dan membuat **dua** database: `wani_api` dan `wa_bot` (nama dapat diubah via `DATABASE_NAME_API` / `DATABASE_NAME_BOT`).

Migrasi **tidak** dijalankan manual: entrypoint `api/docker-entrypoint.sh` dan `wa-bot/docker-entrypoint.sh` menjalankan `prisma migrate deploy` dalam loop sampai DB siap, lalu `exec` proses utama.

---

## 3. Development Compose

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Override ini:
- mengganti image dengan build lokal (`api/Dockerfile`, `dashboard/Dockerfile`, `wa-bot/Dockerfile`);
- mem-publish `3001:3001` untuk API;
- menetapkan `NODE_ENV=development` (mengaktifkan route `/api/debug/*` — jangan dipakai di publik).

---

## 4. Konfigurasi Produksi

Semua variabel diteruskan dari file `.env` root ke container. Daftar lengkap: [CONFIGURATION.md](CONFIGURATION.md).

| Wajib | Keterangan |
|-------|------------|
| `POSTGRES_PASSWORD` | Password Postgres |
| `DATABASE_USER` | User Postgres |
| `DATABASE_NAME_API`, `DATABASE_NAME_BOT` | Nama dua database |
| `API_PORT` | Port internal API (healthcheck memakai 3001) |
| `API_TOKEN` | Shared secret bot ↔ API |
| `JWT_SECRET` | Wajib di produksi; tanpa ini API melempar error |
| `LLM_API_KEY` (atau `OPENROUTER_API_KEY`) | Tanpa ini `/api/health` mengembalikan 503 |
| `LLM_BASE_URL`, `LLM_MODEL`, `LLM_FALLBACK_MODEL` | Endpoint + model LLM |
| `API_URL` | Dari container bot ke API (`http://api:3001`) |
| `VITE_API_URL` | Dashboard → `/api` (di-proxy nginx) |

`WABOT_DATABASE_URL` dibangun otomatis oleh compose dari variabel-variabel di atas; hanya perlu di-override bila DB bot berada di server lain.

Variabel guardrail (`RATE_LIMIT_*`, `MAX_*`, `DAILY_LLM_BUDGET`, `*_ENABLED`, `*_MODEL`) punya default aman — ubah sesuai kapasitas.

---

## 5. CI/CD (GitHub Actions)

| Workflow | Trigger path | Langkah | Push image |
|----------|--------------|---------|-----------|
| `api.yaml` | `api/**`, `web-gen/**` (push `main`, PR, tag `api-v*.*.*`) | install → `prisma generate` → `bun run test` → build & push | Ya (kecuali PR) |
| `dashboard.yaml` | `dashboard/**` (tag `dashboard-v*.*.*`) | install → `bun run lint` → `bun run test` → build & push | Ya (kecuali PR) |
| `wa-bot.yaml` | `wa-bot/**` (tag `wa-bot-v*.*.*`) | install → `prisma generate` → `bun run test` → build & push | Ya |

Tag image: push ke `main` → `:<commit-sha>` + `:latest`; push tag semver → `:<versi>` + `:latest`.

Catatan penting:

- Perubahan `web-gen/**` **ikut memicu** workflow API karena image API membundel template web-gen.
- `wa-bot.yaml` memakai `push: true` **tanpa syarat**, sehingga image bot juga di-push saat workflow berjalan untuk pull request (berbeda dari `api.yaml` dan `dashboard.yaml` yang memakai `push: ${{ github.event_name != 'pull_request' }}`).
- CI tidak menjalankan `test:e2e` API maupun Vitest dashboard — jalankan lokal sebelum PR.

### Isi image

| Image | Detail build |
|-------|--------------|
| API | `oven/bun:1`; install api + web-gen (production); `prisma generate`; pre-build `build-fonts.ts` + `build-css.ts`; `bun build --target bun`; runner membawa `dist/`, `node_modules`, `prisma/`, `generated/`, serta `templates/` + `assets/` web-gen; entrypoint `migrate deploy` |
| Dashboard | build dashboard + `landingpage`, `ARG VITE_API_URL=/api` (juga ditulis ulang saat start lewat `/env.js`); runtime `nginx:alpine` + `default.conf` |
| WA Bot | install production, `prisma generate`, `bun build` dengan `--external baileys` (dan beberapa dep berat); entrypoint `migrate deploy` |

---

## 6. Backup & Restore

Service `backup` menjalankan `scripts/backup-db.sh` setiap 24 jam (`while true; do /backup.sh; sleep 86400; done`):

- `pg_dump -Fc` untuk `wani_api` dan `wa_bot` → `/backups/<db>_<YYYYmmdd_HHMMSS>.dump`
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

Restore bersifat destruktif (`--clean --if-exists`) — pastikan sudah punya salinan terbaru dan service API/bot dihentikan sementara agar tidak ada penulisan bersamaan.

---

## 7. Operasional Rutin

| Kebutuhan | Perintah |
|-----------|----------|
| Lihat log | `docker compose logs -f api` (atau `dashboard`, `wa-bot`) |
| Update versi image | Ubah tag di `docker-compose.yml` → `docker compose pull && docker compose up -d` |
| Jalankan migrasi manual | `docker compose exec api bunx prisma migrate deploy` |
| Cek kesehatan | `docker compose ps` (kolom health) atau `GET /api/health` via dashboard |
| Reset sesi WhatsApp | Dari dashboard: Settings → WA Session → reset (server hanya menghapus sesi bot, nomor tetap harus scan/pairing ulang) |
| Membaca QR terbaru | `docker compose logs -f wa-bot` (QR juga dicetak ke terminal bot) |
| Prune volume lama | `docker volume prune` **hati-hati**: menghapus `pgdata` berarti kehilangan data |

### Healthcheck yang terpasang

- `db`: `pg_isready`
- `api`: `fetch('/api/health')` (memerlukan DB + LLM key)
- `dashboard`: `wget -qO- http://localhost:80`
- `wa-bot`: `kill -0 1` (memastikan proses utama hidup)

---

## 8. Skalabilitas & Batasan

- **Satu instance API**: rate limit per pelanggan, state drift firewall, dan circuit breaker bersifat in-memory. Menjalankan lebih dari satu replika membuat perlindungan itu tidak konsisten dan `/s/latest` symlink tidak dibagi antar replika tanpa volume bersama.
- **Satu instance bot**: state auth WhatsApp single-row (`Creds.id = "pairing"`) — dua bot akan saling menendang sesi.
- **WaSession global**: satu nomor WhatsApp untuk seluruh deployment, bukan per tenant.
- **Uploads & generated-sites** disimpan di volume Docker; backup rutin hanya mencakup database. Sertakan volume `uploads`/`generated-sites` bila isinya penting.
- **`POST /api/website/publish`** hanya menandai status; tidak ada deployment ke hosting eksternal.
