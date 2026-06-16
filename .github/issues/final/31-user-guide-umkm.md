# FIN-31 — User Guide untuk UMKM

## Deskripsi
Buat panduan pengguna yang berfokus pada pemilik UMKM (non-teknis). Bahasa Indonesia, step-by-step, dengan screenshot.

## Task Checklist

### 1. Getting Started Guide (`Docs/USER-GUIDE.md`)

#### Bab 1: Memulai
- [ ] Cara daftar akun WANI
- [ ] Cara login
- [ ] Yang perlu disiapkan (nomor WA, foto produk, daftar harga)

#### Bab 2: Hubungkan WhatsApp
- [ ] Cara scan QR code
- [ ] Troubleshooting: QR tidak muncul, expired, "perangkat tidak dikenal"
- [ ] Cara putuskan koneksi

#### Bab 3: Atur Produk
- [ ] Cara tambah produk baru
- [ ] Cara edit produk
- [ ] Cara atur stok
- [ ] Cara upload foto produk
- [ ] Tips: nama produk yang baik, harga yang kompetitif

#### Bab 4: Kelola Pesanan
- [ ] Cara lihat pesanan masuk
- [ ] Cara konfirmasi pesanan
- [ ] Cara update status (diproses → selesai)
- [ ] Cara batalkan pesanan
- [ ] Cara lihat riwayat pesanan

#### Bab 5: AI Customer Service
- [ ] Cara setting AI (system prompt)
- [ ] Cara kasih informasi ke AI (knowledge base)
- [ ] Kapan harus ganti ke mode manual (human)
- [ ] Tips: cara bikin AI jawab sesuai toko

#### Bab 6: Web Store
- [ ] Cara publish web store
- [ ] Cara ganti template
- [ ] Cara custom warna
- [ ] Cara share link toko ke pelanggan
- [ ] Cara atur SEO biar muncul di Google

#### Bab 7: Pengaturan
- [ ] Cara atur jam buka
- [ ] Cara atur metode pembayaran (QRIS, transfer, cash)
- [ ] Cara atur ongkir

#### Bab 8: Pelanggan
- [ ] Cara lihat data pelanggan
- [ ] Cara lihat riwayat belanja pelanggan

### 2. FAQ
- [ ] "Gimana kalo AI jawabnya salah?"
  → Manual override, edit system prompt
- [ ] "Bisa pake 2 nomor WA?"
  → Belum bisa, satu merchant satu nomor
- [ ] "Data pesanan aman ga?"
  → Disimpan di database sendiri, enkripsi
- [ ] "Bisa ganti password?"
  → Di halaman Settings
- [ ] "Web store-nya bisa pake domain sendiri?"
  → Bisa, setting custom domain
- [ ] "Pelanggan chat lewat web store, masuknya kemana?"
  → Masuk ke WA merchant, di-handle AI
- [ ] "Kalo lagi libur, AI tetep jalan?"
  → Bisa matiin AI dari dashboard

### 3. Troubleshooting
- [ ] "WA disconnect terus"
- [ ] "QR tidak muncul"
- [ ] "AI tidak menjawab"
- [ ] "Order tidak masuk"
- [ ] "Halaman web store error"

## Format
- [ ] Bahasa Indonesia
- [ ] Step-by-step dengan screenshot (placeholder: `[screenshot]`)
- [ ] Tip boxes: 💡 Tips
- [ ] Warning boxes: ⚠️ Perhatian

## Verification
- [ ] Pemilik UMKM bisa daftar sendiri tanpa bantuan teknis
- [ ] Semua fitur utama ter-cover
- [ ] FAQ menjawab pertanyaan umum

## Labels
`documentation`, `user-guide`, 🟢 low

## Dependencies
Semua dashboard & store issues selesai

## Estimasi
1 hari
