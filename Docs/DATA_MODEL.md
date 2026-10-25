# Data Model

Database PostgreSQL pada satu server:

| Database | Dipakai oleh | Model | Jumlah tabel |
|----------|--------------|-------|--------------|
| `wani_api` | `api/` | `api/prisma/models/*.prisma` (14 file) | 18 |
| `postgres` | WAHA | Dikelola WAHA sendiri (bukan Prisma API) | state sesi/autentikasi + media |

ERD visual: [`erd.excalidraw`](erd.excalidraw) / [`ERD.excalidraw.png`](ERD.excalidraw.png).

---

## 1. Prinsip Multi-tenant

- Kolom `ownerId: String` ada di: `Store`, `AiConfig`, `Category`, `Product`, `Customer`, `Conversation`, `Message`, `Order`, `StorePaymentMethod`, `ActivityLog`, `WebSite`, `WebsiteGeneration`, `WaSession`, `ApiKey`.
- **Tanpa relasi Prisma ke `User`** — sengaja, supaya tidak ada dependensi sirkular dan migrasi multi-tenant sederhana. Integritas dijaga di layer model (`ownerFilter`, `ownerWhere`, `updateOwned`, `deleteOwned`).
- Constraint unik per pemilik:

| Model | Unique |
|-------|--------|
| `Store` | `ownerId` |
| `AiConfig` | `ownerId` |
| `WebSite` | `ownerId` |
| `Category` | `[ownerId, name]` |
| `Customer` | `[ownerId, phone]` |
| `WebsiteGeneration` | `[ownerId, slug]` |
| `WaSession` | `ownerId` |

- **Pengecualian**: `UsageCounter` (global, key tanggal) tidak punya `ownerId`. `WaSession` tetap per owner (`ownerId @unique`) dan menyimpan mirror status sesi WAHA.

---

## 2. Tabel `wani_api`

### 2.1 Identitas

**`User`** — akun pemilik toko.

| Field | Tipe | Catatan |
|-------|------|---------|
| `id` | String uuid PK | |
| `name`, `email` (unique), `password` (hash) | String | |
| `role` | String | default `"admin"` |
| `emailVerified` | Boolean | default `false`; login ditolak bila false |
| `emailVerificationToken` (unique), `emailVerificationExpires` | String?, DateTime? | berlaku 24 jam |
| `resetPasswordToken`, `resetPasswordExpires` | String?, DateTime? | berlaku 1 jam |
| `createdAt`, `updatedAt` | DateTime | |

### 2.2 Toko & Website

**`Store`** — profil toko; dibuat otomatis saat register.

`id`, `ownerId` (unique), `businessName` (default `"Toko"`), `phone` (default `""`), `logoUrl`, `address`, `businessHours`, `paymentMethods` (String bebas), `shippingInfo`, `returnPolicy`, `isActive`, `createdAt`, `updatedAt`.

**`StorePaymentMethod`** — metode pembayaran terstruktur (QRIS/transfer/e-wallet/COD).

`id`, `ownerId`, `type` (`QRIS` \| `BANK_TRANSFER` \| `E_WALLET` \| `COD`, disimpan sebagai String), `label`, `accountName`, `accountNumber`, `bankName`, `providerName`, `phoneNumber`, `qrImageUrl`, `instructions`, `isActive`, `sortOrder`, `createdAt`, `updatedAt` · index: `[ownerId]`, `[ownerId, isActive]`. Tidak ada relasi ke `Store` (terhubung lewat `ownerId`).

**`WebSite`** — konfigurasi website.

`id`, `ownerId` (unique), `config` (Json, default `{}`), `published` (Boolean), `createdAt`, `updatedAt`.

Field yang dibaca generator dari `config`: `theme`, `heroHeadline`, `heroSubheadline`, `ctaText`, `heroImageUrl`, `aboutText`, `aboutImageUrl`, `socialMedia`, `contactEmail`, `contactMapsUrl`, `selectedProductIds`.

**`WebsiteGeneration`** — riwayat generate.

`id`, `ownerId`, `slug`, `status`, `productCount`, `message` (Text), `createdAt` · unique `[ownerId, slug]`, index `[ownerId, createdAt]`.

### 2.3 Katalog

**`Category`** — `id`, `ownerId`, `name`, `description?`, `createdAt` · unique `[ownerId, name]` · relasi `products Product[]`.

**`Product`** — `id`, `ownerId`, `categoryId?`, `name`, `description?`, `price` (Decimal 12,2), `stock` (Int), `isAvailable` (Boolean), `imageUrl?`, `createdAt`, `updatedAt` · relasi `category`, `orderItems` · index `[ownerId, name]`.

### 2.4 Percakapan

**`Customer`** — `id`, `ownerId`, `phone`, `name`, `notes?`, `totalOrders` (Int, di-increment saat order dibuat), `createdAt`, `updatedAt` · unique `[ownerId, phone]` · relasi `orders`, `conversations`.

**`Conversation`** — `id`, `ownerId`, `customerId`, `status` (`ACTIVE` \| `RESOLVED` \| `ARCHIVED` \| `ESCALATED`), `lastMessageAt?`, `createdAt`, `updatedAt` · index `[ownerId, status]`, `[ownerId, customerId]`.

**`Message`** — `id`, `ownerId`, `conversationId`, `role` (`CUSTOMER` \| `BOT` \| `HUMAN`), `content` (Text), `msgType` (default `"text"`; dipakai juga `"notification"`), `waMsgId?` (**unique**, untuk dedup pesan masuk & penanda pesan terkirim `sent-<id>`), `metadata` (Json?), `createdAt` · index `[ownerId, conversationId, createdAt]`, `[conversationId, createdAt]`.

### 2.5 Order & Pembayaran

**`Order`** — `id`, `ownerId`, `customerId`, `status` (enum `OrderStatus`, default `PENDING`), `totalAmount` (Decimal 12,2), `source` (default `"wa_chat"`), `stockReleased` (Boolean, penanda stok sudah dikembalikan saat pembatalan), `notes?`, `createdAt`, `updatedAt` · index `[ownerId, customerId]`, `[ownerId, status, createdAt]` · relasi `customer`, `items`, `payment`.

**`OrderItem`** — `id`, `orderId`, `productId`, `qty`, `unitPrice`, `subtotal` · index `[orderId]`, `[productId]`.

**`Payment`** — `id`, `orderId` (**unique**, relasi 1-1), `method?` (enum `PaymentMethod`), `amount`, `status` (enum `PaymentStatus`, default `PENDING`), `paidAt?`, `createdAt`.

### 2.6 AI, Audit, Sesi

**`AiConfig`** — konfigurasi AI per pemilik.

`id`, `ownerId` (unique), `isActive`, `systemPrompt` (Text), `model` (default `deepseek-v4-flash-free`), `greetingMessage?`, `knowledgeBase?` (Text, **tanpa** embedding/RAG), `maxTokens` (2048), `temperature` (Decimal 3,2 default 0.7), `llmBaseUrl?`, `llmApiKey?`, `fallbackModel?`, `createdAt`, `updatedAt`.

**`ActivityLog`** — audit trail.

`id`, `ownerId`, `type`, `referenceId?`, `description` (Text), `metadata` (Json?), `createdAt` · index `[ownerId, createdAt]`, `[ownerId, type, createdAt]`.

**`UsageCounter`** — counter LLM harian (global). PK `id` = `YYYY-MM-DD`; `llmCalls`, `tokensIn`, `tokensOut`, `updatedAt`.

**`WaSession`** — mirror status sesi WhatsApp milik satu owner.

`id` (uuid), `ownerId` (unique), `waSessionName` (unique, pola `store-<ownerId>`), `status` (enum `SessionStatus`, default `STARTING`), `phone?`, `qr?`, `pairingPhone?`, `pairingCode?`, `lastSeenActiveAt?`, `lastSyncedAt?`, `createdAt`, `updatedAt`.

**`ApiKey`** — service API key untuk integrasi (termasuk webhook WAHA).

`id`, `ownerId`, `name`, `prefix` (unique), `secretHash`, `scopes` (String[]), `expiresAt`, `revokedAt?`, `lastUsedAt?`, `createdAt` · index `[ownerId, createdAt]`, `[ownerId, revokedAt]`. Scope: `sessions:messages`, `sessions:qr`, `chat:write`, `outgoing:read`, `outgoing:write`.

---

## 3. Enum

| Enum | Nilai |
|------|-------|
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `COMPLETED`, `CANCELLED` |
| `PaymentMethod` | `CASH`, `TRANSFER`, `QRIS`, `E_WALLET` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `MessageRole` | `CUSTOMER`, `BOT`, `HUMAN` |
| `ConversationStatus` | `ACTIVE`, `RESOLVED`, `ARCHIVED`, `ESCALATED` |
| `SessionStatus` | `STOPPED`, `STARTING`, `SCAN_QR_CODE`, `PASSKEY_REQUIRED`, `PASSKEY_CONFIRMATION_REQUIRED`, `WORKING`, `FAILED` |

Frontend wajib memakai tipe hasil generate Prisma (`as $Enums.OrderStatus`) daripada string literal bebas.

---

## 4. State WAHA (database `postgres`)

WAHA mengelola schema-nya sendiri; API **tidak** memiliki Prisma model untuk tabel-tabel ini. State sesi/autentikasi WhatsApp dan media disimpan di database `postgres` pada server PostgreSQL yang sama (dikonfigurasi lewat `WHATSAPP_SESSIONS_POSTGRESQL_URL` / `WAHA_MEDIA_POSTGRESQL_URL`).

Akibatnya sesi WhatsApp **tahan restart container** tanpa volume file di API. Tabel `WaSession` di `wani_api` hanya mirror status untuk dashboard (status, nomor, QR, pairing), bukan sumber kebenaran autentikasi.

Reset sesi (`POST /api/sessions/reset`) meminta WAHA logout + menghapus sesi, lalu membuat sesi baru dengan nama yang sama. `DELETE /api/sessions` melakukan logout + hapus sesi dan menghapus row `WaSession`.

---

## 5. Aturan Migrasi

1. Ubah schema di `api/prisma/models/*.prisma` (bukan satu `schema.prisma` — Prisma 7 membaca seluruh direktori).
2. Jalankan **selalu** lewat perintah, jangan tulis SQL manual:
   ```bash
   cd api && bun run prisma:migrate -- --name <nama_migrasi>
   ```
3. File di `prisma/migrations/**` **ikut di-commit** — itu bagian dari versioning schema.
4. `generated/prisma/**` (Prisma Client) **gitignored**; di container dibuat saat build, di lokal lewat `bun run prisma:generate`.
5. Container API menjalankan `prisma migrate deploy` di entrypoint sebelum start (lihat [DEPLOYMENT.md](DEPLOYMENT.md)).
6. `prisma.config.ts` menentukan `schema: "prisma/"` dan `migrations.path: "prisma/migrations"`, serta membangun URL dari `DATABASE_HOST/PORT/USER/PASSWORD/NAME`. Migrasi WAHA dikelola WAHA sendiri, bukan lewat Prisma API.

### Migrasi terkait multi-tenant

`20260704223100_add_owner_id` menambahkan kolom `ownerId` + index/unique-nya dan mem-backfill data lama via `COALESCE(subquery user pertama, nil UUID)`. Migrasi ini aman dijalankan pada database kosong maupun yang sudah berisi data.
