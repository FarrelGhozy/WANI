## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## repo

pnpm monorepo — 3 packages under `apps/` and `packages/`:

| package | path | type | entry |
|---------|------|------|-------|
| `@wani/api` | `apps/api/` | Express + ESM | `src/server.ts` |
| `@wani/web` | `apps/web/` | Next.js 15 App Router | `app/layout.tsx` |
| `@wani/database` | `packages/database/` | Prisma ORM | `src/index.ts` (re-exports @prisma/client) |

### dev setup

```
pnpm install                    # first time — .npmrc sets node-linker=hoisted
pnpm docker:dev:db              # start postgres in Docker (or have one running locally)
pnpm db:generate                # prisma generate
pnpm db:push                    # push schema to postgres
pnpm db:seed                    # (optional) seed sample data — MUST run from root, NOT apps/api
pnpm dev                        # runs both api+web in parallel (api:3001, web:3000)
```

Required `.env` at repo root (copy from `.env.example`):
`DB_PASSWORD`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `API_PORT`, `LLM_MODEL`, `NEXT_PUBLIC_STORE_URL`

### commands

| what | how |
|------|-----|
| dev both | `pnpm dev` |
| dev api only | `pnpm dev:api` (or `pnpm --filter @wani/api dev`) |
| dev web only | `pnpm dev:web` |
| lint (tsc --noEmit) | `pnpm lint` — runs in api + web only |
| test all | `pnpm test` — only api has tests (vitest), web has none |
| single test | `pnpm --filter @wani/api test -- tests/unit/pipeline-router.test.ts` |
| test watch | `pnpm --filter @wani/api test:watch` |
| build all | `pnpm build` |
| build api | `pnpm build:api` |
| build web | `pnpm build:web` |
| db studio | `pnpm db:studio` (Prisma GUI) |
| static site gen | `pnpm --filter @wani/api static:generate` |

### testing quirks

- Tests need a running PostgreSQL with `DATABASE_URL` env var set (CI uses `postgresql://wani:wani_secret@localhost:5432/wani`)
- Also need `JWT_SECRET` env var (tests set it to `test-secret` in CI)
- `vitest.config.ts` has `@/` alias pointing to `apps/api/src/`
- Tests use globals (`globals: true`), no manual import of describe/it/expect
- Test factories in `tests/helpers/factories.ts` — use `build*()` functions for entity setup

### architecture notes

- **PrismaClient singleton** lives at `packages/database/src/client.ts` — uses global caching to survive HMR. Import as `import { prisma } from '@wani/database'`.
- **API** is Express with a `{ success, data }` / `{ success, error }` response convention. JWT auth via httpOnly cookie (`token`) or `Authorization: Bearer` header.
- **Pino** for logging (no console.log). **Zod** for request validation at the middleware layer (`middleware/validator.ts`).
- **AI pipeline** at `apps/api/src/pipeline/router.ts` — routes WhatsApp messages through intent classification, optional LLM completion (DeepSeek via OpenRouter), validation, and human escalation fallback.
- **Baileys** WhatsApp socket manager (`apps/api/src/baileys/manager.ts`) — state machine with reconnect logic, AES-256 encrypted session creds stored in PostgreSQL.
- **Web** uses Next.js App Router, Tailwind v4 (with `@tailwindcss/postcss` plugin), lucide-react icons. No test suite exists for the web package.
- **pnpm workspace** config in `pnpm-workspace.yaml` — `@wani/database` is shared between api and web via `workspace:*` protocol.
- **Docker**: dev compose has postgres + api (hot-reload) + web; prod compose adds Traefik reverse proxy with Let's Encrypt auto-SSL.

### code conventions

- TypeScript strict mode, ESNext module, `"type": "module"` in all packages
- No `any` — use `unknown` and narrow
- Async/await, no raw promises
- Commit format: `type(scope): message` — types: `feat|fix|docs|chore|refactor|test`, scopes: `api|web|db|docker|docs|test|monorepo`
- Branch naming: `feat/`, `fix/`, `docs/`, `chore/`
