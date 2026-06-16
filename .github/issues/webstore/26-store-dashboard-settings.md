# WST-26 — Store Dashboard Settings: Publish, SEO, Hero Config

## Deskripsi
Halaman di dashboard untuk mengatur web store: publish/unpublish, SEO settings, hero section, dan custom domain. Bagian dari `/dashboard/web-store`.

## Task Checklist

### 1. Page Layout
```
┌────────────────────────────────────────────────────────┐
│  Web Store Settings              [Preview] [Publish]   │
│                                                       │
│  ┌─ Status ───────────────────────────────────────┐   │
│  │  🌐 Published — https://warungberkah.wani.my.id │   │
│  │  Sejak 12 Maret 2025                            │   │
│  │                                                  │   │
│  │  ATAU                                           │   │
│  │                                                  │   │
│  │  ⚫ Not Published — web store belum bisa         │   │
│  │  diakses pelanggan                               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ URL & Domain ──────────────────────────────────┐   │
│  │  Slug: [warung-berkah                    ]      │   │
│  │  URL: https://wani.my.id/store/warung-berkah    │   │
│  │  Custom Domain: [store.warungberkah.com  ]     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ SEO ──────────────────────────────────────────┐   │
│  │  Title: [Warung Berkah - Makanan & Minuman ]    │   │
│  │  Description: [Warung Berkah menyediakan... ]   │   │
│  │                                                 │   │
│  │  Preview Google:                                │   │
│  │  ┌────────────────────────────────────────┐     │   │
│  │  │ Warung Berkah - Makanan & Minuman       │     │   │
│  │  │ https://wani.my.id/store/warung-berkah  │     │   │
│  │  │ Warung Berkah menyediakan...            │     │   │
│  │  └────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ Hero Section ──────────────────────────────────┐   │
│  │  Image: [Upload Image]          [x] Remove      │   │
│  │  Preview: [████████████████████████]             │   │
│  │                                                  │   │
│  │  Teks: [Buka setiap hari, senyum setiap saat]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                       │
│  [💾 Simpan Pengaturan]                               │
└────────────────────────────────────────────────────────┘
```

### 2. Publish/Unpublish
- [ ] **Publish button**: prominent, hijau
- [ ] **Unpublish**: merah, dengan konfirmasi "Yakin unpublish? Web store tidak bisa diakses."
- [ ] Status badge: "🌐 Published" / "⚫ Not Published"
- [ ] Published date

### 3. Slug & URL
- [ ] Slug input: auto-generate dari nama toko, bisa diedit
- [ ] Validasi: hanya a-z, 0-9, hyphens
- [ ] Preview URL: "https://wani.my.id/store/[slug]"
- [ ] Check uniqueness: kalo slug sudah dipake → error

### 4. SEO
- [ ] Title input: max 70 karakter, counter
- [ ] Description input: max 160 karakter, counter
- [ ] Google Search Preview (simulasi)
- [ ] Open Graph preview (simulasi sosial media)

### 5. Hero Section
- [ ] Image upload (drag & drop atau click)
- [ ] Preview image after upload
- [ ] Remove image button
- [ ] Hero text input

### 6. Custom Domain (Future)
- [ ] Input field untuk custom domain
- [ ] Note: "Aktifkan dengan mengarahkan DNS CNAME ke wani.my.id"
- [ ] Instruksi setup DNS

### 7. Preview Button
- [ ] Buka `/store/[slug]?preview=true` di tab baru
- [ ] Preview: tampilkan unpublished version

### 8. Save
- [ ] `PUT /api/web-store/:merchantId`
- [ ] Success toast

## Verification
- [ ] Publish/unpublish bekerja
- [ ] Edit slug → URL berubah
- [ ] SEO title & description tersimpan
- [ ] Upload hero image
- [ ] Preview → buka tab baru
- [ ] Simpan → toast konfirmasi

## Labels
`frontend`, `dashboard`, `web-store`, 🟡 medium

## Dependencies
WST-23, DSH-14

## Estimasi
1 hari
