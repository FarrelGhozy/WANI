# Xendit Platform API — Integrasi Pembayaran WANI

> **Opsi 1:** Xendit Platform API (Sub-Merchant)
> Dana langsung ke rekening UMKM, WANI ambil fee opsional.

---

## Daftar Isi

1. [Arsitektur Konsep](#1-arsitektur-konsep)
2. [Data Model (Prisma)](#2-data-model-prisma)
3. [Env Variables](#3-env-variables)
4. [Flow End-to-End](#4-flow-end-to-end)
5. [Xendit API yang Digunakan](#5-xendit-api-yang-digunakan)
6. [Backend: File & Endpoint Baru](#6-backend-file--endpoint-baru)
7. [Dashboard: UI Baru](#7-dashboard-ui-baru)
8. [WA Bot: Integrasi Payment Link](#8-wa-bot-integrasi-payment-link)
9. [Webhook Handler](#9-webhook-handler)
10. [Security & Error Handling](#10-security--error-handling)
11. [Implementasi Bertahap (Phase)](#11-implementasi-bertahap-phase)

---

## 1. Arsitektur Konsep

```
┌──────────────────────────────────────────────────────────┐
│                         WANI Platform                     │
│                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  WA Bot      │   │  Dashboard   │   │  Backend API │  │
│  │  (baileys)   │   │  (React)     │   │  (Express)   │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘  │
│         │                  │                   │          │
│         └──────────────────┼───────────────────┘          │
│                            │                              │
│                   ┌────────▼────────┐                     │
│                   │  Payment Module  │  ← NEW             │
│                   │  (Xendit Client) │                     │
│                   └────────┬────────┘                     │
│                            │                              │
└────────────────────────────┼──────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   Xendit API    │
                    │  (Platform)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
       │ Sub-Merchant │ │ Sub-Mer│ │ Sub-Merchant│
       │   UMKM A    │ │  UMKM B │ │   UMKM C    │
       │ Rek: BCA X  │ │ Rek: BNI│ │ Rek: Mandiri│
       └─────────────┘ └─────────┘ └─────────────┘

ALIRAN DANA (otomatis):
  Customer bayar QRIS/VA/CC
        │
        ▼
   Xendit Platform (akun WANI)
        │
        ├─ Fee WANI (0%–5%, bisa diatur)
        └─ Sisa dana → langsung ke rekening UMKM (sub-merchant)
```

### Kenapa Xendit Platform?

| Fitur | Xendit | Midtrans |
|-------|--------|----------|
| Sub-merchant langsung | ✅ **Platform API** | ❌ Midtrans tidak punya fitur sub-merchant otomatis |
| Dana langsung ke UMKM | ✅ | ❌ Dana masuk ke akun platform dulu |
| QRIS dinamis | ✅ | ✅ |
| Virtual Account | ✅ | ✅ |
| Convenience Store | ✅ | ✅ |
| Webhook callback | ✅ | ✅ |
| Dashboard monitoring | ✅ | ✅ |

---

## 2. Data Model (Prisma)

### 2.1. Store — Tambah field Xendit

```prisma
// api/prisma/models/store.prisma
model Store {
  id             String   @id @default("default")
  businessName   String   @default("Toko")
  phone          String   @default("")
  logoUrl        String?
  address        String?
  businessHours  String?
  paymentMethods String?
  shippingInfo   String?
  returnPolicy   String?
  isActive       Boolean  @default(true)

  // ── NEW: Xendit Sub-Merchant Fields ──
  xenditUserId       String?   // Xendit user_id untuk sub-merchant ini
  xenditAccountEmail String?   // Email terdaftar di Xendit
  xenditStatus       String?   // ACTIVE | PENDING | REJECTED | INACTIVE
  xenditKycStatus    String?   // VERIFIED | UNVERIFIED | PENDING
  xenditFeePercent   Float?    // Fee WANI (%) untuk toko ini (default: 2.0)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### 2.2. Payment — Tambah field Xendit

```prisma
// api/prisma/models/order.prisma
model Payment {
  id        String         @id @default(uuid())
  orderId   String         @unique
  method    PaymentMethod?
  amount    Decimal        @db.Decimal(12, 2)
  status    PaymentStatus  @default(PENDING)
  paidAt    DateTime?
  createdAt DateTime       @default(now())

  // ── NEW: Xendit Payment Tracking ──
  xenditInvoiceId String?  // Xendit invoice_id
  xenditChannel   String?  // QRIS, VIRTUAL_ACCOUNT, RETAIL_OUTLET, etc
  xenditPaymentId String?  // Xendit payment_id (after paid)
  xenditFeeAmount Decimal? @db.Decimal(12, 2)  // Fee yang dipotong Xendit
  xenditRawJson   String?  // Raw webhook payload (JSON string, untuk debugging)

  order Order @relation(fields: [orderId], references: [id])
}
```

### 2.3. Enum PaymentMethod — Tambah Xendit

```prisma
// api/prisma/models/enums.prisma
enum PaymentMethod {
  CASH
  TRANSFER
  QRIS
  XENDIT_INVOICE    // NEW: Generic Xendit invoice (bisa milih metode di halaman Xendit)
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  EXPIRED           // NEW: Xendit invoice expired
}
```

---

## 3. Env Variables

```env
# ── NEW: Xendit Configuration ──
XENDIT_API_KEY=                        # API Key dari dashboard Xendit (Production Key)
XENDIT_WEBHOOK_VERIFICATION_TOKEN=     # Verification token dari Xendit webhook settings
XENDIT_IS_PRODUCTION=false             # false = sandbox, true = production
XENDIT_PLATFORM_FEE_DEFAULT=2.0        # Default fee % WANI untuk setiap transaksi
XENDIT_INVOICE_EXPIRY_MINUTES=1440     # 24 jam expiry
XENDIT_SUCCESS_REDIRECT_URL=           # (opsional) URL redirect setelah bayar sukses
```

---

## 4. Flow End-to-End

### Flow A: Order via WhatsApp → Payment Link

```
[CUSTOMER]                          [WANI AI BOT]                      [XENDIT]
    │                                     │                               │
    │  "Saya mau pesan 2x Nasi Goreng"    │                               │
    │────────────────────────────────────►│                               │
    │                                     │                               │
    │                                     │  AI detect intent="order"     │
    │                                     │  Buat Order (status: PENDING) │
    │                                     │                               │
    │                                     │  POST /api/payment/invoice    │
    │                                     │  (orderId, customer, amount)  │
    │                                     │──────────────────────────────►│
    │                                     │                               │
    │                                     │  Response: invoice_url        │
    │                                     │◄──────────────────────────────│
    │                                     │                               │
    │  "Pesanan diterima!🎉               │                               │
    │   • Nasi Goreng × 2 = Rp50,000     │                               │
    │   Total: Rp50,000                   │                               │
    │                                     │                               │
    │   💳 Bayar sekarang:                │                               │
    │   https://checkout.xendit.co/xxx   │                               │
    │   (Atau scan QRIS di bawah)        │                               │
    │   [QR CODE IMAGE]                  │                               │
    │                                     │                               │
    │   Kode: INV-20260625-XXX           │                               │
    │   ⏳ Expired: 24 jam               │                               │
    │   Setelah bayar, konfirmasi        │                               │
    │   otomatis 😊"                     │                               │
    │◄────────────────────────────────────│                               │
    │                                     │                               │
```

### Flow B: Customer Bayar → Webhook → Order PAID

```
[CUSTOMER]                      [XENDIT]                   [WANI API]
    │                              │                          │
    │  Buka link & bayar QRIS      │                          │
    │─────────────────────────────►│                          │
    │                              │                          │
    │                              │  POST /api/payment/      │
    │                              │  webhook/xendit          │
    │                              │  (invoice_id, status,    │
    │                              │   payment_method, amount) │
    │                              │─────────────────────────►│
    │                              │                          │
    │                              │  1. Verify signature     │
    │                              │  2. Find Order by        │
    │                              │     xenditInvoiceId      │
    │                              │  3. Update Payment:      │
    │                              │     status = PAID        │
    │                              │     method = QRIS        │
    │                              │     paidAt = now()       │
    │                              │  4. Update Order:        │
    │                              │     status = CONFIRMED   │
    │                              │     (auto-confirm        │
    │                              │      kalau PAID)         │
    │                              │  5. Log activity         │
    │                              │                          │
    │                              │  Response: 200 OK        │
    │                              │◄─────────────────────────│
    │                              │                          │
    │                              │                          │
    │  (di background)             │                          │
    │  WA Bot kirim notifikasi:    │                          │
    │  "✅ Pembayaran Rp50.000     │                          │
    │   berhasil! Pesanan kamu    │                          │
    │   sedang diproses."         │                          │
```

### Flow C: Dashboard Admin — Manage Sub-Merchant

```
[ADMIN]                    [DASHBOARD]               [BACKEND]            [XENDIT]
  │                            │                        │                    │
  │  Buka Settings →           │                        │                    │
  │  Payment/Xendit Tab        │                        │                    │
  │───────────────────────────►│                        │                    │
  │                            │  GET /api/store/xendit │                    │
  │                            │───────────────────────►│                    │
  │                            │  data: xenditStatus,   │                    │
  │                            │  xenditUserId, etc     │                    │
  │                            │◄───────────────────────│                    │
  │                            │                        │                    │
  │  Isi form:                 │                        │                    │
  │  - Nama Pemilik            │                        │                    │
  │  - Email                   │                        │                    │
  │  - No Rekening             │                        │                    │
  │  - Bank                    │                        │                    │
  │  - Alamat                  │                        │                    │
  │───────────────────────────►│                        │                    │
  │                            │  POST /api/store/      │                    │
  │                            │  register-merchant     │                    │
  │                            │───────────────────────►│                    │
  │                            │                        │ POST /v2/users    │
  │                            │                        │──────────────────►│
  │                            │                        │ user_id, status   │
  │                            │                        │◄──────────────────│
  │                            │                        │                    │
  │                            │                        │ POST /v2/users/   │
  │                            │                        │ :id/accounts      │
  │                            │                        │──────────────────►│
  │                            │                        │ account_id        │
  │                            │                        │◄──────────────────│
  │                            │                        │                    │
  │                            │  Update Store record   │                    │
  │                            │◄───────────────────────│                    │
  │  ✅ "Sub-merchant aktif"   │                        │                    │
  │◄───────────────────────────│                        │                    │
```

---

## 5. Xendit API yang Digunakan

### 5.1. Create Customer (Register Sub-Merchant)
```
POST https://api.xendit.co/customers
Authorization: Basic base64(xenditApiKey + ":")

Body:
{
  "reference_id": "umkm-wani-store-default",  // unique per toko
  "given_names": "Nama Toko",
  "email": "toko@email.com",
  "mobile_number": "+62812xxxx",
  "address": "Alamat toko"
}

Response:
{
  "id": "cust-xxx",
  "reference_id": "umkm-wani-store-default",
  "status": "ACTIVE",
  "type": "INDIVIDUAL",
  ...
}
```

### 5.2. Create Invoice (Buat Payment Link)
```
POST https://api.xendit.co/v2/invoices
Authorization: Basic base64(xenditApiKey + ":")

Body:
{
  "external_id": "order-<orderId>",        // UNIQUE per order
  "amount": 50000,
  "description": "Pesanan dari <businessName>",
  "customer": {
    "given_names": "Nama Customer",
    "mobile_number": "+62812xxxx",
    "email": "customer@email.com"
  },
  "customer_notification_preference": {
    "invoice_paid": ["whatsapp"]
  },
  "success_redirect_url": "https://wani.app/payment/success",
  "failure_redirect_url": "https://wani.app/payment/failed",
  "currency": "IDR",
  "fixed_va": false,
  "items": [
    {
      "name": "Nasi Goreng",
      "quantity": 2,
      "price": 25000,
      "category": "FOOD"
    }
  ],
  "fees": [
    {
      "type": "PLATFORM",
      "value": 1000         // fee WANI (optional)
    }
  ]
}

Response:
{
  "id": "inv-xxx",
  "external_id": "order-<orderId>",
  "user_id": "user-xxx",
  "status": "PENDING",
  "merchant_name": "WANI Platform",
  "amount": 50000,
  "invoice_url": "https://checkout.xendit.co/web/xxx",
  "expiry_date": "2026-06-26T00:00:00Z",
  "available_banks": [...],
  "available_retail_outlets": [...],
  "available_ewallets": [...],
  "available_qr_codes": [...]
}
```

### 5.3. Register Sub-Merchant Account (Payout Channel)
```
POST https://api.xendit.co/v2/users
Authorization: Basic base64(xenditApiKey + ":")

Body:
{
  "email": "toko@email.com",
  "given_names": "Nama Pemilik",
  "type": "INDIVIDUAL",
  "business_profile": {
    "business_name": "Nama Toko",
    "business_type": "RETAIL",
    "address": "Alamat"
  }
}

Response:
{
  "id": "usr-xxx",
  "email": "toko@email.com",
  "status": "ACTIVE",
  "kyc_status": "VERIFIED"
  ...
}
```

### 5.4. Create Payment Channel untuk Sub-Merchant
```
POST https://api.xendit.co/v2/users/:user_id/accounts
Authorization: Basic base64(xenditApiKey + ":")

Body:
{
  "type": "BANK_ACCOUNT",
  "bank_account": {
    "bank_name": "BCA",
    "bank_account_holder_name": "Nama Pemilik",
    "bank_account_number": "1234567890"
  }
}
```

### 5.5. Webhook Event
```
POST <WANI_WEBHOOK_URL>/api/payment/webhook/xendit
Content-Type: application/json
x-callback-token: <verification_token>

Event: "payment.paid"  (juga: payment.expired, payment.failed)
Body:
{
  "id": "inv-xxx",
  "external_id": "order-<orderId>",
  "user_id": "usr-xxx",
  "status": "PAID",                // PAID | EXPIRED | FAILED
  "amount": 50000,
  "paid_amount": 50000,
  "payment_method": "QRIS",
  "payment_channel": "QRIS",
  "paid_at": "2026-06-25T10:30:00Z",
  "payment_id": "payment-xxx",
  "fee_amount": 1000,
  "bank": null,
  "issuer": null,
  "metadata": null
}
```

### Catatan Penting soal Xendit Platform API

> **⚠️ Update 2026:** Xendit Platform API memungkinkan WANI jadi *platform aggregator*. Detail lengkap endpoint dan dokumentasi terbaru ada di [Xendit Docs — Platform API](https://docs.xendit.co/platform). Yang penting untuk design ini:
>
> 1. WANI daftar sebagai **Platform** di dashboard Xendit
> 2. Setiap UMKM didaftarkan sebagai **sub-merchant** via API
> 3. Dana transaksi otomatis disalurkan ke rekening sub-merchant
> 4. WANI bisa set **platform fee** per transaksi
>
> Endpoint di atas berdasarkan publikasi Xendit 2025-2026. Template disediakan — sesuaikan parameter dengan latest API docs saat implementasi.

---

## 6. Backend: File & Endpoint Baru

### 6.1. Struktur File Baru

```
api/src/
├── payment/
│   ├── xendit-client.ts      # HTTP client wrapper untuk Xendit API
│   ├── xendit-webhook.ts     # Webhook handler (verify + process)
│   └── types.ts              # TypeScript types untuk Xendit response
├── controllers/
│   └── payment.ts            # REST controller: create invoice, webhook handler
├── models/
│   └── payment.ts            # PaymentModel (extend existing)
├── routes/
│   └── payment.ts            # Routes: POST invoice, webhook handler
└── schemas/
    └── payment.ts            # Zod schemas untuk payment endpoints
```

### 6.2. Backend Endpoint Baru

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/payment/invoice` | 🔒 JWT | Create Xendit invoice & payment link untuk order |
| `POST` | `/api/payment/webhook/xendit` | — (token auth) | Xendit webhook callback |
| `GET` | `/api/payment/invoice/:orderId` | — | Get invoice status by orderId |
| `POST` | `/api/store/register-merchant` | 🔒 JWT | Register current store as Xendit sub-merchant |
| `GET` | `/api/store/xendit-status` | — | Get Xendit sub-merchant status |

### 6.3. Detail Controller

#### `POST /api/payment/invoice`
```typescript
// Request Body
{
  "orderId": "uuid-xxx",
  "customerPhone": "62812xxxx",
  "customerName": "Budi",
  "successRedirectUrl"?: "https://..."
}

// Response 201
{
  "status": "success",
  "data": {
    "invoiceUrl": "https://checkout.xendit.co/web/xxx",
    "invoiceId": "inv-xxx",
    "expiryDate": "2026-06-26T00:00:00Z",
    "amount": 50000,
    "availableMethods": ["QRIS", "VIRTUAL_ACCOUNT", "RETAIL_OUTLET"]
  }
}
```

#### `POST /api/payment/webhook/xendit`
```typescript
// Headers: x-callback-token: <verification_token>
// Body: Raw Xendit webhook payload (lihat 5.5)

// Response 200
{ "status": "success", "message": "webhook processed" }

// Logic:
// 1. Verify x-callback-token === XENDIT_WEBHOOK_VERIFICATION_TOKEN
// 2. Extract external_id → cari orderId
// 3. Update Payment record
// 4. If status === "PAID":
//    - Update Payment: status=PAID, method=payment_channel
//    - Update Order: status=CONFIRMED (auto-confirm)
//    - Kirim notifikasi ke WA Bot (fire-and-forget)
// 5. Log webhook ke ActivityLog
```

#### `POST /api/store/register-merchant`
```typescript
// Request Body
{
  "ownerName": "Farrel Ghozy",           // given_names
  "ownerEmail": "farrel@wani.app",       // email
  "phone": "62812xxxx",                  // mobile_number
  "address": "Alamat lengkap",
  "businessName": "Toko Sembako Maju",   // business_name
  "bankName": "BCA",                     // bank
  "bankAccountName": "Farrel Ghozy",     // bank_account_holder_name
  "bankAccountNumber": "1234567890"      // bank_account_number
}

// Response 201
{
  "status": "success",
  "data": {
    "xenditUserId": "usr-xxx",
    "xenditStatus": "ACTIVE",
    "xenditKycStatus": "VERIFIED"
  }
}
```

### 6.4. Xendit Client (`xendit-client.ts`)

```typescript
// Wrapper yang handle:
// - Base64 Basic Auth
// - Base URL switching (sandbox vs production)
// - Error handling & retry
// - Logging

class XenditClient {
  private apiKey: string
  private baseUrl: string  // https://api.xendit.co (sandbox/production)

  constructor() {
    this.apiKey = env.xendit.apiKey
    this.baseUrl = env.xendit.isProduction
      ? "https://api.xendit.co"
      : "https://api.xendit.co"  // Xendit uses same base for sandbox,
                                   // credentials determine environment
  }

  async createInvoice(params: CreateInvoiceParams): Promise<XenditInvoice>
  async getInvoice(invoiceId: string): Promise<XenditInvoice>
  async registerSubMerchant(params: RegisterMerchantParams): Promise<XenditUser>
  async createPaymentChannel(userId: string, bank: BankAccount): Promise<XenditAccount>
}
```

---

## 7. Dashboard: UI Baru

### 7.1. Tab Baru di Settings → "Pembayaran"

Tambahkan tab baru di `Settings.tsx`:

```
Settings
├── Toko       (existing)
├── AI Agent   (existing)
├── WA Session (existing)
└── Pembayaran  ← NEW
```

### 7.2. Komponen PaymentTab

```
dashboard/src/components/PaymentTab.tsx
```

**Fitur:**
1. **Status Sub-Merchant** — Menampilkan status Xendit (Active/Pending/Rejected)
2. **Register Sub-Merchant** — Form untuk daftarin toko ke Xendit
   - Nama Pemilik, Email, No. HP, Alamat
   - Nama Bank, No. Rekening, Nama Pemilik Rekening
3. **Fee Setting** — Slider/input fee % (0–5%) yang WANI ambil
4. **Transaction History** — List invoice yang dibuat via Xendit
5. **Manual Refresh Status** — Button untuk cek status terbaru dari Xendit

### 7.3. UI di Order Detail

Tambahkan di `OrderDetail.tsx` bagian **Pembayaran**:

- **Belum ada pembayaran** → Tombol "Kirim Link Pembayaran" (manual dari dashboard)
- **Payment via Xendit** → Tampilkan:
  - Status invoice (PENDING / PAID / EXPIRED)
  - Metode bayar yang dipilih customer
  - Link invoice (bisa di-copy)
  - Button "Refresh Status"

---

## 8. WA Bot: Integrasi Payment Link

### 8.1. AI Pipeline — Tambah Step 13b

Di `api/src/ai/actions.ts`, fungsi `handleOrder()`:

```typescript
async function handleOrder(output, ctx): Promise<ActionResult> {
  // ...existing: create order, increment customer orders, log activity...

  // ── NEW: Auto-generate payment invoice ──
  if (env.xendit.apiKey) {
    try {
      const invoice = await XenditClient.createInvoice({
        externalId: `order-${order.id}`,
        amount: totalAmount,
        customer: { name: customerName, phone: customerPhone },
        items: resolvedItems,
        description: `Pesanan dari ${storeName}`,
      })

      // Save xenditInvoiceId ke Payment record
      await OrderModel.linkXenditInvoice(order.id, invoice.id)

      reply += `\n\n💳 Bayar sekarang:\n${invoice.invoiceUrl}`
    } catch (e) {
      // Fallback: order tetap dibuat, payment nanti manual
      console.error("Xendit invoice failed:", e)
    }
  }

  return { reply }
}
```

### 8.2. Webhook → WA Notification

Di handler webhook, setelah update payment sukses:
```typescript
// Fire-and-forget: kirim notifikasi ke wa-bot endpoint
fetch(`${waBotUrl}/api/send-message`, {
  method: "POST",
  body: JSON.stringify({
    phone: customerPhone,
    text: `✅ Pembayaran Rp${amount} berhasil! Pesanan kamu sedang diproses. Terima kasih 🙏`
  })
}).catch(() => {/* silent: notifikasi gagal, order tetap sukses */})
```

---

## 9. Webhook Handler Detail

### 9.1. Security

```typescript
// middleware/xendit-webhook.ts
export function verifyXenditWebhook(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-callback-token"]
  if (token !== env.xendit.webhookVerificationToken) {
    throw new UnauthorizedError("invalid webhook token")
  }
  next()
}
```

> ⚠️ **PENTING:** Xendit bisa mengirim ulang webhook yang sama (idempotent). Handler harus idempoten — cek `xenditPaymentId` dulu sebelum update.

### 9.2. Event yang Di-handle

| Event | Action |
|-------|--------|
| `payment.paid` | Update Payment → PAID, Order → CONFIRMED, kirim WA notif |
| `payment.expired` | Update Payment → EXPIRED, log aktivitas |
| `payment.failed` | Update Payment → FAILED, log aktivitas |

---

## 10. Security & Error Handling

### 10.1. Keamanan
1. **API Key** disimpan di env, bukan di database atau kode
2. **Webhook token** diverifikasi di middleware terpisah
3. **Rate limit** untuk endpoint invoice creation (anti spam)
4. **Idempotency** — cek `xenditPaymentId` sebelum update biar webhook duplikat aman
5. **Order ownership** — pastikan order beneran punya store itu

### 10.2. Error Handling
1. Xendit API down → order tetap dibuat, payment link dikirim nanti manual via dashboard
2. Sub-merchant belum register → invoice tetap bisa dibuat, tapi dana masuk ke akun WANI dulu
3. Invalid bank account → Xendit reject sub-merchant registration, user bisa ganti data
4. Invoice expired → webhook EXPIRED → status order tetap PENDING, admin bisa kirim ulang link

### 10.3. Testing (Sandbox Mode)
```env
XENDIT_IS_PRODUCTION=false
```
Di sandbox mode:
- Semua pembayaran simulation, tidak real
- QRIS bisa di-simulate via dashboard Xendit
- Webhook bisa di-test via Xendit Dashboard → Webhook → Send Test

---

## 11. Implementasi Bertahap (Phase)

### Phase 1: Backend Core ⭐ (Prioritas Lomba)
- [ ] Setup Xendit API key + env config
- [ ] Buat `xendit-client.ts` (create invoice, get invoice)
- [ ] Prisma migration: tambah field Xendit di Payment & Store
- [ ] Endpoint `POST /api/payment/invoice`
- [ ] Endpoint `POST /api/payment/webhook/xendit` (handle PAID, EXPIRED, FAILED)
- [ ] Integrasi AI pipeline: handleOrder auto-create invoice
- [ ] Test: bisa buat invoice, webhook update order jadi PAID

### Phase 2: Sub-Merchant Registration
- [ ] Xendit client: create customer, register sub-merchant, create payment channel
- [ ] Endpoint `POST /api/store/register-merchant`
- [ ] Endpoint `GET /api/store/xendit-status`
- [ ] Sinkronisasi: pas invoice dibuat, assign ke sub-merchant ID toko
- [ ] Test: register merchant, buat invoice, verifikasi dana mengalir

### Phase 3: Dashboard UI
- [ ] Tab "Pembayaran" di Settings
- [ ] Form register sub-merchant
- [ ] Status badge sub-merchant
- [ ] Order Detail: link invoice, refresh status
- [ ] Manual "Kirim Link Pembayaran" button

### Phase 4: WA Notification
- [ ] Webhook handler kirim notifikasi ke WA customer
- [ ] Format pesan payment success + order diproses
- [ ] Format pesan invoice expired (ajak bayar ulang)

### Phase 5: Polish & Edge Cases (Bonus)
- [ ] Fee management (set fee % per toko)
- [ ] Dashboard transaction history Xendit
- [ ] Retry logic untuk Xendit API timeout
- [ ] Admin manual override payment status
- [ ] PDF receipt generation
- [ ] Refund handling via dashboard

---

## TL;DR buat Lomba

**Phase 1 + 3** cukup untuk demo lomba:
1. Register akun Xendit (sandbox)
2. Register sub-merchant lewat dashboard
3. Customer WA → AI chat → order → otomatis dapet link bayar
4. Customer bayar → webhook trigger → order otomatis PAID
5. WA bot kirim notifikasi sukses

Total fitur baru: **±6 endpoint, ±5 komponen UI, ±2000 baris kode**
