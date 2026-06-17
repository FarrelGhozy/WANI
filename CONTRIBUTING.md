# Contributing to WANI

## Development Setup

1. Clone: `git clone https://github.com/your-org/wani.git && cd wani`
2. Install: `pnpm install`
3. Start DB: `docker compose up postgres -d`
4. Migrate: `pnpm db:migrate`
5. Seed: `pnpm db:seed`
6. Dev: `pnpm dev`

## Before Committing

```bash
pnpm lint        # Check for TS errors
pnpm build       # Verify build
pnpm test        # Run all tests
```

## Code Style

- TypeScript strict, ESNext modules
- No `any` — use `unknown` + type guard
- No `console.log` — use Pino `logger.info()`
- Async/await, no raw promises
- Try-catch in all service functions

## Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `chore/description` — Maintenance

## Commit Message Format

```
type(scope): short description

- bullet points for details
- explain WHAT changed and WHY
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
Scopes: `api`, `web`, `db`, `docker`, `docs`, `test`, `monorepo`

## Project Structure

See [ARCHITECTURE.md](Docs/ARCHITECTURE.md) for the full structure.
