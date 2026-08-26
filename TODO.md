# TODO: Multi-Tenant Data Isolation

**Goal:** Setiap user punya data sendiri (Store, Product, Order, Customer, dll).
Registrasi → login → liat dashboard kosong, bukan data user lain.

- [x] Add `axios` to `api/package.json` under `dependencies`
- [x] Rewrite `api/src/services/waha.ts` — typed wrapper class for WAHA HTTP API
  - [x] Configures axios instance with `WAHA_API_URL` + `WAHA_API_KEY`
  - [x] **Owner-scoped**: Methods keyed by `ownerId` (derived from JWT), not `sessionId` — 1:1 Store↔Session means no multi-session routing
  - [x] **Session endpoints**: `getOrCreateSession(ownerId, storeName)`, `syncSessionWithWaha(ownerId)`, `getSession(ownerId)`, `resetSession(ownerId)`
  - [x] **Auth endpoints**: `requestPairingCode(ownerId, phone)`, reset re-logsout + restarts with `POST /{name}/logout`
  - [x] **Message endpoints**: `sendText(ownerId, phone, text)` + webhook `POST /sessions/messages` (WAHA shape + legacy)
  - [x] Error handling with axios (timeout, status code checks, 404 → STOPPED on sync)
- [x] **Schema**: `WaSession` converted from singleton `id="default"` to owner-scoped (`ownerId @unique`, `waSessionName @unique`, `SessionStatus` enum)
- [x] Write unit tests for `api/src/services/waha.ts` — `api/test/services/waha.test.ts` 29 tests (all WahaService methods, 409/404 handling, QR/pairing) + `api/test/waha.test.ts` removed (duplicate)

## Phase 2: Consolidate Routes & Controllers under `/sessions`

### Routes

| Old file                     | Action           | New file                     |
| ---------------------------- | ---------------- | ---------------------------- |
| `api/src/routes/qr.ts`       | ✅ Deleted       | —                            |
| `api/src/routes/chat.ts`     | ✅ Deleted       | —                            |
| `api/src/routes/outgoing.ts` | ✅ Deleted       | —                            |
| —                            | ✅ Created       | `api/src/routes/sessions.ts` |

### Actual route table (`/api/sessions`)

Because Store↔Session is 1:1, there's no `:sessionId` param — the session is always "yours."

| Method   | Path                          | Auth            | Description                                       |
| -------- | ----------------------------- | --------------- | ------------------------------------------------- |
| `GET`    | `/api/sessions`               | 🔒 JWT          | Get owner's session (status + qr + pairing in one) |
| `POST`   | `/api/sessions`               | 🔒 JWT          | Create or get existing session                    |
| `POST`   | `/api/sessions/sync`          | 🔒 JWT          | Reconcile DB state with WAHA live state           |
| `POST`   | `/api/sessions/reset`         | 🔒 JWT          | Logout + restart sesi                             |
| `POST`   | `/api/sessions/pairing`       | 🔒 JWT          | Request pairing code for a phone number           |
| `POST`   | `/api/sessions/refresh-pairing` | 🔒 JWT        | Clear pairing code, WAHA will generate a new one |
| `DELETE` | `/api/sessions`               | 🔒 JWT          | Logout + delete session (disconnect)              |
| `POST`   | `/api/sessions/messages`      | 🔒 API_TOKEN    | WAHA webhook — incoming message (WAHA shape + legacy) |

### Controllers

| Old file                          | Action           | New file                         |
| --------------------------------- | ---------------- | -------------------------------- |
| `api/src/controllers/qr.ts`       | ✅ Deleted       | —                                |
| `api/src/controllers/chat.ts`     | ✅ Deleted       | —                                |
| `api/src/controllers/outgoing.ts` | ✅ Deleted       | —                                |
| —                                 | ✅ Updated       | `api/src/controllers/sessions.ts` (+ `postMessage` webhook) |

- [x] Update `api/src/routes/index.ts` — mount only `sessions` routes (qr removed)

## Phase 3: Push Outgoing — Update AI Pipeline

- [x] Modify `api/src/ai/pipeline/steps/outboundPersister.ts` — after persisting reply, call `wahaService.sendText(ownerId, phone, reply)` to push it to WAHA (fail-open)
- [x] Remove `api/src/models/message.ts` methods: `listOutgoing`, `markDelivered` (→ `markSent(id, waMsgId)` dengan id WAHA asli)
- [x] Add `sendText(ownerId, phone, text)` to `WahaService`
- [x] Fix: pairing request body `{phoneNumber}` sesuai docs WAHA
- [x] Add `WahaService.refreshQr` — QR di-refresh saat sync ketika `SCAN_QR_CODE`

## Tahap 3: Cleanup — Remove legacy Baileys references

- [x] Remove `api/src/utils/wa-bot-db.ts`
- [x] Remove `WABOT_DATABASE_URL` / `WA_BOT_DATABASE_URL` env var references if present
- [x] Remove outgoing routes/controllers (`/api/outgoing`)
- [x] `routes/chat.ts` webhook dipindah ke `POST /api/sessions/messages` (WAHA shape + legacy) — `api/src/routes/chat.ts` + `api/src/controllers/chat.ts` deleted, `api/src/routes/index.ts` updated

## Tahap 4: Controllers + AI Pipeline — Scope queries by `ownerId`

- [x] Rewrite `api/test/wa-session.test.ts` — test WaSessionModel owner-scoped methods
- [x] Remove/add tests affected by controller/route consolidation — fixed `api/test/services/waha.test.ts` (expect object `where`), fixed `api/test/pipeline/outboundPersister.test.ts` (patch wahaService.sendText directly, not mock.module), fixed `api/src/middleware/error.ts` (include details/stack when `!== production`)
- [x] Run full test suite `bun test` — 285 pass, 0 fail, 2 skip (api/test) — sebelumnya 221 pass, 33 fail

## Tahap 5: Frontend — Verify

- [x] Update `dashboard/src/hooks/useWaStatus.ts` — poll `POST /api/sessions/sync` (live status + QR refresh), mapping status enum → UI (`WORKING`=connected, `SCAN_QR_CODE`/`STARTING`/`PASSKEY_*`=connecting, `STOPPED`/`FAILED`=disconnected)
- [x] Update `dashboard/src/pages/Settings.tsx` — repoint ke `/sessions/reset`, `/sessions/pairing`, `/sessions/refresh-pairing`; disconnect → `DELETE /api/sessions`
- [x] Update `dashboard/src/components/WaSessionTab.tsx` — verified stable with `/api/sessions` endpoints, tambah `pairingPhone` display, statusConfig verified, QR/pairing sections stable
