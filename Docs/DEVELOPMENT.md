# Development

Panduan menyiapkan lingkungan, menjalankan, mengetes, dan berkontribusi ke WANI.

---

## 1. Prasyarat

| Kebutuhan | Versi yang dipakai repo |
|-----------|-------------------------|
| [Bun](https://bun.sh) | 1.4.x (runtime untuk `api`, `web-gen`; package manager untuk semua paket) |
| PostgreSQL | 17 (via Docker Compose `db`, atau instance lokal) |
| Docker + Docker Compose | Untuk menjalankan stack lengkap |
| Node.js | Opsional — hanya untuk `landingpage` (`npm`/`bun` sama-sama bisa) |

Tidak ada workspace/monorepo: setiap paket punya `bun.lock` sendiri, jadi `bun install` dijalankan **per paket**.

---

## 2. Setup Cepat

### Opsi A — Docker Compose (semua service)

```bash
cp .env.example .env      # isi DATABASE_PASSWORD, WAHA_API_KEY, JWT_SECRET, LLM_API_KEY
docker compose up --build
# Dashboard http://localhost:5173 · API di-proxy lewat /api · Health /api/health
```

Untuk pengembangan dengan API & dashboard langsung dari Bun dan WAHA saja lewat Docker:

```bash
bun run dev               # WAHA (docker-compose.local.yml) + API + dashboard
```

### Opsi B — Lokal dengan Bun (disarankan untuk ngoding)

```bash
# 0. Env root (dipakai Compose + WAHA)
cp .env.example .env

# 1. Database saja lewat Docker
docker compose up -d db

# 2. API
cd api
cp ../.env.example .env                    # DATABASE_HOST=localhost, DATABASE_NAME=wani_api
bun install && bun run prisma:generate && bun run prisma:migrate
bun run src/index.ts

# 3. Dashboard (terminal lain)
cd dashboard
cp .env.example .env                        # VITE_API_URL=http://localhost:3001/api
bun install && bun run dev

# 4. WAHA (terminal lain, dari root)
bun run dev:waha
# .env root: WAHA_API_KEY; API memakai WAHA_API_URL=http://localhost:3000/api
```

Alternatif: dari root, `bun run dev` menjalankan WAHA + API + dashboard sekaligus (`bun --watch` untuk API).

> WAHA harus jalan sebelum membuat sesi WhatsApp dari dashboard. Dashboard wajib punya `VITE_API_URL` karena Vite dev server tidak mem-proxy `/api`.

---

## 3. Perintah per Paket

| Paket | Perintah | Fungsi |
|-------|----------|--------|
| root | `bun run dev` / `dev:api` / `dev:waha` / `dev:dash` | Orkestrasi dev |
| `api/` | `bun run src/index.ts` | Start API :3001 |
| | `bun run prisma:generate` · `prisma:migrate` · `prisma:deploy` | Prisma |
| | `bun run test` · `bun run test:e2e` | Unit · integrasi |
| | `bun run build` | Bundle ke `dist/` |
| `dashboard/` | `bun run dev` · `bun run build` · `bun run lint` · `bun run test` | Vite, tsc+vite, eslint, vitest |
| `waha` (Docker) | `bun run dev:waha` · `bun run dev:waha:logs` | WAHA lokal (`docker-compose.local.yml`) |
| `web-gen/` | `bun run src/generator.ts` | Demo CLI generate |
| | `bun run build:template` · `bun test` | Build template Astro · tes |
| | `bun run src/build-fonts.ts` · `bun run src/build-css.ts` | Regenerasi aset template |
| `landingpage/` | `bun run dev` · `bun run build` | Landing page standalone |

---

## 4. Testing

| Perintah | Cakupan |
|----------|---------|
| `cd api && bun run test` | `api/test/**` — unit + integration (firewall, guardrails, schemas, middleware, ai/, pipeline/, services/waha, wa-session, models/, integration/) |
| `cd api && bun run test:e2e` | `api/e2e/pipeline.test.ts` — jalur penuh pipeline |
| `cd dashboard && bun run test` | Vitest (jsdom) — hooks & utils |
| `cd web-gen && bun test` | `test/generator.test.ts`, `test/zip.test.ts` |

**Pitfall penting:** test unit API dan test e2e **harus dijalankan terpisah** (`test/` vs `e2e/`). File e2e memakai `mock.module` yang mengubah module global, sehingga mencampurnya dengan unit test menyebabkan kebocoran state.

Docker API juga butuh DB dummy saat `prisma generate` di build (`DATABASE_URL=postgresql://dummy:dummy@db:5432/wani_api`).

---

## 5. Alur Kerja Git

Repo memakai alur bertahap: **satu fitur = beberapa tahap kecil**, dan setiap tahap di-commit agar histori jelas dan mudah di-rollback.

### Format commit

```
{emoji} {package}: {action} — {detail}
```

Contoh:

```
🔥 api: add products CRUD — route, schema, controller, model
🧪 api: add products tests
📝 docs: split ARSITEKTUR.md into Docs/ modules
```

### Aturan

1. Jangan menunggu fitur besar selesai — commit tiap tahap.
2. Jangan mencampur paket dalam satu commit saat mengerjakan backend (`api/` saja).
3. Jangan commit `node_modules/`, `generated/` (Prisma Client), `dist/`, `uploads/`, `generated-sites/`, atau file `.env`.
4. **Wajib commit** `prisma/migrations/**` setiap ada perubahan schema.
5. Verifikasi sebelum commit: `bun run test` (paket terkait) + `tsc --noEmit`/`bun run build` (dashboard: `bun run build` menjalankan `tsc -b`).
6. Tanyakan dulu sebelum mulai tahap berikutnya; jangan mengerjakan beberapa tahap besar tanpa konfirmasi.

---

## 6. Checklist Menambah Fitur

### Endpoint baru

1. `api/src/schemas/<domain>.ts` — schema Zod untuk body/query.
2. `api/src/routes/<domain>.ts` — daftarkan path + `requireJwt` (atau publik) + `validate({...})`.
3. `api/src/controllers/<domain>.ts` — ambil `getOwnerId(req)` / `getOwnerIdOrFirst(req)`, panggil model, `sendResponse()`.
4. `api/src/models/<domain>.ts` — query Prisma dengan `where: { ownerId }` (`findManyPaginated`, `updateOwned`, `deleteOwned` bila relevan).
5. Bila ada route baru: pastikan router ter-mount di `api/src/routes/index.ts`.
6. Update [API_CONTRACT.md](API_CONTRACT.md).
7. Tes di `api/test/` (unit) atau `api/e2e/` (integrasi).

### Perubahan schema database

```bash
cd api
# edit prisma/models/*.prisma
bun run prisma:migrate -- --name <nama_migrasi>
git add prisma/migrations prisma/models   # migrations wajib ikut
```

Jangan menulis SQL migrasi manual dan jangan mengedit migrasi yang sudah ada di `main`.

### Komponen/halaman dashboard

1. `dashboard/src/pages/<Nama>.tsx`.
2. Daftarkan di `App.tsx` (di dalam route `/app`, dibungkus `ProtectedRoute` otomatis).
3. Data lewat hook `src/hooks/use<X>.ts` yang memakai `fetchApi()`; jangan fetch langsung dari komponen.
4. Tambah primitif UI di `components/ui/` bila perlu — hindari menambah library komponen.

### Step/guardrail AI

1. Buat `api/src/ai/pipeline/steps/<nama>.ts` bertipe `Step<I, O>`.
2. Import tipe I/O dari `ai/pipeline/types.ts`; tambahkan tipe baru di sana bila perlu.
3. Sisipkan di `ai/pipeline/index.ts` pada posisi yang benar (urutan berpengaruh).
4. Perbarui [AI_PIPELINE.md](AI_PIPELINE.md) dan tambah tes.

---

## 7. Konvensi Kode (ringkas)

- **Tanpa `as any`** bila ada alternatif: `req.validatedQuery!`, `req.user`, `as $Enums.X`, `as Prisma.InputJsonValue`, `as Record<string, unknown>`.
- **Path alias, bukan relatif lintas paket** (`@/`, `@db/`, `@web-gen/`, `@landingpage/`).
- **`import type`** wajib (`verbatimModuleSyntax`).
- Dashboard: `erasableSyntaxOnly` → tanpa `enum`/`namespace`/parameter property.
- Semua respons API lewat `sendResponse()` dan error lewat kelas `AppError`.
- Dokumen panjang & konfigurasi baru harus tercatat di `Docs/` — jangan bikin file dokumentasi baru di luar `Docs/` (lihat [REPOSITORY_STRUCTURE.md](REPOSITORY_STRUCTURE.md)).

---

## 8. Aturan Dependency

- **Jangan downgrade package.** Kalau muncul error/bug, cari akar masalahnya lewat dokumentasi resmi, issue tracker, atau diskusi komunitas — cari konfigurasi/flag/workaround untuk versi saat ini.
- **Pakai versi stable terbaru** dari npm registry resmi saat menambah dependency.
- Setelah menambah dependency di paket Bun, `bun.lock` berubah dan **ikut di-commit**.

---

## 9. Troubleshooting Umum

| Gejala | Penyebab & solusi |
|--------|-------------------|
| Dashboard 404 pada `/api/...` saat dev | `VITE_API_URL` belum diisi di `dashboard/.env` (dev server tidak mem-proxy) |
| Login selalu gagal padahal password benar | `emailVerified = false` → verifikasi email atau set kolomnya manual di DB |
| `JWT_SECRET environment variable is required in production` | Set `JWT_SECRET`, atau jalankan dengan `NODE_ENV` selain `production` |
| Token invalid setelah restart API di dev | Normal: tanpa `JWT_SECRET`, secret dibuat acak per proses |
| `/api/health` → 503 | DB tidak reachable atau `LLM_API_KEY`/`OPENROUTER_API_KEY` kosong |
| Balasan AI tidak terkirim ke WhatsApp | Cek `WAHA_API_KEY`/`WAHA_API_URL`, status sesi di dashboard, dan log `docker compose logs -f waha` |
| Sesi minta scan QR berulang | State sesi WAHA hilang/ter-reset — scan ulang atau minta pairing code baru dari tab WA Session |
| Webhook pesan masuk → 401/403 | API key tidak dikirim, kedaluwarsa, atau tidak punya scope `sessions:messages`; legacy `API_TOKEN` hanya aktif bila `ALLOW_LEGACY_API_TOKEN=true` dan ≥ 32 karakter |
| Generate website gagal | Template Astro butuh `bun install` + `astro build` (butuh jaringan, timeout 120 s); cek pesan `error` yang dikembalikan |
| Prisma Client error/tipe hilang | Jalankan `bun run prisma:generate` setelah `bun install` atau setelah mengubah schema |
| Email tidak terkirim | `SMTP_*` kosong → fungsi sengaja no-op; isi kredensial SMTP untuk mengaktifkan |
