# FND-03 — Create packages/database (Shared Prisma)

## Deskripsi
Extract Prisma schema ke `packages/database` agar bisa dishare antara Express backend (`apps/api`) dan Next.js frontend (`apps/web`).

## Task Checklist

### 1. Buat package structure
- [ ] `packages/database/package.json`:
  ```json
  {
    "name": "@wani/database",
    "private": true,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "scripts": {
      "db:generate": "prisma generate",
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push",
      "db:studio": "prisma studio",
      "build": "tsc"
    },
    "dependencies": {
      "@prisma/client": "^6.6.0"
    },
    "devDependencies": {
      "prisma": "^6.6.0",
      "typescript": "^5.7.0"
    }
  }
  ```

### 2. Pindahkan Prisma schema
- [ ] Pindahkan `prisma/schema.prisma` ke `packages/database/prisma/schema.prisma`
- [ ] Update `generator` output path kalo perlu
- [ ] Update `datasource` — masih env `DATABASE_URL`

### 3. Buat client singleton
- [ ] `packages/database/src/client.ts`:
  ```typescript
  import { PrismaClient } from '@prisma/client';
  
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  
  export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  ```

- [ ] `packages/database/src/index.ts`:
  ```typescript
  export { prisma } from './client.js';
  export * from '@prisma/client';
  ```

### 4. Setup TypeScript
- [ ] `packages/database/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "outDir": "./dist",
      "declaration": true,
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true
    },
    "include": ["src"]
  }
  ```

### 5. Update apps/api
- [ ] Di `apps/api/package.json`, tambah: `"@wani/database": "workspace:*"`
- [ ] Hapus dependency `@prisma/client` dari `apps/api`
- [ ] Update semua import dari `@prisma/client` ke `@wani/database`
- [ ] Hapus folder `apps/api/prisma/` schema (sudah di packages)

### 6. Generate & verify
- [ ] `pnpm --filter @wani/database db:generate` — Prisma client terbuat
- [ ] Import `@wani/database` works di apps/api
- [ ] Test: `pnpm dev:api` masih jalan

## Definition of Done
- `@wani/database` bisa diimport oleh apps/api dan apps/web
- `pnpm db:generate` dari root works
- Semua import path di apps/api updated

## Labels
`foundation`, `database`, `prisma`, 🔴 high

## Dependencies
FND-01

## Estimasi
3-4 jam
