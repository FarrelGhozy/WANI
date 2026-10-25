# Service: API (`api/`)

Express 5 + Prisma 7 + Zod 4, dijalankan dengan Bun. Ini adalah inti sistem: satu-satunya penulis DB `wani_api`, penyedia REST untuk dashboard, klien HTTP ke WAHA, serta host AI pipeline dan website generator.

---

## 1. Menjalankan

```bash
cd api
cp ../.env.example .env          # salin template root; sesuaikan DATABASE_HOST=localhost
bun install
bun run prisma:generate
bun run prisma:migrate           # apply migrasi ke DB dev
bun run src/index.ts             # → http://localhost:3001
```

Docker: lihat [DEPLOYMENT.md](../DEPLOYMENT.md).

| Script | Perintah |
|--------|----------|
| `bun run src/index.ts` | Start server |
| `bun run prisma:generate` | Generate Prisma Client ke `generated/prisma/` |
| `bun run prisma:migrate` | `prisma migrate dev` |
| `bun run prisma:deploy` | `prisma migrate deploy` (produksi) |
| `bun run test` | `bun test test/` (unit) |
| `bun run test:e2e` | `bun test e2e/` (integrasi pipeline) |
| `bun run build` | `bun build ./src/index.ts --outdir ./dist --target bun` |

---

## 2. Arsitektur Layer

```
routes/          → definisi path + middleware (auth, validate)
  ↓
controllers/     → parse req (via req.body / req.validatedQuery), panggil model, sendResponse()
  ↓
models/          → Prisma delegate + business logic, selalu ter-scope ownerId
  ↓
config/db.ts     → PrismaClient singleton (driver adapter @prisma/adapter-pg)
```

Pendukung:

| Folder | Isi |
|--------|-----|
| `schemas/` | 13 file Zod: `auth`, `ai-config`, `api-key`, `chat`, `customer`, `debug`, `log`, `order`, `product`, `sessions`, `store`, `store-payment`, `website` |
| `middleware/` | `auth` (`requireServiceAuth` untuk API key/legacy `API_TOKEN`), `jwt` (`requireJwt`, `optionalJwt`), `owner` (`getOwnerId`, `getOwnerIdOrFirst`, `ownerFilter`, `ownerWhere`), `validate` (`validate()`, `getValidatedQuery()`), `error` |
| `services/email.ts` | Nodemailer transport; no-op + log bila SMTP tidak dikonfigurasi |
| `services/waha.ts` | Client WAHA: session, sync/QR, pairing, reset, `sendText` |
| `config/` | `db` (Prisma singleton + global cache), `env` (parsing env bertipe), `logger` (Winston + stream untuk morgan), `metrics` (prom-client) |
| `utils/` | `errors` (`AppError` + subclass), `response` (`sendResponse`), `auth` (hash/verify password) |
| `ai/`, `guardrails/`, `debug/`, `types/` | Lihat [AI_PIPELINE.md](../AI_PIPELINE.md), [GUARDRAILS.md](../GUARDRAILS.md) |

### `BaseModel` (`models/base.ts`)

Kelas abstrak dengan `delegate` (Prisma model) dan helper:

- `getAll`, `getById`, `getOrThrow`, `create`, `update`, `delete`
- `updateOwned(ownerId, id, data)` / `deleteOwned(...)` → `updateMany`/`deleteMany` dengan `ownerId`, melempar `NotFoundError` bila `count === 0` (aman lintas tenant)
- `paginate(page, limit)` → `{ page, limit, skip }`
- `listResult(items, total, page, limit)` → `{ items, total, page, limit, totalPages }`
- `findManyPaginated(where, skip, take, orderBy, page, limit)` → query + count paralel
- `ping()` → `SELECT 1` untuk health check

### Daftar model

`activity-log`, `ai-config`, `api-key`, `catalog` (Category + Product), `conversation`, `customer`, `dashboard` (agregasi stats, bukan BaseModel), `message`, `order`, `store`, `store-payment`, `user`, `wa-session`, `website`.

---

## 3. Middleware Chain

Lihat [ARCHITECTURE.md §5](../ARCHITECTURE.md). Ringkas untuk pengembangan:

1. `optionalJwt` dipasang global pada `/api` → `req.user` opsional.
2. Route yang butuh identitas memakai `requireJwt`; endpoint service (webhook WAHA) memakai `requireServiceAuth(scope)` dengan managed API key atau legacy `API_TOKEN`.
3. `validate({ body, query, params })` menaruh hasil parse di `req.body`, `req.validatedQuery`, `req.validatedParams` (deklarasi tipe Express di-augment di `src/types/`).
4. Handler boleh `throw new BadRequestError(...)` — `errorHandler` di akhir rantai yang mengubahnya menjadi respons JSON.

---

## 4. Endpoint

Tabel lengkap: [API_CONTRACT.md](../API_CONTRACT.md). Router yang ter-mount (`routes/index.ts`):

```
/sessions  /api-keys  /store  /store/payment-methods  /ai-config  /products/categories  /products
/orders  /customers  /conversations  /dashboard  /logs  /usage  /auth  /website  /upload
/  (monitoring: /health, /metrics)  /debug (hanya non-produksi)
```

---

## 5. Observability

| Fasilitas | Detail |
|-----------|--------|
| `GET /api/health` | Cek DB (`SELECT 1`) + keberadaan LLM API key → `200` atau `503`, `data.checks` |
| `GET /api/metrics` | Format Prometheus (`prom-client`), di-increment oleh `metricsMiddleware` |
| Log | Winston; access log lewat `morgan` dengan stream Winston |
| Audit | Tabel `ActivityLog` (dibaca dashboard lewat `GET /api/logs`) |
| Usage | `UsageCounter` + `GET /api/usage` |
| Trace pipeline | `debug/tracer.ts`, endpoint `GET /api/debug/*` (non-produksi saja) |

---

## 6. Aset & File

| Path | Isi | Volume Docker |
|------|-----|---------------|
| `generated-sites/` | Hasil generate website; disajikan di `/s/:slug` | `generated-sites` |
| `uploads/` | Hasil upload (maks 2 MB, PNG/JPEG/WebP); disajikan di `/uploads/*` | `uploads` |
| `dist/` | Hasil `bun run build` untuk image produksi | — |

Path dihitung relatif lokasi modul (`path.resolve(import.meta.dir, "..", ...)`) dan `process.cwd()` untuk `uploads/` — jalankan dari direktori `api/`.

---

## 7. Testing

| Perintah | Cakupan |
|----------|---------|
| `bun run test` | `test/**` — unit & integration: `ai/` (actions, budget, circuit-breaker, engine, grounding), `pipeline/` (coordinator, dedup, normalize, outboundPersister, outputParser), `services/waha`, `models/`, `integration/` (auth, auth-gates, products, store), plus `firewall`, `guardrails`, `golden-reply`, `intent`, `middleware`, `schemas`, `security`, `errors`, `response`, `email`, `wa-session`, `catalog`, `auth`, `api-key` |
| `bun run test:e2e` | `e2e/pipeline.test.ts` — jalur penuh pipeline |

Pemisahan `test/` dan `e2e/` penting: `e2e` memakai `mock.module` dan berbagi state, sehingga dijalankan terpisah agar tidak mencemari tes unit. Test memakai `supertest` terhadap `app` dari `src/server.ts` (tanpa membuka port) dan Prisma yang di-mock/DB test.

Jumlah test **berubah** seiring waktu — jalankan perintahnya bila butuh angka pasti, jangan mengandalkan angka yang ditulis di dokumen.

---

## 8. Catatan Implementasi

- `src/index.ts` menangani `SIGINT`/`SIGTERM`: tutup server + `prisma.$disconnect()` + `exit(0)`.
- `config/db.ts` menyimpan instance Prisma di `globalThis` (aman untuk `bun --watch`), memakai driver adapter `@prisma/adapter-pg`.
- `JWT_SECRET` kosong di dev → secret acak per proses; di produksi melempar error saat dipakai.
- `express.json()` **tanpa** `limit` kustom (default 100 kB) — upload memakai `multipart/form-data` (multer, batas 2 MB).
- Semua respons lewat `sendResponse()`; tidak ada endpoint yang mengembalikan `res.json()` mentah.
