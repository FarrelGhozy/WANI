# Production Readiness — Tahap 4

---

## 1. Database Backup

### Automated Backup Script

```bash
#!/bin/bash
# scripts/backup-db.sh
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup wani_api
pg_dump -h localhost -U postgres wani_api | gzip > "$BACKUP_DIR/wani_api_$TIMESTAMP.sql.gz"

# Backup wa_bot
pg_dump -h localhost -U postgres wa_bot | gzip > "$BACKUP_DIR/wa_bot_$TIMESTAMP.sql.gz"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $TIMESTAMP"
```

### Cron Job

```cron
# /etc/cron.d/wani-backup
0 2 * * * postgres /opt/wani/scripts/backup-db.sh >> /var/log/wani-backup.log 2>&1
```

### Docker-based Backup

```yaml
# docker-compose.yml — backup service
backup:
  image: postgres:17-alpine
  volumes:
    - backups:/backups
    - ./scripts/backup-db.sh:/backup.sh
  environment:
    PGHOST: db
    PGUSER: ${DATABASE_USER}
    PGPASSWORD: ${POSTGRES_PASSWORD}
  entrypoint: ["/bin/sh", "-c"]
  command: |
    while true; do
      /backup.sh
      sleep 86400  # 24 jam
    done
  networks: [wani]

volumes:
  backups:
```

---

## 2. Content Security Policy (Production)

### Helmet CSP Production

```typescript
// api/src/server.ts — production CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // Untuk generated sites
  crossOriginResourcePolicy: { policy: "cross-origin" },
}))
```

---

## 3. Security Headers

### Nginx Configuration (Dashboard Production)

```nginx
# dashboard/default.conf.template — tambah security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header X-XSS-Protection "0" always;  # Deprecated, but set to 0 for security
```

---

## 4. Rate Limiting Hardening

### Production Rate Limits

```typescript
// api/src/guardrails/ratelimit.ts — production defaults
const PRODUCTION_LIMITS = {
  short: { max: 8, windowMs: 30_000 },    // 8 req / 30 detik
  long: { max: 60, windowMs: 3_600_000 },  // 60 req / jam
}

const ENDPOINT_SPECIFIC_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth/login': { max: 5, windowMs: 900_000 },      // 5 login / 15 menit
  '/api/auth/forgot-password': { max: 3, windowMs: 900_000 }, // 3 / 15 menit
  '/api/chat': { max: 30, windowMs: 60_000 },             // 30 chat / menit
}
```

---

## 5. Environment Validation

```typescript
// api/src/config/env.ts — production validation
const requiredVars = [
  'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_NAME',
  'API_TOKEN', 'JWT_SECRET', 'OPENROUTER_API_KEY',
] as const

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

// Validate JWT_SECRET is not the default
if (process.env.JWT_SECRET === 'wani-dev-secret-change-in-production') {
  throw new Error('JWT_SECRET must be changed from the default value in production!')
}

// Validate API_TOKEN is strong (min 32 chars)
if (process.env.API_TOKEN && process.env.API_TOKEN.length < 32) {
  throw new Error('API_TOKEN must be at least 32 characters!')
}
```

---

## 6. Load Testing Plan

### Artillery Configuration

```yaml
# load-test/basic.yml
config:
  target: http://localhost:3001
  phases:
    - duration: 60
      arrivalRate: 1
      rampTo: 5
    - duration: 120
      arrivalRate: 5
      rampTo: 10
    - duration: 120
      arrivalRate: 10

scenarios:
  - name: "Browse products"
    flow:
      - get:
          url: "/api/products"
      - think: 2
      - get:
          url: "/api/store"

  - name: "Chat flow"
    flow:
      - post:
          url: "/api/chat"
          headers:
            Authorization: "Bearer {{API_TOKEN}}"
          json:
            from: "6281234567890"
            body: "Halo, mau tanya produk"
      - think: 3
```

### Run Load Test

```bash
npx artillery run load-test/basic.yml --output load-test/results.json
npx artillery report load-test/results.json
```

### Target Metrics
- P50 latency: < 200ms
- P95 latency: < 1000ms
- Error rate: < 1%
- Concurrent users sustained: 100

---

## 7. Production Deployment Guide

### TODO: Create `DEPLOY.md`

```markdown
# WANI — Production Deployment Guide

## Requirements
- Linux server (Ubuntu 22.04+)
- Docker + Docker Compose v2
- Domain with SSL (for dashboard + API)
- PostgreSQL 17 (managed or self-hosted)

## Steps

1. **Clone repository**
   git clone https://github.com/username/WANI.git /opt/wani
   cd /opt/wani

2. **Configure environment**
   cp .env.example .env
   # Edit .env with real values
   nano .env

3. **Start services**
   docker compose -f docker-compose.yml up -d

4. **Verify**
   curl http://localhost:3001/api/health
   curl http://localhost:5173

5. **Setup SSL (Caddy reverse proxy)**
   ...

6. **Setup backup**
   ...
```

---

## 8. Disaster Recovery Plan

### Recovery Scenarios

| Scenario | Impact | Recovery | RTO | RPO |
|----------|--------|----------|-----|-----|
| Database corruption | All services down | Restore from latest backup | 30 min | 24 jam |
| Server failure | All services down | Redeploy from Docker images | 1 jam | 0 (stateless) |
| LLM outage | AI chatbot down | Manual reply via dashboard | N/A | N/A |
| WA session expired | Bot disconnect | Re-scan QR | 5 min | 0 |

### Recovery Runbook

```markdown
# Database Recovery
1. Stop all services: docker compose down
2. Restore backup: gunzip -c backup.sql.gz | psql -U postgres wani_api
3. Run migrations: cd api && bun run prisma:deploy
4. Start services: docker compose up -d

# Full Redeploy
1. Pull latest images: docker compose pull
2. Start: docker compose up -d
3. Verify: curl /api/health
```

---

## Checklist Production Readiness

- [ ] Automated daily backup + restore tested
- [ ] Environment variable validation at startup
- [ ] Production CSP configured (no unsafe-inline)
- [ ] Security headers audit passed
- [ ] Rate limiting hardened for production
- [ ] Load testing completed + results documented
- [ ] Production deployment guide written
- [ ] Disaster recovery runbook written
- [ ] SSL/TLS configured
- [ ] Secrets rotated from defaults
