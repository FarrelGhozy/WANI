# FND-05 — Docker Compose Local Development

## Deskripsi
Setup Docker Compose untuk development lokal dengan 3 service: PostgreSQL + Express API + Next.js Web. Semua service harus hot-reload.

## Task Checklist

### 1. docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: wani-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: wani
      POSTGRES_PASSWORD: ${DB_PASSWORD:-wani_secret}
      POSTGRES_DB: wani
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wani"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - wani-net

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
      target: development
    container_name: wani-api
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages/database:/app/packages/database
    env_file: .env
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://wani:${DB_PASSWORD:-wani_secret}@postgres:5432/wani
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - wani-net

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
      target: development
    container_name: wani-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages/database:/app/packages/database
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://api:3001
      DATABASE_URL: postgresql://wani:${DB_PASSWORD:-wani_secret}@postgres:5432/wani
    depends_on:
      - api
    networks:
      - wani-net

volumes:
  pgdata:

networks:
  wani-net:
    driver: bridge
```

### 2. Dockerfile.api (development stage)
- [ ] `FROM node:22-alpine`
- [ ] Install pnpm global
- [ ] Copy root config files (pnpm-workspace.yaml, package.json, pnpm-lock.yaml)
- [ ] Copy apps/api + packages/database
- [ ] `pnpm install`
- [ ] `pnpm --filter @wani/database db:generate`
- [ ] `CMD ["pnpm", "dev:api"]`

### 3. Dockerfile.web (development stage)
- [ ] `FROM node:22-alpine`
- [ ] Install pnpm global
- [ ] Copy root config files
- [ ] Copy apps/web + packages/database
- [ ] `pnpm install`
- [ ] `CMD ["pnpm", "dev:web"]`

### 4. Root scripts
- [ ] `package.json`: `"docker:dev": "docker compose up"`
- [ ] `"docker:dev:build": "docker compose up --build"`
- [ ] `"docker:dev:down": "docker compose down"`
- [ ] `"docker:dev:db": "docker compose up postgres -d"` (jalanin DB doang)

### 5. Update .env.example
```env
DB_PASSWORD=wani_secret
DATABASE_URL=postgresql://wani:wani_secret@localhost:5432/wani
OPENROUTER_API_KEY=sk-or-your-key-here
JWT_SECRET=minimal-32-chars-long-secret-key-here
WA_PHONE=6281234567890
NODE_ENV=development
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Verification
- [ ] `docker compose up` — 3 container running
- [ ] `curl localhost:3001/health` → `{"status":"ok","db":"connected"}`
- [ ] `curl localhost:3000` → Next.js HTML response
- [ ] Update file di apps/api → hot reload
- [ ] `docker compose down` — clean

## Labels
`foundation`, `docker`, 🔴 high

## Dependencies
FND-02, FND-03, FND-04

## Estimasi
1 hari
