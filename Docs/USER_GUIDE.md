# WANI — Panduan Pengguna UMKM

## Cara Memulai

### 1. Registrasi
1. Buka `http://localhost:3000/register`
2. Isi: Nama Usaha, Nomor WA (diawali 62), Password
3. Klik "Daftar" → Otomatis login

### 2. Dashboard
Setelah login kamu akan melihat halaman **Overview** dengan:
- Total produk, pesanan, pelanggan
- Pesanan terbaru
- Revenue hari ini

### 3. Kelola Produk
1. Klik menu **Produk** di sidebar
2. Klik "Tambah Produk"
3. Isi nama, harga, stok, kategori
4. Klik "Simpan"

### 4. Kategori
Sebelum menambah produk, buat kategori dulu:
1. Klik menu **Produk** → tab Kategori
2. Klik "Tambah Kategori"
3. Isi nama kategori

### 5. Konfigurasi AI
1. Klik menu **AI Agent**
2. Atur System Prompt (instruksi untuk AI)
3. Atur Greeting Message (sapa otomatis)
4. Isi Knowledge Base (info toko)
5. Simpan

### 6. Web Store (Toko Online)
1. Klik menu **Web Store**
2. **Terbitkan** toko → otomatis aktif di `/store/[slug]`
3. Pilih **Template** (Modern, Minimal, Klasik)
4. Atur **Warna** — pilih preset atau atur manual
5. Upload **Hero Image** (URL gambar)
6. Isi **Teks Hero** (sambutan)
7. Isi **SEO Title & Description** (untuk Google)
8. Atur **Slug URL** (contoh: `warung-berkah`)
9. Klik "Simpan Pengaturan"

### 7. WhatsApp Connection
1. Klik menu **WA Session**
2. Klik "Start Session"
3. Scan QR code dengan WhatsApp kamu
4. Status akan berubah menjadi "Connected"

### 8. Melihat & Mengelola Pesanan
Pesanan masuk otomatis dari:
- Chat WhatsApp (AI mendeteksi intent order)
- Web Store (pelanggan klik "Pesan via WhatsApp")

1. Klik menu **Pesanan**
2. Filter berdasarkan status: Pending, Confirmed, Processing, Completed, Cancelled
3. Klik pesanan untuk detail
4. Ubah status sesuai proses

### Tips
- Web store otomatis menggunakan data produk yang sama dengan WhatsApp
- Pelanggan bisa lihat produk di web store, lalu pesan via WhatsApp
- AI akan menjawab pertanyaan pelanggan otomatis
- Setting toko bisa diubah kapan saja dari menu Web Store
