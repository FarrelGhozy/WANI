# WST-24 — Store Landing Page: Hero, Categories, Product Grid

## Deskripsi
Halaman utama web store: hero section, category tabs, dan product grid. Ini adalah halaman yang pertama kali dilihat pelanggan.

## Task Checklist

### 1. Hero Section
```
┌──────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │        🌸 **Warung Berkah**                    │  │
│  │   "Buka setiap hari, senyum setiap saat"       │  │
│  │                                                │  │
│  │        [💬 Pesan Lewat WhatsApp]               │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

- [ ] Nama toko dari Merchant.businessName
- [ ] Hero text (tagline) dari WebStore.heroText
- [ ] Background image dari WebStore.heroImage (fallback ke gradient)
- [ ] CTA button: "Pesan Lewat WhatsApp" → wa.me link
- [ ] Responsive: full-width di mobile, contained di desktop

### 2. Category Tabs
```
[🔄 Semua] [🍕 Makanan] [🥤 Minuman]
```
- [ ] Horizontal scrollable tabs
- [ ] "Semua" sebagai default active
- [ ] Click → filter product grid by category (client-side filter)
- [ ] Smooth scroll ke product grid (bukan navigate)
- [ ] Active state: underline + bold

### 3. Product Grid
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🍗 Nasi     │ │ 🥤 Es Teh   │ │ 🍜 Mie      │ │ 🍗 Ayam     │
│   Goreng    │ │   Manis     │ │   Goreng    │ │   Goreng    │
│   Rp15.000  │ │   Rp5.000   │ │   Rp12.000  │ │   Rp18.000  │
│ [Pesan WA]  │ │ [Pesan WA]  │ │ [Pesan WA]  │ │ [Pesan WA]  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

- [ ] Grid: 4 columns desktop, 2 tablet, 1 mobile
- [ ] **Product Card**:
  - Image placeholder (gradient/emoji kalo gak ada foto)
  - Product name
  - Price (format Rupiah)
  - Category badge (small, top-right)
  - Stock indicator: "Tersedia" / "Habis"
  - "Pesan Lewat WA" button
- [ ] Click card → navigate ke `/store/[slug]/product/[id]`
- [ ] WA button → `wa.me/{phone}?text=Halo%20saya%20mau%20pesan%20{product}%20Rp{price}`
- [ ] Hover effect: slight elevation

### 4. WA Floating Button
- [ ] Fixed position: bottom-right
- [ ] Green button with WA icon
- [ ] Pulse animation
- [ ] Click → wa.me with generic message
- [ ] Tooltip: "Pesan Lewat WhatsApp"

### 5. Filter & Search (Landing Page)
- [ ] Category tabs filter produk
- [ ] Search bar (optional, bisa di full catalog page)
- [ ] Smooth animation saat filter

### 6. Empty States
- [ ] No products: "Belum ada produk tersedia. Hubungi toko langsung via WA."
- [ ] Category filter no results: "Tidak ada produk di kategori ini"

### 7. Responsive
- [ ] Mobile: 1 column, stacked layout
- [ ] Tablet: 2 columns
- [ ] Desktop: 4 columns

## Verification
- [ ] Hero section muncul dengan nama toko
- [ ] Category tabs filter produk
- [ ] Product grid dengan card yang benar
- [ ] WA button → redirect ke wa.me dengan pesan otomatis
- [ ] Responsive di mobile

## Labels
`frontend`, `web-store`, 🔴 high

## Dependencies
WST-23

## Estimasi
2 hari
