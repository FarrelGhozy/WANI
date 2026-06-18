# Deployment

## Requirements

- Linux VM (Ubuntu 22.04+ recommended)
- Docker + Docker Compose
- Domain name with DNS pointing to VM IP
- Ports 80 + 443 open

## Quick Start

```bash
# 1. Clone
git clone git@github.com:FarrelGhozy/WANI.git
cd WANI

# 2. Create production env
cp .env.production.example .env.production
nano .env.production
# Isi: DB_PASSWORD, JWT_SECRET, OPENROUTER_API_KEY,
#      API_HOST, WEB_HOST, LETSENCRYPT_EMAIL
```

### Required Env Variables

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Random string for JWT signing |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `API_HOST` | API subdomain (e.g., `api.wani.local`) |
| `WEB_HOST` | Main domain (e.g., `wani.local`) |
| `LETSENCRYPT_EMAIL` | For SSL certificate |

```bash
# 3. Deploy
pnpm docker:prod:up
```

This starts:
- **Traefik** — reverse proxy + auto SSL (Let's Encrypt)
- **PostgreSQL 16** — database
- **API** — Express on port 3001
- **Web** — Next.js on port 3000

Migrations run automatically on first start via `prisma db push` in the API container entrypoint.

## Manual Deploy

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Stop
docker compose -f docker-compose.prod.yml down
```

## Post-Deploy

1. **Create admin account** — hit `POST /api/auth/register` with business name, phone, password
2. **Connect WhatsApp** — login to dashboard → WA Session page → scan QR
3. **Configure AI** — Dashboard → AI Config → set system prompt
4. **Publish store** — Dashboard → Web Store → set slug → publish

## Architecture (Production)

```
                        ┌──────────┐
 User ──:443 ──────────►│  Traefik │
                        └────┬─────┘
                     ┌───────┴───────┐
                     ▼               ▼
                ┌─────────┐   ┌──────────┐
                │  API    │   │   Web    │
                │ :3001   │   │  :3000   │
                └────┬────┘   └──────────┘
                     │
                     ▼
                ┌──────────┐
                │PostgreSQL│
                │  :5432   │
                └──────────┘
```

## Security Notes

- CORS dibatasi ke domain yang didaftarkan via `CORS_ORIGIN`
- JWT disimpan di httpOnly cookie
- Rate limit: 100 req/min global
- Helmet headers aktif
- Baileys auth creds disimpan di database (JSONB column)
