# FND-02 — Migrate Express Code to apps/api

## Deskripsi
Pindahkan semua kode Express existing dari root `src/` ke `apps/api/`. Update semua import path dan konfigurasi TypeScript.

## Task Checklist
- [ ] Buat `apps/api/package.json`:
  ```json
  {
    "name": "@wani/api",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "tsx watch src/server.ts",
      "build": "tsc",
      "start": "node dist/server.js",
      "test": "vitest run"
    },
    "dependencies": { ... } // pindah dari root
  }
  ```
- [ ] Buat `apps/api/tsconfig.json` — extends root config
- [ ] Pindahkan semua file dari `src/` ke `apps/api/src/`
- [ ] Pindahkan `tests/` ke `apps/api/tests/`
- [ ] Update path alias imports: `@/config` → `../config` (relative)
- [ ] Update prisma import: dari `@prisma/client` → nanti `@wani/database`
- [ ] Test jalan: `pnpm --filter @wani/api dev`

## File Structure Hasil
```
apps/api/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts
│   ├── config/
│   ├── baileys/
│   ├── ai/
│   ├── pipeline/
│   ├── services/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── types/
├── prisma/
│   ├── schema.prisma  (sementara, nanti dipindah)
│   └── seed.ts
└── tests/
    ├── unit/
    └── integration/
```

## Definition of Done
- `pnpm dev:api` starts Express di port 3001 tanpa error
- Semua routes existing bisa diakses
- Semua import path beres

## Labels
`foundation`, `api`, 🔴 high

## Dependencies
FND-01

## Estimasi
4-5 jam
