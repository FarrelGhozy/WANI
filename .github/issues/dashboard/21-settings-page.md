# DSH-21 — Settings Page (Profil, Payment, Jam Operasional)

## Deskripsi
Halaman pengaturan toko: profil, payment methods, jam operasional, dan pengiriman.

## Task Checklist

### 1. Profile Section
```
┌─ Profil Toko ──────────────────────────────────────┐
│  Nama Toko: [Warung Berkah                   ]     │
│  Alamat: [Jl. Merdeka No. 123, Jakarta       ]     │
│  No. WhatsApp: 6281234567890 (readonly)            │
│                                                    │
│  [Simpan Profil]                                   │
└────────────────────────────────────────────────────┘
```

- [ ] Input: nama toko, alamat
- [ ] WA number: readonly (ambil dari JWT)
- [ ] Save → `PUT /api/merchants/me`

### 2. Payment Methods
```
┌─ Metode Pembayaran ────────────────────────────────┐
│  ☑ Tunai (Cash)                                     │
│                                                     │
│  ☑ Transfer Bank                                    │
│     Nama Bank: [BCA                    ▼]           │
│     No. Rekening: [1234567890            ]          │
│     Atas Nama: [Warung Berkah            ]          │
│                                                     │
│  ☑ QRIS                                            │
│     [Upload Gambar QR]  [Preview QR]                │
│     Atas Nama: [Warung Berkah            ]          │
│                                                     │
│  ☐ GoPay / OVO (future)                             │
│                                                     │
│  [Simpan Pembayaran]                                │
└─────────────────────────────────────────────────────┘
```

- [ ] Toggle per payment method
- [ ] Transfer: bank name (dropdown: BCA, Mandiri, BNI, BRI, dll), no rekening, atas nama
- [ ] QRIS: upload gambar + preview
- [ ] Data disimpan di `Setting` model (key-value JSON)

### 3. Business Hours
```
┌─ Jam Operasional ───────────────────────────────────┐
│  Senin:  [08:00] ─ [21:00]  ☑ Buka                 │
│  Selasa: [08:00] ─ [21:00]  ☑ Buka                 │
│  Rabu:   [08:00] ─ [21:00]  ☑ Buka                 │
│  Kamis:  [08:00] ─ [21:00]  ☑ Buka                 │
│  Jumat:  [08:00] ─ [21:00]  ☑ Buka                 │
│  Sabtu:  [08:00] ─ [18:00]  ☑ Buka                 │
│  Minggu: [--:--] ─ [--:--]  ☐ Libur                │
│                                                    │
│  [Simpan Jam Operasional]                           │
└────────────────────────────────────────────────────┘
```

- [ ] Time picker per hari
- [ ] Toggle buka/libur per hari
- [ ] Default: Senin-Sabtu 08:00-21:00, Minggu libur
- [ ] Data disimpan sebagai JSON di Settings

### 4. Delivery Settings
```
┌─ Pengiriman ────────────────────────────────────────┐
│  Ongkir Dalam Kota: [Rp 5.000                ]      │
│  Ongkir Luar Kota:  [Rp 15.000               ]      │
│  Minimal Order:     [Rp 0                    ]      │
│  Estimasi Pengiriman: [30-60 menit           ]      │
│                                                     │
│  Area Pengiriman:                                   │
│  [Dalam Kota] [Luar Kota] [Semua Area]              │
│                                                     │
│  [Simpan Pengiriman]                                │
└─────────────────────────────────────────────────────┘
```

- [ ] Ongkir input (format Rupiah)
- [ ] Minimal order
- [ ] Estimasi pengiriman
- [ ] Area pengiriman radio

### 5. Save Mechanism
- [ ] Per section ada tombol simpan sendiri-sendiri
- [ ] Atau satu tombol "Simpan Semua"
- [ ] Data disimpan via `PUT /api/settings` (batch update)
- [ ] Toast: "Pengaturan berhasil disimpan"

## Verification
- [ ] Edit nama toko → tersimpan
- [ ] Payment methods bisa di-toggle
- [ ] Upload QRIS image
- [ ] Business hours tersimpan
- [ ] Delivery settings tersimpan

## Labels
`frontend`, `dashboard`, 🟡 medium

## Dependencies
DSH-14

## Estimasi
1 hari
