# Manual Payment Flow — WANI

> **Latar belakang:** Karena keterbatasan verifikasi akun payment gateway (Midtrans/Xendit butuh NIK + NPWP), WANI beralih ke sistem pembayaran manual terstruktur. Store owner mendaftarkan metode pembayaran mereka sendiri (QRIS, Transfer Bank, E-Wallet, COD) dan mengonfirmasi pembayaran secara manual dari dashboard.

---

## Daftar Isi

1. [Arsitektur](#1-arsitektur)
2. [Data Model](#2-data-model)
3. [API Endpoints](#3-api-endpoints)
4. [Upload File QRIS](#4-upload-file-qris)
5. [Dashboard: Settings → Tab Pembayaran](#5-dashboard-settings--tab-pembayaran)
6. [Dashboard: Warning Banner](#6-dashboard-warning-banner)
7. [Dashboard: Konfirmasi Pembayaran](#7-dashboard-konfirmasi-pembayaran)
8. [WA Bot: Kirim QRIS Image](#8-wa-bot-kirim-qris-image)
9. [AI Pipeline: Update System Prompt](#9-ai-pipeline-update-system-prompt)
10. [Flow End-to-End](#10-flow-end-to-end)
11. [Implementasi Bertahap](#11-implementasi-bertahap)

---

## 1. Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        WANI Platform                         │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │  WA Bot      │   │  Dashboard   │   │  Backend API     │ │
│  │  (Baileys)   │   │  (React)     │   │  (Express)       │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                     │           │
│         └──────────────────┼─────────────────────┘           │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Payment Module  │  ← NEW                 │
│                   │  (Manual)        │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  /uploads/      │  ← QRIS images          │
│                   │  (static serve) │                        │
│                   └─────────────────┘                        │
└──────────────────────────────────────────────────────────────┘

ALIRAN PEMBAYARAN:
  Customer bayar QRIS/Transfer/E-Wallet
         │
         ▼
   Store owner cek mutasi rekening sendiri
         │
         ▼
   Store owner konfirmasi dari dashboard
         │
         ▼
   Order status → PAID + CONFIRMED
         │
         ▼
   WA bot kirim notifikasi ke customer
```

### Prinsip Dasar

1. **Tidak ada payment gateway** — semua transaksi diverifikasi manual oleh store owner
2. **Store owner daftarkan metode bayar mereka sendiri** di Settings → Pembayaran
3. **QRIS image diupload** ke server WANI, bisa dikirim bot WA langsung ke customer
4. **Konfirmasi pembayaran** dilakukan dari dashboard dengan satu klik

---

## 2. Data Model

### 2.1. Model Baru: `StorePaymentMethod`

```prisma
// api/prisma/models/store-payment.prisma

model StorePaymentMethod {
  id            String   @id @default(uuid())
  storeId       String   @default("default")
  type          String   // QRIS | BANK_TRANSFER | E_WALLET | COD
  label         String   // Nama tampilan, auto-generated atau manual
  accountName   String?  // Atas nama (bank/e-wallet)
  accountNumber String?  // Nomor rekening (bank)
  bankName      String?  // Nama bank (BCA, Mandiri, BRI, dll)
  providerName  String?  // Nama provider e-wallet (GoPay, OVO, Dana, LinkAja)
  phoneNumber   String?  // Nomor HP terdaftar (e-wallet)
  qrImageUrl    String?  // Path file QRIS (/uploads/...)
  instructions  String?  // Petunjuk tambahan (opsional)
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2.2. Perubahan Existing Model

**Store** — field `paymentMethods` tidak dihapus (backward compat), tapi tidak dipakai lagi untuk UI baru. Logic baru pake `StorePaymentMethod`.

**Payment** — tidak perlu perubahan. Field `method` di Payment tetap bisa diisi `QRIS`, `TRANSFER`, `CASH`, dll. Yang berubah adalah cara data masuk (manual via dashboard, bukan dari webhook).

### 2.3. Enum Values

Tambah `E_WALLET` ke enum `PaymentMethod`:

```prisma
enum PaymentMethod {
  CASH
  TRANSFER
  QRIS
  E_WALLET    // NEW
}
```

---

## 3. API Endpoints

### 3.1. Endpoint Baru

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| `POST` | `/api/upload` | 🔒 JWT | Upload file gambar, return URL |
| `GET` | `/api/store/payment-methods` | — | List semua metode bayar (public — buat AI & bot) |
| `POST` | `/api/store/payment-methods` | 🔒 JWT | Tambah metode bayar baru |
| `PUT` | `/api/store/payment-methods/:id` | 🔒 JWT | Edit metode bayar |
| `DELETE` | `/api/store/payment-methods/:id` | 🔒 JWT | Hapus metode bayar |

### 3.2. Endpoint Update

| Method | Path | Perubahan |
|--------|------|-----------|
| `GET` | `/api/store` | Tambah field `hasPaymentMethods: boolean` |
| `PUT` | `/api/orders/:id/payment` | Support method type dari StorePaymentMethod + auto-set `paidAt` jika status PAID |
| `PUT` | `/api/orders/:id/status` | Auto-update ke CONFIRMED jika payment sudah PAID (opsional) |

### 3.3. Detail Request/Response

#### `POST /api/upload`

```
Content-Type: multipart/form-data
Body: file (image/png, image/jpeg, image/webp, max 2MB)

Response 201:
{
  "status": "success",
  "data": {
    "url": "/uploads/qris-abc123.png"
  }
}
```

#### `GET /api/store/payment-methods`

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "type": "QRIS",
      "label": "QRIS - BCA",
      "qrImageUrl": "/uploads/qris-abc123.png",
      "instructions": "Scan QRIS di atas menggunakan GoPay/OVO/Dana",
      "isActive": true,
      "sortOrder": 0
    },
    {
      "id": "uuid",
      "type": "BANK_TRANSFER",
      "label": "BCA a/n Toko Maju",
      "bankName": "BCA",
      "accountNumber": "1234567890",
      "accountName": "Toko Maju",
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```

#### `POST /api/store/payment-methods`

```json
// Request (QRIS)
{
  "type": "QRIS",
  "label": "QRIS - Toko Maju",
  "qrImageUrl": "/uploads/qris-abc123.png",
  "instructions": "Scan menggunakan GoPay/OVO/Dana"
}

// Request (BANK_TRANSFER)
{
  "type": "BANK_TRANSFER",
  "label": "BCA a/n Toko Maju",
  "bankName": "BCA",
  "accountNumber": "1234567890",
  "accountName": "Toko Maju"
}

// Request (E_WALLET)
{
  "type": "E_WALLET",
  "label": "GoPay - 0812xxxx",
  "providerName": "GoPay",
  "phoneNumber": "08123456789",
  "accountName": "Toko Maju"
}

// Request (COD)
{
  "type": "COD",
  "label": "Bayar di Tempat",
  "instructions": "Bayar tunai saat barang diterima"
}
```

### 3.4. Validasi per Tipe (Zod)

```typescript
const paymentMethodBaseSchema = z.object({
  label: z.string().min(1, "Label wajib diisi"),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  instructions: z.string().optional().nullable(),
})

const qrisSchema = paymentMethodBaseSchema.extend({
  type: z.literal("QRIS"),
  qrImageUrl: z.string().min(1, "QRIS image wajib diupload"),
})

const bankTransferSchema = paymentMethodBaseSchema.extend({
  type: z.literal("BANK_TRANSFER"),
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  accountNumber: z.string().min(1, "No rekening wajib diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening wajib diisi"),
})

const ewalletSchema = paymentMethodBaseSchema.extend({
  type: z.literal("E_WALLET"),
  providerName: z.string().min(1, "Nama provider wajib diisi"),
  phoneNumber: z.string().min(1, "No HP wajib diisi"),
  accountName: z.string().optional().nullable(),
})

const codSchema = paymentMethodBaseSchema.extend({
  type: z.literal("COD"),
  instructions: z.string().min(1, "Instruksi COD wajib diisi"),
})

export const createPaymentMethodSchema = z.discriminatedUnion("type", [
  qrisSchema,
  bankTransferSchema,
  ewalletSchema,
  codSchema,
])
```

---

## 4. Upload File QRIS

### 4.1. Storage

- Direktori: `api/uploads/`
- Nama file: `qris-<uuid>.png`
- Maks: 2MB
- Format: PNG, JPEG, WebP

### 4.2. Serving

Di `api/src/server.ts`, tambahkan:

```typescript
app.use('/uploads', express.static('uploads'))
```

### 4.3. Upload Endpoint

- Middleware: `multer` (single file, field name: `file`)
- Validasi: hanya gambar, max 2MB
- Response: URL relatif `/uploads/<filename>`

### 4.4. WA Bot Akses

Bot WA akses gambar via `http://localhost:3001/uploads/<filename>` untuk dikirim sebagai media message.

---

## 5. Dashboard: Settings → Tab Pembayaran

### 5.1. Tab Baru

Di `Settings.tsx`, tambah tab ke-4:

```
Settings
├── Toko       (existing)
├── AI Agent   (existing)
├── WA Session (existing)
└── Pembayaran  ← NEW
```

### 5.2. Komponen: `PaymentTab.tsx`

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Metode Pembayaran                           │
│                                             │
│  ┌─── Metode #1: QRIS ────────────────────┐ │
│  │  [QR image preview]                     │ │
│  │  Label: QRIS - Toko Maju               │ │
│  │  Petunjuk: Scan QRIS di atas...        │ │
│  │  ● Aktif                     ✏️ 🗑️     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─── Metode #2: BCA Transfer ────────────┐ │
│  │  🏦 BCA                                │ │
│  │  1234567890 a/n Toko Maju              │ │
│  │  ● Aktif                     ✏️ 🗑️     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  [+ Tambah Metode Pembayaran]               │
└─────────────────────────────────────────────┘
```

**Fitur:**
1. List metode pembayaran sebagai cards
2. Toggle aktif/nonaktif per card
3. Tombol edit (membuka modal dengan form pre-filled)
4. Tombol hapus (dengan konfirmasi)
5. Tombol "Tambah Metode Pembayaran"

### 5.3. Modal Form

```
┌─── Tambah Metode Pembayaran ────────────────┐
│                                              │
│  Tipe Pembayaran: [QRIS ▼]                   │
│                                              │
│  ┌─── Dynamic Fields ────────────────────┐   │
│  │                                       │   │
│  │  Jika QRIS:                           │   │
│  │  - Upload QR Code: [Pilih File]       │   │
│  │  - Label: [QRIS - Toko Maju]         │   │
│  │  - Petunjuk (opsional): [...]        │   │
│  │                                       │   │
│  │  Jika BANK_TRANSFER:                  │   │
│  │  - Bank: [BCA ▼]                     │   │
│  │  - No Rekening: [1234567890]          │   │
│  │  - Atas Nama: [Toko Maju]            │   │
│  │  - Label auto: "BCA a/n Toko Maju"   │   │
│  │  - Petunjuk (opsional): [...]        │   │
│  │                                       │   │
│  │  Jika E_WALLET:                       │   │
│  │  - Provider: [GoPay ▼]               │   │
│  │  - No HP: [08123456789]              │   │
│  │  - Atas Nama (opsional): [...]       │   │
│  │  - Petunjuk (opsional): [...]        │   │
│  │                                       │   │
│  │  Jika COD:                            │   │
│  │  - Label: [Bayar di Tempat]           │   │
│  │  - Instruksi: [Bayar tunai saat...]   │   │
│  └───────────────────────────────────────┘   │
│                                              │
│             [Batal]  [Simpan]                │
└──────────────────────────────────────────────┘
```

### 5.4. Label Auto-generation

Untuk memudahkan, label bisa auto-generated:

| Type | Format |
|------|--------|
| QRIS | `QRIS - {accountName || label}` |
| BANK_TRANSFER | `{bankName} a/n {accountName}` |
| E_WALLET | `{providerName} - {phoneNumber}` |
| COD | `Bayar di Tempat` atau custom |

---

## 6. Dashboard: Warning Banner

### 6.1. Lokasi

Di halaman utama Dashboard (`dashboard/src/pages/Dashboard.tsx`), di atas konten stats.

### 6.2. Logic

```
if (!storeProfile.hasPaymentMethods || activePaymentMethods.length === 0):
    Tampilkan banner:
    ┌─────────────────────────────────────────────────────────┐
    │ ⚠️  Belum ada metode pembayaran yang aktif.             │
    │     Tambahkan metode pembayaran di Pengaturan →         │
    │     Pembayaran agar pelanggan bisa melakukan             │
    │     pembayaran.                                         │
    │     [Atur Pembayaran] → navigate ke /settings?tab=payment│
    └─────────────────────────────────────────────────────────┘
```

### 6.3. State

- Fetch dari `GET /api/store` yang sekarang return `hasPaymentMethods`
- Atau fetch dari `GET /api/store/payment-methods` dan cek length > 0
- Banner dismissible? Tidak — harus muncul terus sampai ada metode

---

## 7. Dashboard: Konfirmasi Pembayaran

### 7.1. Order Detail — Tombol Konfirmasi

Di `OrderDetail.tsx`, tambahkan tombol **"Konfirmasi Pembayaran"** yang muncul jika:

```
if (order.status !== "CANCELLED" && order.status !== "COMPLETED") {
  if (payment === null || payment.status === "PENDING") {
    Tampilkan "Konfirmasi Pembayaran"
  }
}
```

### 7.2. Modal Konfirmasi

```
┌─── Konfirmasi Pembayaran ───────────────────┐
│                                               │
│  Metode Pembayaran: [QRIS - Toko Maju ▼]     │
│                                               │
│  Jumlah: Rp [50.000] (prefill dari total)    │
│                                               │
│  Catatan (opsional):                          │
│  [Transfer via BCA sudah masuk]               │
│                                               │
│  ✅ Setelah dikonfirmasi:                      │
│     - Status pembayaran → LUNAS               │
│     - Status pesanan → DIKONFIRMASI           │
│                                               │
│           [Batal]  [Konfirmasi]               │
└──────────────────────────────────────────────┘
```

### 7.3. Action

Tombol "Konfirmasi" mengirim:

```http
PUT /api/orders/:id/payment
Body:
{
  "method": "QRIS",         // dari selected payment method type
  "amount": 50000,
  "status": "PAID",
  "paidAt": "2026-06-26T10:00:00Z"  // auto-generated
}
```

**Setelah sukses:**
1. Order status auto-update ke CONFIRMED (backend handle ini)
2. Timeline update — tambah step "Pembayaran dikonfirmasi"
3. Jika ada notifikasi WA, kirim: "✅ Pembayaran Rp50.000 untuk pesanan kamu telah diterima!"

### 7.4. Hook Update

Di `useOrders.ts`, tambah fungsi:

```typescript
const confirmPayment = async (orderId: string, data: {
  method: string
  amount: number
  notes?: string
}) => {
  const res = await fetchApi(`/api/orders/${orderId}/payment`, {
    method: "PUT",
    body: JSON.stringify({
      method: data.method,
      amount: data.amount,
      status: "PAID",
      paidAt: new Date().toISOString(),
      notes: data.notes,
    }),
  })
  // invalidate query cache / refetch
}
```

---

## 8. WA Bot: Kirim QRIS Image

### 8.1. Flow Pengiriman

```
AI reply mengandung QRIS URL?
         │
         ▼
Bot WA cek: reply contains "/uploads/..."
         │
         ▼
Bot download gambar dari API (localhost:3001/uploads/...)
         │
         ▼
Bot kirim sebagai image message:
  await sock.sendMessage(jid, {
    image: { url: "http://localhost:3001/uploads/qris-xxx.png" },
    caption: "Scan QRIS di atas untuk pembayaran"
  })
```

### 8.2. Implementasi Bot

Di `wa-bot/src/index.ts`, saat mengirim reply:

```typescript
function extractQrisUrl(text: string): string | null {
  const match = text.match(/\/uploads\/[\w\-\.]+\.(png|jpg|jpeg|webp)/i)
  return match ? match[0] : null
}

// Saat kirim reply
const qrisUrl = extractQrisUrl(replyText)
if (qrisUrl) {
  await sock.sendMessage(jid, {
    image: { url: `${API_BASE_URL}${qrisUrl}` },
    caption: replyText.replace(/!\[.*?\]\(.*?\)\n?/g, "").trim(),
  })
} else {
  await sock.sendMessage(jid, { text: replyText })
}
```

### 8.3. AI Reply Format

AI harus mention QRIS dengan format yang bisa diextract bot:

```
Berikut pembayaran untuk pesanan Anda:

QRIS:
![QRIS Toko Maju](/uploads/qris-abc123.png)

Atau transfer ke:
BCA: 1234567890 a/n Toko Maju
```

Bot akan nge-detect `/uploads/` URL dan kirim sebagai image + caption.

---

## 9. AI Pipeline: Update System Prompt

### 9.1. System Prompt

Di `api/src/ai/prompts.ts`, fungsi `buildSystemPrompt()`:

**Old:** inject `store.paymentMethods` (free-text string)

**New:** inject list dari `StorePaymentMethod` yang aktif:

```typescript
const paymentMethodsInfo = await getActivePaymentMethods()

const paymentSection = paymentMethodsInfo.length > 0
  ? `METODE PEMBAYARAN YANG TERSEDIA:\n${
      paymentMethodsInfo.map(pm => {
        if (pm.type === "QRIS") {
          return `- QRIS: Scan QR code yang akan dikirim bot WA`
        }
        if (pm.type === "BANK_TRANSFER") {
          return `- Transfer ${pm.bankName}: ${pm.accountNumber} a/n ${pm.accountName}`
        }
        if (pm.type === "E_WALLET") {
          return `- ${pm.providerName}: ${pm.phoneNumber} a/n ${pm.accountName}`
        }
        if (pm.type === "COD") {
          return `- Bayar di Tempat (COD): ${pm.instructions || "Bayar tunai saat barang diterima"}`
        }
        return ""
      }).filter(Boolean).join("\n")
    }`
  : "METODE PEMBAYARAN: Belum tersedia. Informasikan customer bahwa metode pembayaran sedang diatur."
```

### 9.2. Action Handler

Di `api/src/ai/actions.ts`, fungsi `handleOrder()`:

Setelah order berhasil dibuat, generate reply dengan instruksi pembayaran berdasarkan metode yang aktif.

---

## 10. Flow End-to-End

### Flow A: Store Owner Setup Payment Methods

```
[STORE OWNER]              [DASHBOARD]               [API]                   [DB]
     │                           │                      │                      │
     │  Buka Settings →           │                      │                      │
     │  Pembayaran                │                      │                      │
     │──────────────────────────► │                      │                      │
     │                           │  GET /api/store/      │                      │
     │                           │  payment-methods      │                      │
     │                           │─────────────────────► │                      │
     │                           │  [] (empty)           │                      │
     │                           │◄─────────────────────│                      │
     │                           │                      │                      │
     │  Klik "Tambah Metode"     │                      │                      │
     │  Pilih QRIS               │                      │                      │
     │  Upload QR Code           │                      │                      │
     │──────────────────────────► │                      │                      │
     │                           │  POST /api/upload     │                      │
     │                           │  (file: qris.png)    │                      │
     │                           │─────────────────────► │                      │
     │                           │  /uploads/qris-xxx   │                      │
     │                           │◄─────────────────────│                      │
     │                           │                      │                      │
     │                           │  POST /api/store/     │                      │
     │                           │  payment-methods      │                      │
     │                           │  { type: "QRIS",     │                      │
     │                           │    qrImageUrl: "...", │                      │
     │                           │    label: "..." }     │                      │
     │                           │─────────────────────► │─────► INSERT INTO ──►│
     │                           │  { id: "pm-uuid", .. }│                      │
     │                           │◄─────────────────────│                      │
     │  ✅ Metode muncul di list │                      │                      │
     │◄──────────────────────────│                      │                      │
```

### Flow B: Customer Order → Payment → Confirmation

```
[CUSTOMER]                 [WA BOT]                    [API]            [DASHBOARD]
    │                          │                         │                  │
    │ "Saya mau pesan          │                         │                  │
    │  2x Nasi Goreng"         │                         │                  │
    │─────────────────────────►│                         │                  │
    │                          │  POST /api/chat          │                  │
    │                          │────────────────────────►│                  │
    │                          │                         │                  │
    │                          │  AI pipeline:           │                  │
    │                          │  1. Process intent      │                  │
    │                          │  2. Create Order        │                  │
    │                          │  3. Load payment        │                  │
    │                          │     methods             │                  │
    │                          │  4. Generate reply      │                  │
    │                          │     dengan payment info │                  │
    │                          │◄────────────────────────│                  │
    │                          │                         │                  │
    │  "Pesanan diterima! 🎉   │                         │                  │
    │   Nasi Goreng × 2        │                         │                  │
    │   Total: Rp50.000         │                         │                  │
    │                          │                         │                  │
    │   💳 Pembayaran:          │                         │                  │
    │   [QRIS IMAGE]           │                         │                  │
    │   Atau transfer ke:      │                         │                  │
    │   BCA 1234567890         │                         │                  │
    │   a/n Toko Maju          │                         │                  │
    │                          │                         │                  │
    │   Konfirmasi setelah     │                         │                  │
    │   bayar ya 😊"           │                         │                  │
    │◄─────────────────────────│                         │                  │
    │                          │                         │                  │
    │  (Customer transfer)     │                         │                  │
    │                          │                         │                  │
    │  "Udah bayar ya"         │                         │                  │
    │─────────────────────────►│                         │                  │
    │                          │  POST /api/chat         │                  │
    │                          │────────────────────────►│                  │
    │                          │  "Baik, kami akan       │                  │
    │                          │   konfirmasikan         │                  │
    │                          │   pembayaran Anda!"     │                  │
    │◄─────────────────────────│                         │                  │
    │                          │                         │                  │
    │                          │                         │   Owner buka     │
    │                          │                         │   dashboard      │
    │                          │                         │◄─────────────────│
    │                          │                         │                  │
    │                          │                         │  Klik "Konfirmasi│
    │                          │                         │  Pembayaran"     │
    │                          │                         │◄─────────────────│
    │                          │                         │                  │
    │                          │                         │  PUT /api/orders │
    │                          │                         │  /:id/payment    │
    │                          │                         │◄─────────────────│
    │                          │                         │  status: PAID    │
    │                          │                         │                  │
    │                          │  "✅ Pembayaran         │                  │
    │                          │   Rp50.000 sudah        │                  │
    │                          │   dikonfirmasi!         │                  │
    │                          │   Pesanan sedang        │                  │
    │                          │   diproses."            │                  │
    │◄─────────────────────────│                         │                  │
```

### Flow C: Dashboard Warning (No Payment Method)

```
[STORE OWNER]              [DASHBOARD]                  [API]
    │                           │                         │
    │  Login → Dashboard        │                         │
    │──────────────────────────►│                         │
    │                           │  GET /api/store          │
    │                           │────────────────────────►│
    │                           │  { hasPaymentMethods:   │
    │                           │    false }              │
    │                           │◄────────────────────────│
    │                           │                         │
    │  ⚠️ Banner merah:         │                         │
    │  "Belum ada metode        │                         │
    │   pembayaran. Atur →"     │                         │
    │◄──────────────────────────│                         │
    │                           │                         │
    │  Klik "Atur Pembayaran"   │                         │
    │──────────────────────────►│                         │
    │                           │  Navigasi ke            │
    │                           │  /settings?tab=payment   │
    │◄──────────────────────────│                         │
```

---

## 11. Implementasi Bertahap

### Tahap 1: Database & API Core ⭐

- [x] Prisma migration: model `StorePaymentMethod` + enum `E_WALLET`
- [x] Zod schema: `createPaymentMethodSchema` (discriminated union)
- [x] Model: `StorePaymentMethodModel` (CRUD)
- [x] Upload endpoint: `POST /api/upload` (multer + static serve)
- [x] Payment method CRUD endpoints
- [x] Update `GET /api/store`: tambah `hasPaymentMethods`
- [x] Update `PUT /api/orders/:id/payment`: dukung method dari StorePaymentMethod

### Tahap 2: Dashboard — Pembayaran Tab

- [x] Hook `usePaymentMethods.ts`
- [x] Component `PaymentTab.tsx` — list + toggle + edit + delete
- [x] Modal form dinamis (QRIS / Transfer / E-Wallet / COD)
- [x] Upload file component untuk QRIS
- [x] Integrasi tab ke `Settings.tsx`

### Tahap 3: Dashboard — Konfirmasi & Warning

- [x] Warning banner di halaman Dashboard
- [x] Tombol "Konfirmasi Pembayaran" di OrderDetail
- [x] Modal konfirmasi: pilih metode + amount + confirm
- [x] Fungsi `confirmPayment()` di `useOrders.ts`
- [x] Auto-update order status ke CONFIRMED

### Tahap 4: AI & Bot Integration

- [x] Update `buildSystemPrompt()`: load dari StorePaymentMethod
- [x] Update `handleOrder()`: include payment info di reply
- [x] Bot detect QRIS URL → kirim sebagai image message
- [x] Format reply dengan QRIS image embed

### Tahap 5: Polish

- [ ] Reorder payment methods (drag atau sort order)
- [ ] Preview QRIS image di card
- [ ] Label auto-generation
- [ ] Validasi tipe file upload
- [ ] Loading & error states di UI

---

## Catatan Penting

1. **Single store row** — semua data StorePaymentMethod pake `storeId: "default"` (sama seperti Store). Extension ke multi-store di masa depan butuh perubahan minimal.
2. **QRIS image accessibility** — bot WA perlu akses gambar via HTTP. Pastikan `api/uploads/` di-serve via `express.static()`.
3. **Idempotency** — konfirmasi pembayaran bisa double-click. Backend harus handle: cek `payment.status !== "PAID"` sebelum update.
4. **No real money** — semua transaksi manual. Store owner bertanggung jawab verifikasi sendiri.
5. **File upload security** — validasi tipe file (hanya gambar), batasi ukuran (2MB), nama file unik (UUID), path traversal prevention.
