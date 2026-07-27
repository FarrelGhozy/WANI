# BAHA — WAHA Migration To-Do List

## Phase 1: Create WAHA Service

- [x] Add `axios` to `api/package.json` under `dependencies`
- [ ] Create `api/src/services/waha.ts` — typed wrapper class for WAHA HTTP API
  - Configures axios instance with `WAHA_BASE_URL` (default `http://localhost:3000`), `WAHA_API_KEY` in request interceptor
  - **Multi-tenant**: All session-based methods accept `sessionId` as first param (e.g. `sendText(sessionId, to, text)`)
  - **Session endpoints**: `createSession(name, config?)`, `getSessions`, `getSession(sessionId)`, `stopSession(sessionId)`, `logout(sessionId)`
  - **Auth endpoints**: `getQr(sessionId)`, `requestPairingCode(sessionId, phone)`
  - **Message endpoints**: `sendText(sessionId, to, text)`, `sendImage(sessionId, to, image, caption?)`, `sendButtons`, `sendList`, `sendReaction`
  - **Utility endpoints**: `health`, `getStatus(sessionId)`
  - Error handling with axios interceptors (logging, error normalization, retry)
- [ ] Update `WaSession` model/prisma schema — change from single-row `id="default"` to multi-row keyed by WAHA session name (`sess-wani-<hex>`), add `ownerId` FK to store
- [ ] Write unit tests for `api/src/services/waha.ts`

## Phase 2: Consolidate Routes & Controllers under `/sessions`

### Routes

| Old file                     | Action           | New file                     |
| ---------------------------- | ---------------- | ---------------------------- |
| `api/src/routes/qr.ts`       | Delete           | —                            |
| `api/src/routes/chat.ts`     | Delete           | —                            |
| `api/src/routes/outgoing.ts` | Delete (Phase 2) | —                            |
| —                            | Create           | `api/src/routes/sessions.ts` |

### New route table (`/api/sessions`, all in `sessions.ts`)

| Method   | Path                                       | Auth         | Description                                       |
| -------- | ------------------------------------------ | ------------ | ------------------------------------------------- |
| `GET`    | `/api/sessions`                            | 🔒 JWT       | List all sessions for owner                       |
| `POST`   | `/api/sessions`                            | 🔒 JWT       | Create new session (calls `waha.createSession()`) |
| `GET`    | `/api/sessions/:sessionId`                 | —            | Session details (status, phone, pairing)          |
| `DELETE` | `/api/sessions/:sessionId`                 | 🔒 JWT       | Stop & delete session                             |
| `GET`    | `/api/sessions/:sessionId/qr`              | —            | Get QR code                                       |
| `POST`   | `/api/sessions/:sessionId/qr`              | 🔒 API_TOKEN | WAHA webhook — upsert QR/status                   |
| `DELETE` | `/api/sessions/:sessionId/qr`              | 🔒 API_TOKEN | Clear QR                                          |
| `POST`   | `/api/sessions/:sessionId/pairing`         | 🔒 JWT       | Request pairing code                              |
| `POST`   | `/api/sessions/:sessionId/refresh-pairing` | 🔒 JWT       | Refresh pairing code                              |
| `POST`   | `/api/sessions/:sessionId/reset`           | 🔒 JWT       | Reset session                                     |
| `POST`   | `/api/sessions/:sessionId/messages`        | 🔒 API_TOKEN | WAHA webhook — incoming message                   |

### Controllers

| Old file                          | Action           | New file                         |
| --------------------------------- | ---------------- | -------------------------------- |
| `api/src/controllers/qr.ts`       | Delete           | —                                |
| `api/src/controllers/chat.ts`     | Delete           | —                                |
| `api/src/controllers/outgoing.ts` | Delete (Phase 2) | —                                |
| —                                 | Create           | `api/src/controllers/session.ts` |

- [ ] Update `api/src/routes/index.ts` — mount only `sessions` routes

## Phase 3: Push Outgoing — Update AI Pipeline

- [ ] Modify `api/src/ai/pipeline/steps/outboundPersister.ts` — after persisting reply, call `waha.sendMessage(sessionId, phone, reply)` to push it to WAHA
- [ ] Remove `api/src/models/message.ts` methods: `listOutgoing`, `markDelivered`

## Phase 4: Cleanup Legacy Baileys Code

- [ ] Remove `api/src/utils/wa-bot-db.ts`
- [ ] Remove `WABOT_DATABASE_URL` / `WA_BOT_DATABASE_URL` env var references if present
- [ ] Remove `WAHA_SWAGGER_USERNAME`, `WAHA_SWAGGER_PASSWORD`, `WAHA_BASE_URL` from any remaining files

## Phase 5: Update Tests

- [ ] Rewrite `api/test/wa-session.test.ts` — test session controller endpoints through consolidated routes
- [ ] Remove/add tests affected by controller/route consolidation
- [ ] Run full test suite `bun test`

## Phase 6: Frontend — Dashboard

- [ ] Update `dashboard/src/hooks/useWaStatus.ts` — poll `/api/sessions/:sessionId` (status) and `/api/sessions/:sessionId/qr` (QR) instead of flat `/api/qr/*` endpoints
- [ ] Update `dashboard/src/components/WaSessionTab.tsx` — all action URLs changed to `/api/sessions/:sessionId/*`
- [ ] Update `dashboard/src/pages/Settings.tsx` — match new session endpoints
