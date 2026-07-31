# TODO: Multi-Tenant Data Isolation

**Goal:** Setiap user punya data sendiri (Store, Product, Order, Customer, dll).
Registrasi → login → liat dashboard kosong, bukan data user lain.

- [x] Add `axios` to `api/package.json` under `dependencies`
- [x] Rewrite `api/src/services/waha.ts` — typed wrapper class for WAHA HTTP API
  - [x] Configures axios instance with `WAHA_API_URL` + `WAHA_API_KEY`
  - [x] **Owner-scoped**: Methods keyed by `ownerId` (derived from JWT), not `sessionId` — 1:1 Store↔Session means no multi-session routing
  - [x] **Session endpoints**: `getOrCreateSession(ownerId, storeName)`, `syncSessionWithWaha(ownerId)`, `getSession(ownerId)`, `resetSession(ownerId)`
  - [x] **Auth endpoints**: `requestPairingCode(ownerId, phone)`, reset re-logsout + restarts with `POST /{name}/logout`
  - [x] **Message endpoints**: not yet — pending Phase 3
  - [x] Error handling with axios (timeout, status code checks, 404 → STOPPED on sync)
- [x] **Schema**: `WaSession` converted from singleton `id="default"` to owner-scoped (`ownerId @unique`, `waSessionName @unique`, `SessionStatus` enum)
- [ ] Write unit tests for `api/src/services/waha.ts` (currently only `WaSessionModel` tests exist)

## Phase 2: Consolidate Routes & Controllers under `/sessions`

### Routes

| Old file                     | Action           | New file                     |
| ---------------------------- | ---------------- | ---------------------------- |
| `api/src/routes/qr.ts`       | ✅ Deleted       | —                            |
| `api/src/routes/chat.ts`     | Delete           | —                            |
| `api/src/routes/outgoing.ts` | Delete (Phase 2) | —                            |
| —                            | ✅ Created       | `api/src/routes/sessions.ts` |

### Actual route table (`/api/sessions`, all `requireJwt`)

Because Store↔Session is 1:1, there's no `:sessionId` param — the session is always "yours."

| Method   | Path                          | Description                                       |
| -------- | ----------------------------- | ------------------------------------------------- |
| `GET`    | `/api/sessions`               | Get owner's session (status + qr + pairing in one) |
| `POST`   | `/api/sessions`               | Create or get existing session                    |
| `POST`   | `/api/sessions/sync`          | Reconcile DB state with WAHA live state           |
| `POST`   | `/api/sessions/reset`         | Logout + restart sesi                             |
| `POST`   | `/api/sessions/pairing`       | Request pairing code for a phone number           |
| `POST`   | `/api/sessions/refresh-pairing` | Clear pairing code, WAHA will generate a new one |

### Controllers

| Old file                          | Action           | New file                         |
| --------------------------------- | ---------------- | -------------------------------- |
| `api/src/controllers/qr.ts`       | ✅ Deleted       | —                                |
| `api/src/controllers/chat.ts`     | Delete           | —                                |
| `api/src/controllers/outgoing.ts` | Delete (Phase 2) | —                                |
| —                                 | ✅ Updated       | `api/src/controllers/sessions.ts` |

- [x] Update `api/src/routes/index.ts` — mount only `sessions` routes (qr removed)

## Phase 3: Push Outgoing — Update AI Pipeline

- [ ] Modify `api/src/ai/pipeline/steps/outboundPersister.ts` — after persisting reply, call `waha.sendMessage(sessionId, phone, reply)` to push it to WAHA
- [ ] Remove `api/src/models/message.ts` methods: `listOutgoing`, `markDelivered`
- [ ] Add `sendText(waSessionName, to, text)` to `WahaService`

## Tahap 3: Cleanup — Remove legacy Baileys references

- [ ] Remove `api/src/utils/wa-bot-db.ts`
- [ ] Remove `WABOT_DATABASE_URL` / `WA_BOT_DATABASE_URL` env var references if present
- [ ] Remove `WAHA_SWAGGER_USERNAME`, `WAHA_SWAGGER_PASSWORD`, `WAHA_BASE_URL` from any remaining files

## Tahap 4: Controllers + AI Pipeline — Scope queries by `ownerId`

- [x] Rewrite `api/test/wa-session.test.ts` — test WaSessionModel owner-scoped methods
- [ ] Remove/add tests affected by controller/route consolidation
- [x] Run full test suite `bun test` (221 pass, 33 pre-existing failures in middleware/circuit-breaker/order/integration tests — none session-related)

## Tahap 5: Frontend — Verify

- [ ] Update `dashboard/src/hooks/useWaStatus.ts` — replace `/qr` + `/qr/status` polls with single `GET /api/sessions`
- [ ] Update `dashboard/src/pages/Settings.tsx` — repoint `/qr/reset` → `/sessions/reset`, `/qr/pairing` → `/sessions/pairing`, `/qr/refresh-pairing` → `/sessions/refresh-pairing`
- [ ] Update `dashboard/src/components/WaSessionTab.tsx` — match new session endpoints
