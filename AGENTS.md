# WANI — agent guidance

Three independent Bun packages (not a monorepo). Each has its own `bun.lock` and `tsconfig.json`.

- **`api/`** — Express 5 + Prisma 7 — REST server with layered architecture (routes → controllers → models → Prisma delegate)
- **`dashboard/`** — React 19 + TypeScript 6 + Vite 8 (Rolldown, not esbuild) — frontend UI
- **`wa-bot/`** — Baileys 6 + Prisma 7 — WhatsApp bot with persistent auth, auto-reconnect

## Architecture

```
Bot pushes QR/status → API stores in WaSession DB → Dashboard polls GET /api/qr
```

- **api/src/index.ts** — Express 5 entrypoint (helmet, cors, morgan→Winston, json parser), graceful shutdown
- **api/src/server.ts** — Express app factory with middleware chain + 404 handler + error handler
- **api/src/routes/** — Router modules, combined under `/api` in `routes/index.ts`
- **api/src/controllers/** — Request handlers using `sendResponse()` unified JSON format
- **api/src/models/** — `BaseModel<T>` abstract class with Prisma delegate pattern (getAll/getById/create/update/delete)
- **api/src/schemas/** — Zod v4 schemas (upsertQrSchema, etc.)
- **api/src/middleware/** — `requireAuth` (Bearer API_TOKEN), `validate` (safeParseAsync), `errorHandler` (AppError-aware)
- **api/src/utils/** — `AppError` subclasses (BadRequest/Unauthorized/Forbidden/NotFound/InternalServer), `sendResponse()`
- **api/src/config/** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`), Winston logger
- **dashboard/vite.config.ts** — `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset`
- **wa-bot/src/index.ts** — Baileys `makeWASocket`, QR terminal print + API POST, auto-reconnect, echo handler
- **wa-bot/src/config/db.ts** — PrismaClient singleton (driver adapter `@prisma/adapter-pg`)
- **wa-bot/src/services/whatsapp-auth.ts** — `usePrismaAuthState()` implementing `SignalKeyStore` (Creds + SignalKey tables)

## Commands

**API** (`api/`):
- `bun run src/index.ts` — start Express server (port 3001)
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:deploy` — apply production migrations

**Dashboard** (`dashboard/`):
- `bun run dev` — Vite dev server (HMR, port 5173)
- `bun run build` — `tsc -b` (project references) then `vite build`
- `bun run lint` — `eslint .` (flat config)
- `bun run preview` — `vite preview`

**WA Bot** (`wa-bot/`):
- `bun run src/index.ts` — start WhatsApp bot
- `bun run prisma:generate` — generate Prisma client
- `bun run prisma:migrate` — apply dev migrations
- `bun run prisma:deploy` — apply production migrations

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/qr` | — | Get current QR code string |
| `GET` | `/api/qr/status` | — | Get connection status + phone number |
| `POST` | `/api/qr` | Bearer API_TOKEN | Push QR code / update status (Zod validated) |
| `DELETE` | `/api/qr` | Bearer API_TOKEN | Clear QR on successful connection |

Unified response: `{ status: "success"|"failure", message, data? }`

Error classes: BadRequestError (400), UnauthorizedError (401), NotFoundError (404), InternalServerError (500)

## Coding Rules

- **Pecah halaman React jadi komponen.** Satu file page jangan panjang — ekstrak bagian UI yang berdiri sendiri (tabel, card, form, dll) ke file komponen terpisah di `components/`.
- **List view tanpa pagination.** Tampilan list (tabel) menampilkan semua data dalam satu halaman tanpa pagination.
- **Card view dengan pagination.** Tampilan card/grid dibatasi max 20 item per halaman.

## Quirks

- `verbatimModuleSyntax` is on everywhere — use `import type` for type-only imports
- `api/` and `wa-bot/` use `module: "Preserve"`, `allowImportingTsExtensions`, `noEmit: true` (Bun runtime, no tsc emit)
- API + wa-bot path aliases: `@db/*` → `./generated/prisma/*`, `@/*` → `./*`
- Dashboard has TypeScript project references: `tsconfig.app.json` (src/) + `tsconfig.node.json` (vite.config.ts)
- ESLint 10 flat config with `eslint/config` module — not `.eslintrc*`
- `erasableSyntaxOnly` in dashboard tsconfig — no enums, no namespaces, no `constructor` parameter properties
- `tsc -b` before vite build ensures type errors block the build
- No test framework installed
- `.gitignore` ignores `erd*` pattern
- `graphify-out/` — graphify knowledge graph outputs; use `graphify query` to explore
- Prisma generated output (`generated/prisma/`) is gitignored in both api and wa-bot
- WaSession is single-row (`id: "default"`), always upserted
- Bot expects API to be running first (POSTs QR on `connection.update`)
- Both databases on same PG server: `wani_api` (api) + `wa_bot` (bot)

## Stack Stability

- **Never downgrade packages.** Jika error/bug muncul, cari solusi via searching (docs, Stack Overflow, GitHub issues) — jangan turunkan versi dependency.
- **Research first.** Sebelum menurunkan versi atau mengganti package, cari dulu apakah ada konfigurasi / flag / workaround untuk versi saat ini.
- **Gunakan latest stable.** Semua dependency harus latest stable version dari npm registry resmi.
- **Error = cari solusi, bukan turun versi.** Kalau build error, lint error, atau type error, carilah solusi yang kompatibel dengan versi yang ada.

## Referensi Dokumen

- **`dashboard/ARCHITECTURE.md`** — Arsitektur dashboard: 5 halaman (Dashboard, Products, Orders, Customers+Chats, Settings), component tree, routing, data flow, page spec
- **`dashboard/API_SPEC.md`** — API contract spec: semua endpoint grouped by 5 halaman, format request/response, error codes
