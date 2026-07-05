# Changelog

## api v1.0.7 — 2026-07-05

### What's Changed

- **JWT protection for store/ai-config** — `GET /api/store` and `GET /api/ai-config` now require `requireJwt`, fixing cross-user store leakage
- **Auto-create Store on register** — `POST /api/auth/register` now calls `StoreModel.upsertByOwner` immediately after user creation (fixes #105)
- **Multi-tenant schema** — `ownerId` added to all user-owned models: `Store`, `Product`, `Order`, `Customer`, `Conversation`, `AiConfig`, `Website`, `UsageCounter`, `ActivityLog`
- **Owner-scoping utilities** — `getOwnerId()`, `getOwnerIdOrFirst()`, `ownerFilter()`, `ownerWhere()` in middleware
- **Pairing code login** — QR + pairing code dual mode for WhatsApp Bot
- **Composite DB index** — `Order(status, createdAt)` for faster order-list queries
- **Helmet CORP fix** — `crossOriginResourcePolicy` added to prevent cross-origin image blocking
- **Unit + integration tests** — 223 tests across auth, store, products, guardrails, AI pipeline, circuit breaker
- **Email system** — `nodemailer` SMTP integration, `EmailService` abstraction, forgot password now sends real reset link email (fixes #67)
- **Security hardening** — stricter CSP (removed localhost & CDN refs), HSTS header, X-Frame-Options, global rate limiter (120 req/min) (progress on #74)
- **Product search in all templates** — client-side filter added to `classic`, `modern`, `vibrant`, `minimalist`, `cyberpunk` HTML templates (fixes #69)
- **Automated DB backup** — `scripts/backup-db.sh` with `pg_dump`, daily cron via Docker backup service, 7-day retention (fixes #73)

## wa-bot v1.0.7 — 2026-06-27

### What's Changed

- **Baileys v6 → v7 migration** — new `baileys` package, LID handshake support
- **Prisma auth state** — replaced `useMultiFileAuthState()` with `usePrismaAuthState()`, PostgreSQL persistent auth
- **History sync disabled** — `shouldSyncHistoryMessage: () => false`
- **Message filtering** — only process `notify` type, only `@s.whatsapp.net` JIDs
- **Phone extraction fix** — parse from `sock.user.id` (absent `phoneNumber` field in v7)
- **QR/status sync** — handle `receivedPendingNotifications`, safety net on incoming message
- **Debug logging** — `connection.update` fields, incoming messages, API errors
- **Unit tests added** — 11 tests for `usePrismaAuthState()`, mock Prisma pattern
- **CI workflow** — `bun test` runs before Docker build

## dashboard v1.0.4 — 2026-06-27

### What's Changed

- **Toast system** — global singleton with `useSyncExternalStore`, lucide-react icons, top-right
- **Toast added** — all 11 mutation pages (Store, Products, Orders, Customers, Website, etc.)
- **StoreTab overhaul** — local form state, Simpan Perubahan saves all at once
- **Business hours editor** — 7-day per-row time picker with BUKA/LIBUR toggle
- **Payment checkboxes** — QRIS, Transfer Bank, E-Wallet, COD, Tunai
- **Placeholders + hints** — every input field has example text
- **Time format** — 24-hour `TimeSelect` dropdowns (HH:mm), replaces native `type="time"`
- **AiTab** — local state, save on button click, OpenCode Zen help text
- **Layout fix** — empty chat panel centered with `absolute inset-0`
- **Date formatting** — WIB timezone, 24-hour, long month names

## api v1.0.3 — 2026-06-27

### What's Changed

- **LLM provider-agnostic** — `LLM_BASE_URL` + `LLM_API_KEY` env vars, no longer hardcoded to OpenRouter
- **Model default changes** — `deepseek-v4-flash-free`, fallback `north-mini-code-free`
- **Guardrail models** — all updated to `north-mini-code-free`
- **Logger improvements** — printf format supports string/number metadata, colorful console
- **Pipeline refactored** — modular architecture, 18-step orchestrator
- **ConnectedAt timestamp** — wired end-to-end with dashboard
- **wa-bot reset endpoint** — `POST /api/qr/reset` clears bot credentials
