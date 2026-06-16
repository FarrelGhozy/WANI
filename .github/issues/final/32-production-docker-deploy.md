# FIN-32 — Production Docker Compose + Deployment

## Deskripsi
Setup production-grade Docker Compose dan dokumentasi deployment. Optimasi untuk 24/7 production dengan logging, healthcheck, dan resource management.

## Task Checklist

### 1. Production Dockerfiles

#### `Dockerfile.api` (production target)
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl-dev
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/

RUN pnpm install --frozen-lockfile

COPY apps/api/ apps/api/
COPY packages/database/ packages/database/

RUN pnpm --filter @wani/database build
RUN pnpm --filter @wani/database db:generate
RUN pnpm --filter @wani/api build

# Stage 2: Run
FROM node:22-alpine AS runner
RUN apk add --no-cache tini openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/packages/database/package.json packages/database/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages/database/dist packages/database/dist
COPY --from=builder /app/packages/database/node_modules/.prisma packages/database/node_modules/.prisma

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/server.js"]
```

#### `Dockerfile.web` (production target)
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/

RUN pnpm install --frozen-lockfile

COPY apps/web/ apps/web/
COPY packages/database/ packages/database/

RUN pnpm --filter @wani/database build
RUN pnpm --filter @wani/web build

# Stage 2: Run
FROM node:22-alpine AS runner
RUN apk add --no-cache tini
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
```

### 2. Production docker-compose.yml
- [ ] Resource limits: CPU & memory untuk tiap service
- [ ] Restart policy: unless-stopped
- [ ] Logging: max-size 10m, max-file 3
- [ ] Internal network (jangan expose postgres ke luar)
- [ ] Environment validation on startup

### 3. Deployment Documentation (`Docs/DEPLOYMENT.md`)
- [ ] Prerequisites (server specs: 2GB RAM minimum)
- [ ] Installation steps
- [ ] First-time setup (migrate, seed)
- [ ] Environment variables reference
- [ ] Backup & restore (pg_dump / pg_restore)
- [ ] Monitoring (healthcheck endpoint)
- [ ] Logging (docker logs, Pino JSON format)
- [ ] Update (zero-downtime)
- [ ] SSL/HTTPS (reverse proxy dengan Nginx/Caddy)
- [ ] Troubleshooting

### 4. Backup Script
- [ ] `scripts/backup.sh` — backup PostgreSQL database
- [ ] `scripts/restore.sh` — restore from backup
- [ ] Cron job template: daily backup at 3 AM

### 5. Monitoring
- [ ] Healthcheck endpoints for Docker
- [ ] Log format: JSON (Pino) untuk log aggregation
- [ ] Resource monitoring commands

## Verification
- [ ] `docker compose -f docker-compose.prod.yml up` → 3 container running
- [ ] Healthcheck passing
- [ ] Backup script works
- [ ] Restore from backup works

## Labels
`deployment`, `docker`, `production`, 🟡 medium

## Dependencies
FND-05

## Estimasi
1 hari
