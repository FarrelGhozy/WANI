# TODO: Multi-Tenant Data Isolation

**Goal:** Setiap user punya data sendiri (Store, Product, Order, Customer, dll).
Registrasi → login → liat dashboard kosong, bukan data user lain.

## Tahapan

### Tahap 1: ✅ Prisma Schema — Add `ownerId` ke semua model

- [x] 1a. `Store` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1b. `AiConfig` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1c. `WebSite` — ganti `id @default("default")` → `id @default(uuid())`, tambah `ownerId String @unique`
- [x] 1d. `Category` — tambah `ownerId String`
- [x] 1e. `Product` — tambah `ownerId String`
- [x] 1f. `Customer` — tambah `ownerId String` (hapus `@@unique([phone])`, ganti `@@unique([ownerId, phone])`)
- [x] 1g. `Order` — tambah `ownerId String`
- [x] 1h. `Conversation` — tambah `ownerId String`
- [x] 1i. `Message` — tambah `ownerId String`
- [x] 1j. `StorePaymentMethod` — tambah `ownerId String` (ganti `storeId @default("default")` jadi `ownerId`)
- [x] 1k. `ActivityLog` — tambah `ownerId String`
- [x] 1l. `WebsiteGeneration` — tambah `ownerId String`
- [x] 1m. Run `bun run prisma:migrate`

### Tahap 2: ✅ Middleware — Owner Scoping

- [x] 2a. Buat helper `ownerFilter()` / `getOwnerId()` di `api/src/middleware/owner.ts`
- [x] 2b. Pastikan `req.user.id` selalu ada setelah `requireJwt`

### Tahap 3: ✅ Migration — Backfill data existing

- [x] 3a. Migration `20260704223100_add_owner_id` handles backfill via `COALESCE(subquery, nil_uuid)` — works on fresh & existing deployments
- [x] 3b. Already applied via `bun run prisma:migrate`

### Tahap 4: ✅ Controllers + AI Pipeline — Scope queries by `ownerId`

- [x] 4a. `store.ts` — `getOwnerId(req)` for JWT, `getOwnerIdOrFirst(req)` for public
- [x] 4b. `ai-config.ts` — same pattern
- [x] 4c. `product.ts` — `ProductModel.list/create/update` now accept ownerId
- [x] 4d. `category.ts` — `CategoryModel.listAll/createCategory` now accept ownerId
- [x] 4e. `order.ts` — `OrderModel.list/createFromItems/getStats/getStatusCounts` now accept ownerId
- [x] 4f. `customer.ts` — `CustomerModel.list/upsertByOwnerPhone` now accept ownerId
- [x] 4g. `conversation.ts` — `ConversationModel.findOrCreateActive` now accepts ownerId
- [x] 4h. `store-payment.ts` — `listByOwner/listActive/hasAny` instead of `listByStore`/`storeId`
- [x] 4i. `website.ts` — all queries scoped by ownerId
- [x] 4j. `log.ts` — `ActivityLogModel.log/list` now accept ownerId
- [x] 4k. `upload.ts` — unchanged (handles file upload, no owner scope needed)
- [x] 4l. `qr.ts` — WaSession tetap global (no change)
- [x] 4m. `auth.ts` — no change (User model sendiri)
- [x] 4n. `dashboard.ts` — `getDashboardStats(ownerId)` scopes all counts
- [x] 4o. AI pipeline: `PipelineInput.ownerId` → `PipelineContext.ownerId` → `ActionCtx.ownerId` propagated through all steps (contextLoader → products/payment/store/aiConfig by owner, ensureCustomer → upsertByOwnerPhone, actions → order/activityLog scoped, firewall/outputGuardrails → activityLog scoped)
- [x] 4p. WA bot: sends `ownerId` from `OWNER_ID` env var in chat requests
- [x] 4q. All 223 tests pass

### Tahap 5: Frontend — Verify

- [ ] 5a. Login sebagai user baru → liat dashboard kosong
- [ ] 5b. Tambah store → setup wizard
- [ ] 5c. Sidebar tampilin nama user (udah ada dari `useAuth`)
- [ ] 5d. Test CRUD semua fitur sebagai user baru

### Tahap 6: Test

- [ ] 6a. Manual test: register 2 user, verify data terisolasi
- [ ] 6b. Test WA bot flow masih jalan
