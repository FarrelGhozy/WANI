# Issue #2 — Docker Compose untuk Local Development

## Deskripsi
Setup Docker Compose yang proper untuk development lokal. Semua service harus bisa jalan dengan `docker compose up` dan hot-reload bekerja dengan baik.

## Latar Belakang
Sekarang kita pake monorepo dengan 3 service: Express API, Next.js Web, dan PostgreSQL. Docker Compose harus diupdate untuk mencerminkan struktur baru ini.

## Task Checklist

### 1. PostgreSQL Service
- [ ] PostgreSQL 16 alpine
- [ ] Healthcheck dengan `pg_isready`
- [ ] Volume persistent untuk data
- [ ] Expose port 5432 untuk akses lokal (pgAdmin, Prisma Studio)
- [ ] Environment variables dari .env

### 2. API Service (`Dockerfile.api`)
- [ ] Multi-stage build (builder + runner)
- [ ] Stage builder: install dependencies, generate Prisma, build TypeScript
- [ ] Stage runner: node 22-alpine + tini, hanya production dependencies
- [ ] Copy dari workspace: `apps/api/dist`, `packages/database`
- [ ] Healthcheck endpoint `/health`
- [ ] Hot-reload mode development (bind mount + tsx watch)

### 3. Web Service (`Dockerfile.web`)
- [ ] Multi-stage build
- [ ] Stage builder: Next.js build
- [ ] Stage runner: standalone output
- [ ] Expose port 3000
- [ ] Environment: `NEXT_PUBLIC_API_URL`指向 API service

### 4. Docker Compose Config
- [ ] 3 service: `postgres`, `api`, `web`
- [ ] Network internal (`wani-net`) antar service
- [ ] Volume untuk PostgreSQL data
- [ ] Volume bind mount untuk source code (development)
- [ ] depends_on dengan condition: service_healthy untuk postgres
- [ ],env file loading dari root

### 5. Development vs Production Profile
- [ ] Dev profile: bind mount source code, hot reload, debug logging
- [ ] Prod profile: multi-stage build, optimized, no dev tools

```yaml
# docker-compose.yml outline
services:
  postgres:
    image: postgres:16-alpine
    # ... standard config

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
      target: development  # atau production
    volumes:
      - ./apps/api:/app/apps/api  # hot-reload
      - ./packages:/app/packages
    ports:
      - "3001:3001"
    # ...

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
      target: development
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
    ports:
      - "3000:3000"
    # ...
```

### 6. Environment & Scripts
- [ ] Update `.env.example` dengan variable untuk semua service
- [ ] Buat script `scripts/dev.sh` untuk local development tanpa Docker (optional)
- [ ] Update root `package.json` dengan script `docker:dev` dan `docker:prod`

## Verification Steps
1. `docker compose up` — semua service jalan tanpa error
2. `curl http://localhost:3001/health` → `{"status":"ok","db":"connected"}`
3. Buka `http://localhost:3000` → Next.js page muncul
4. Ubah file di `apps/api/src/` → auto restart (hot reload)
5. Ubah file di `apps/web/src/` → auto refresh (HMR)
6. `docker compose down` — clean shutdown

## Notes
- Pake `target: development` di Dockerfile biar bisa multi-purpose
- Prisma generate harus jalan di build time, bukan runtime
- Untuk development cepat, bisa jalanin pnpm langsung (tanpa Docker) untuk api + web, cuma DB di Docker

## Labels
`infrastructure`, `docker`, `high-priority`

## Dependencies
- Issue #1 (Monorepo Restructure) — harus selesai dulu

## Estimated Effort
2 hari
