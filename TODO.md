# BAHA — WAHA Migration To-Do List

## Phase 1: Create WAHA Service

- [ ] Add `axios` to `api/package.json` under `dependencies`
- [ ] Create `api/src/services/waha.ts` — typed wrapper class for WAHA HTTP API
  - Configures axios instance with `WAHA_BASE_URL` (default `http://localhost:3000`), `WAHA_API_KEY` in request interceptor
  - **Session endpoints**: `startSession`, `getSessions`, `getSession`, `stopSession`, `logout`
  - **Auth endpoints**: `getQr` (base64), `requestPairingCode(phone)`
  - **Message endpoints**: `sendText(to, text)`, `sendImage(to, image, caption?)`, `sendButtons`, `sendList`, `sendReaction`
  - **Utility endpoints**: `health`, `getStatus`
  - Error handling with axios interceptors (logging, error normalization, retry)
- [ ] Add `WAHA_SESSION_ID` env var (default `"default"`) to root `.env` and `.env.example`
- [ ] Write unit tests for `api/src/services/waha.ts`

## Phase 2: Push Outgoing — Update AI Pipeline

- [ ] Modify `api/src/ai/pipeline/steps/outboundPersister.ts` — after persisting reply, call `waha.sendMessage(phone, reply)` to push it to WAHA
- [ ] Remove `api/src/models/message.ts` methods: `listOutgoing`, `markDelivered`
- [ ] Remove `api/src/controllers/outgoing.ts`
- [ ] Remove `api/src/routes/outgoing.ts`
- [ ] Update `api/src/routes/index.ts` — remove outgoing route mount

## Phase 3: Integrate WAHA Service into Controllers

- [ ] Update `api/src/controllers/qr.ts` — use `waha.getQr()`, `waha.requestPairingCode()`, `waha.getStatus()`, `waha.startSession()` etc. for endpoints that need to proactively call WAHA
- [ ] Update `api/src/controllers/chat.ts` — keep webhook as-is (WAHA pushes inbound here), push outgoing handled in Phase 2

## Phase 4: Cleanup Legacy Baileys Code

- [ ] Remove `api/src/utils/wa-bot-db.ts`
- [ ] Remove `WABOT_DATABASE_URL` / `WA_BOT_DATABASE_URL` env var references if present
- [ ] Remove `WAHA_SWAGGER_USERNAME`, `WAHA_SWAGGER_PASSWORD`, `WAHA_BASE_URL` from any remaining env files (these were api-specific, now dead since api/.env is gone)

## Phase 5: Update Tests

- [ ] Remove/update `api/test/wa-session.test.ts` — test through waha service instead
- [ ] Remove/add tests affected by outgoing controller removal
- [ ] Run full test suite `bun test`

## Phase 6: Frontend — Dashboard

- [ ] Review `dashboard/src/hooks/useWaStatus.ts` — if polling endpoints changed, update URLs
- [ ] Review `dashboard/src/components/WaSessionTab.tsx` — ensure all actions match updated controller endpoints
