# Issue #1 — Monorepo Restructure: pnpm Workspace + apps/api + apps/web + packages/database

## Deskripsi
Restrukturisasi project dari struktur flat (`src/`, `prisma/`, dll di root) menjadi pnpm monorepo dengan workspace yang terpisah. Ini diperlukan karena kita akan punya 3 komponen yang perlu sharing kode: Express backend, Next.js frontend, dan Prisma schema.

## Tujuan
- Struktur folder yang clean dan scalable
- Code sharing via workspace packages
- Setiap app bisa di-develop dan di-deploy independently

## Task Checklist

### 1. Inisialisasi pnpm workspace
- [ ] Buat `pnpm-workspace.yaml` di root
- [ ] Pindahin `package.json` root jadi workspace root (hanya devDependencies)
- [ ] Hapus `node_modules` lama, install ulang dengan pnpm
- [ ] Update `.dockerignore` + `.gitignore` untuk monorepo

### 2. Buat `apps/api` — Express Backend
- [ ] Pindahkan semua isi `src/` ke `apps/api/src/`
- [ ] Pindahkan `prisma/` ke `apps/api/prisma/` (sementara, nanti di-extract)
- [ ] Pindahkan `tests/` ke `apps/api/tests/`
- [ ] Buat `apps/api/package.json` dengan dependencies existing
- [ ] Buat `apps/api/tsconfig.json` (sesuaikan paths)
- [ ] Update semua import path di source code

### 3. Buat `apps/web` — Next.js Frontend (scaffold only)
- [ ] Init Next.js 14+ dengan App Router di `apps/web/`
- [ ] Setup TypeScript + Tailwind CSS
- [ ] Setup Shadcn UI / Radix UI components
- [ ] Setup path alias `@/` untuk `apps/web/src/`
- [ ] Konfigurasi `next.config.ts` (standby untuk API proxy)

### 4. Buat `packages/database` — Shared Prisma
- [ ] Pindahkan `prisma/schema.prisma` ke `packages/database/prisma/schema.prisma`
- [ ] Buat `packages/database/package.json` dengan Prisma dependencies
- [ ] Buat `packages/database/src/client.ts` — Prisma client singleton
- [ ] Buat `packages/database/src/index.ts` — re-export semua
- [ ] Konfigurasi `tsconfig.json` untuk package

### 5. Setup workspace dependencies
- [ ] `apps/api` → depends on `@wani/database`
- [ ] `apps/web` → depends on `@wani/database`
- [ ] Test `pnpm install` works from root
- [ ] Test `pnpm --filter @wani/api dev` runs

### 6. Update scripts root `package.json`
- [ ] `"dev:api": "pnpm --filter @wani/api dev"`
- [ ] `"dev:web": "pnpm --filter @wani/web dev"`
- [ ] `"dev": "pnpm run --parallel dev:api dev:web"`
- [ ] `"build": "pnpm run --parallel build"`
- [ ] `"test": "pnpm run --parallel test"`
- [ ] `"lint": "pnpm run --parallel lint"`
- [ ] `"db:migrate": "pnpm --filter @wani/database db:migrate"`
- [ ] `"db:generate": "pnpm --filter @wani/database db:generate"`
- [ ] `"db:seed": "pnpm --filter @wani/api db:seed"`

## Struktur Final yang Diharapkan
```
WANI/
├── pnpm-workspace.yaml
├── package.json              # root (scripts aja)
├── apps/
│   ├── api/                  # Express backend
│   │   ├── package.json      # @wani/api
│   │   ├── src/
│   │   └── tests/
│   └── web/                  # Next.js frontend
│       ├── package.json      # @wani/web
│       └── src/
├── packages/
│   └── database/             # Shared Prisma
│       ├── package.json      # @wani/database
│       ├── prisma/
│       └── src/
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
└── .env.example
```

## Definition of Done
- `pnpm install` works from root tanpa error
- `pnpm dev:api` starts Express server di port 3001
- `pnpm dev:web` starts Next.js di port 3000
- `pnpm db:generate` generates Prisma client
- Import `@wani/database` works di both apps/api dan apps/web
- Semua test existing masih passing

## Labels
`infrastructure`, `monorepo`, `high-priority`

## Dependencies
- Issue #2 (Shared Prisma) bisa dikerjakan paralel
- Blocking untuk semua issue frontend

## Estimated Effort
2-3 hari (termasuk debugging import paths)
