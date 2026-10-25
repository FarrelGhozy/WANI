# Struktur Repo

Repo WANI **bukan monorepo** — empat paket Bun/Node independen di dalam satu repository. Tidak ada workspaces, tidak ada hoisting dependency: setiap paket punya `package.json`, `bun.lock`, dan `tsconfig.json` sendiri. WhatsApp dijalankan sebagai service Docker WAHA, bukan paket terpisah.

---

## 1. Pohon Direktori

```
WANI/
├── api/                      # REST API (Express 5 + Prisma 7) — otak sistem
│   ├── prisma/
│   │   ├── models/           # 14 file *.prisma (bukan satu schema.prisma)
│   │   └── migrations/       # migrasi SQL (di-commit ke git)
│   ├── prisma.config.ts      # Prisma 7 defineConfig: schema dir + migrations path
│   ├── generated/prisma/     # Prisma Client hasil generate (gitignored)
│   ├── src/
│   │   ├── index.ts          # entrypoint: listen + graceful shutdown
│   │   ├── server.ts         # app factory: middleware chain, static, 404, error handler
│   │   ├── routes/           # router per domain + index.ts (mount di /api)
│   │   ├── controllers/      # handler HTTP (req/res) → panggil model
│   │   ├── models/           # data access + business logic (BaseModel, per-domain)
│   │   ├── schemas/          # Zod schema (body/query/params)
│   │   ├── middleware/       # auth, jwt, owner, validate, error
│   │   ├── services/         # email (Nodemailer SMTP), waha (client WhatsApp HTTP API)
│   │   ├── ai/               # pipeline 16 step, engine LLM, prompts, schemas, actions, circuit breaker
│   │   ├── guardrails/       # input, pii, ratelimit, budget, output, classifier + firewall/
│   │   ├── debug/            # tracer (dev-only endpoints)
│   │   ├── config/           # db (Prisma singleton), env, logger, metrics
│   │   ├── utils/            # errors (AppError), response, auth (hash)
│   │   └── types/            # tipe AI (LLMOutput, ChatMessage, dst)
│   ├── test/                 # unit test (bun:test)
│   ├── e2e/                  # integration test pipeline (dipisah)
│   ├── generated-sites/      # output website generator (gitignored, volume docker)
│   ├── uploads/              # file upload (gitignored, volume docker)
│   └── Dockerfile, docker-entrypoint.sh
├── dashboard/                # Dashboard admin (React 19 + Vite 8)
│   ├── src/
│   │   ├── App.tsx           # createBrowserRouter (landing `/`, admin `/app/*`)
│   │   ├── main.tsx          # bootstrap + import index.css
│   │   ├── index.css         # Tailwind v4 (CSS-first, tanpa tailwind.config.*)
│   │   ├── pages/            # 14 halaman
│   │   ├── components/       # layout + fitur (StoreTab, AiTab, WaSessionTab, ChatView, …)
│   │   │   └── ui/           # primitif: Button, Card, Table, Modal, Input, dll
│   │   ├── hooks/            # useProducts, useOrders, useCustomers, useSettings, …
│   │   ├── contexts/         # Store, Products, WaStatus, Tour
│   │   ├── lib/              # api.ts (fetchApi), upload.ts, media.ts
│   │   ├── config/tourSteps.ts
│   │   └── utils/format.ts
│   ├── default.conf          # nginx: SPA + proxy /api, /uploads, /s → api:3001
│   ├── docker-entrypoint.sh  # tulis /env.js → window.__ENV__.API_URL
│   └── Dockerfile
├── landingpage/              # Landing page publik (React 18 + Vite 6 + MUI)
│   └── src/app/App.tsx       # di-import dashboard via alias @landingpage
├── web-gen/                  # Static site generator (Bun + Astro 7)
│   ├── src/
│   │   ├── index.ts          # public API: generate, createZipStream, createZipFile, types
│   │   ├── generator.ts      # deteksi template: ada code.html → HTML render, else Astro build
│   │   ├── build-fonts.ts    # unduh font → src/assets/fonts (dijalankan saat build Docker)
│   │   ├── build-css.ts      # build Tailwind CSS untuk template
│   │   ├── zip.ts            # archiver
│   │   ├── templates/        # default (Astro) + classic, cyberpunk, mini, minimalist, modern, vibrant (HTML)
│   │   └── assets/fonts/     # font lokal + fonts.css
│   └── test/
├── Docs/                     # 📚 dokumentasi ini + aset (ERD, screenshots, proposal)
├── scripts/                  # backup-db.sh, screenshot.mjs
├── landingpage/, s/demo-toko # (s/ = contoh output generator)
├── docker-compose.yml        # produksi (image GHCR + service waha)
├── docker-compose.local.yml  # WAHA untuk dev lokal (network host)
├── init-dbs.sh               # buat database wani_api
├── .env.example              # template env untuk docker compose (API + WAHA)
├── .github/workflows/        # api.yaml, dashboard.yaml
├── tsconfig.json             # project references: api, dashboard, web-gen
├── package.json              # dev script orkestrasi (bukan workspace)
├── AGENTS.md                 # panduan agent + ringkasan arsitektur
└── README.md        → Docs/README.md      (symlink)
```

> `README.md` di root, `api/ARSITEKTUR.md`, `dashboard/ARCHITECTURE.md`, `dashboard/API_SPEC.md`, `web-gen/ARCHITECTURE.md`, dan `web-gen/API_SPEC.md` adalah **symlink** ke `Docs/` agar tidak ada dokumentasi ganda yang cepat basi.

---

## 2. Batas Paket

| Paket | Boleh akses DB? | Boleh import paket lain? | Catatan |
|-------|-----------------|--------------------------|---------|
| `api/` | ✅ `wani_api` | `web-gen` (`@web-gen/*`) | Satu-satunya penulis `wani_api`; klien HTTP ke WAHA |
| `dashboard/` | ❌ | `landingpage` (alias `@landingpage`) | Hanya HTTP ke API |
| `landingpage/` | ❌ | ❌ | Berdiri sendiri; hanya dibundel dashboard |
| `waha` (service) | ✅ `postgres` (database milik WAHA) | ❌ | Dipanggil API lewat HTTP + webhook |
| `web-gen/` | ❌ | ❌ | Library; data dikirim dari API |

---

## 3. Path Alias

| Paket | Alias | Target | Catatan |
|-------|-------|--------|---------|
| `api/` | `@/*` | `./src/*` | |
| | `@db/*` | `./generated/prisma/*` | Contoh: `@db/client` |
| | `@web-gen/*` | `../web-gen/src/*` | Contoh: `@web-gen/index.ts` |
| `web-gen/` | `@/*` | `./*` | (root paket) |
| `dashboard/` | `@/*` | `./src/*` | Wajib diduplikasi di `vite.config.ts` `resolve.alias` |
| | `@landingpage/*` | `../landingpage/src/*` | Sama, diduplikasi di Vite |

**Aturan**: jangan import lintas paket dengan path relatif (`../../`). Pakai alias. Import `./` untuk file sebelah dalam satu direktori masih wajar.

---

## 4. Konvensi Kode

- **`verbatimModuleSyntax` aktif** di semua paket → selalu `import type { X }` untuk tipe.
- **`erasableSyntaxOnly` aktif** di dashboard → dilarang `enum`, `namespace`, dan parameter property di constructor.
- **`noUncheckedIndexedAccess` & `noImplicitOverride` aktif** → akses array/objek by index menghasilkan `T | undefined`; method override wajib pakai `override`.
- **Tanpa `as any`** kecuali benar-benar tidak ada alternatif. Alternatif yang tersedia:
  - `req.validatedQuery!` / `req.user` (deklarasi tipe Express yang di-augment)
  - enum Prisma → `as $Enums.OrderStatus`
  - JSON field Prisma → `as Prisma.InputJsonValue` / `as Record<string, unknown>`
- **Zod di batas sistem.** Semua body/query/params divalidasi lewat middleware `validate()` (`safeParseAsync`) — bukan parsing manual di controller.
- **Controller tipis.** Controller hanya: ambil `ownerId`, panggil model, `sendResponse()`. Business logic di `models/` atau `ai/`.
- **Respons seragam** lewat `sendResponse(res, statusCode, message, data?)`.
- **Naming file**: kebab-case untuk file multi-kata (`store-payment.ts`, `wa-session.ts`), PascalCase untuk komponen React.
- **Runtime Bun untuk api/web-gen** (`module: "Preserve"`, `noEmit`, eksekusi langsung `.ts`); dashboard dibundel Vite.

---

## 5. Di Mana Menaruh Kode Baru

| Kebutuhan | Lokasi |
|-----------|--------|
| Endpoint baru | `api/src/routes/<domain>.ts` + `api/src/controllers/<domain>.ts` |
| Validasi input | `api/src/schemas/<domain>.ts` |
| Query/business logic | `api/src/models/<domain>.ts` (extends `BaseModel`) |
| Tabel baru | `api/prisma/models/<nama>.prisma` + `bun run prisma:migrate -- --name <nama>` |
| Step AI baru | `api/src/ai/pipeline/steps/<nama>.ts` + daftarkan di `pipeline/index.ts` |
| Aturan guardrail | `api/src/guardrails/**` (+ tes di `api/test/`) |
| Halaman dashboard | `dashboard/src/pages/<Nama>.tsx` + route di `App.tsx` |
| Data fetching dashboard | `dashboard/src/hooks/use<X>.ts` (pakai `fetchApi`) |
| Primitif UI baru | `dashboard/src/components/ui/<Nama>.tsx` |
| Template website | `web-gen/src/templates/<id>/` (Astro atau HTML+partial) |
| Integrasi WhatsApp | `api/src/services/waha.ts` + route/controller `sessions` |
| Script ops/CI | `scripts/` atau `.github/workflows/` |

---

## 6. File yang Tidak Boleh Di-commit

Gitignored (lihat `.gitignore` masing-masing paket): `node_modules/`, `generated/` (Prisma Client), `dist/`, `uploads/`, `generated-sites/`, `api/.env`, `dashboard/.env`.

Yang **harus** di-commit: `prisma/migrations/**`, seluruh `Docs/`, `bun.lock`, `Dockerfile`, `docker-compose*.yml`, `.github/workflows/**`.
