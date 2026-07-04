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

### Tahap 3: Migration Script — Backfill data existing

- [ ] 3a. Buat script `api/scripts/backfill-owner.ts` — assign semua data ke user pertama (atau prompt user mana)
- [ ] 3b. Run script & verify

### Tahap 4: Controllers — Scope queries by `ownerId`

- [ ] 4a. `store.ts` — semua queries pake `ownerId: req.user.id`
- [ ] 4b. `ai-config.ts` — semua queries pake `ownerId`
- [ ] 4c. `products.ts` — semua queries pake `ownerId`
- [ ] 4d. `categories.ts` — semua queries pake `ownerId`
- [ ] 4e. `orders.ts` — semua queries pake `ownerId`
- [ ] 4f. `customers.ts` — semua queries pake `ownerId`
- [ ] 4g. `conversations.ts` — semua queries pake `ownerId`
- [ ] 4h. `payment-methods.ts` — semua queries pake `ownerId`
- [ ] 4i. `website.ts` — semua queries pake `ownerId`
- [ ] 4j. `logs.ts` — semua queries pake `ownerId`
- [ ] 4k. `upload.ts` — verify, mungkin perlu owner context
- [ ] 4l. `qr.ts` — WaSession tetap global (no change)
- [ ] 4m. `auth.ts` — no change (User model sendiri)
- [ ] 4n. `dashboard.ts` — stats perlu di-scope

### Tahap 5: Routes — Verify middleware chain

- [ ] 5a. Cek semua route public → tetap public (GET products, orders, dll untuk WA bot)
- [ ] 5b. Cek route yg pake `requireAuth` (bot) → no ownerId (WaSession, chat global)
- [ ] 5c. Cek route yg pake `requireJwt` (dashboard) → harus pake owner scoping

### Tahap 6: AI Pipeline — Scope context loading

- [ ] 6a. `pipeline.ts` — `loadContext()` harus pake owner ID dari mana? Bot message → cari owner dari customer/conversation
- [ ] 6b. Atau: bot punya `ownerId` default (system user)

### Tahap 7: Frontend — Verify

- [ ] 7a. Login sebagai user baru → liat dashboard kosong
- [ ] 7b. Tambah store → setup wizard
- [ ] 7c. Sidebar tampilin nama user (udah ada dari `useAuth`)
- [ ] 7d. Test CRUD semua fitur sebagai user baru

### Tahap 8: Test

- [ ] 8a. `bun test` di API — update test yg broken karena ownerId
- [ ] 8b. Manual test: register 2 user, verify data terisolasi
- [ ] 8c. Test WA bot flow masih jalan
