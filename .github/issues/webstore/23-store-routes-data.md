# WST-23 — Store Routes + Data Fetching

## Deskripsi
Setup routing dan data fetching untuk halaman public web store. Semua halaman store adalah server component yang langsung membaca dari Prisma.

## Task Checklist

### 1. Route Structure
```typescript
// src/app/store/[slug]/
// ├── layout.tsx        // Store layout (tanpa sidebar dashboard)
// ├── page.tsx          // Landing page
// ├── loading.tsx       // Loading skeleton untuk semua halaman store
// ├── not-found.tsx     // Kalo slug tidak ditemukan
// ├── products/
// │   ├── page.tsx      // Full catalog
// │   └── loading.tsx
// └── product/
//     └── [id]/
//         ├── page.tsx  // Product detail
//         └── loading.tsx
```

### 2. Data Fetching (Server Component)
```typescript
// src/app/store/[slug]/page.tsx
import { prisma } from '@wani/database';

async function getStoreData(slug: string) {
  const webStore = await prisma.webStore.findUnique({
    where: { slug, isPublished: true },
    include: {
      merchant: {
        include: {
          products: {
            where: { isAvailable: true },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
          },
          categories: {
            orderBy: { name: 'asc' },
          },
          settings: true,
        },
      },
    },
  });
  return webStore;
}
```

- [ ] Fetch web store by slug (hanya published)
- [ ] Include: merchant, products (available only), categories, settings
- [ ] 404 if not found
- [ ] Type safety dengan Prisma generated types

### 3. Store Layout
- [ ] Layout tanpa sidebar dashboard
- [ ] Minimal header (logo/nama toko)
- [ ] Footer: "Powered by WANI"
- [ ] SEO meta tags (title, description dari WebStore)
- [ ] Font loading (Inter dari Google Fonts)

### 4. 404 Page
- [ ] "Toko tidak ditemukan"
- [ ] "Mungkin tautan ini salah atau toko sudah tidak aktif"
- [ ] Link ke halaman utama

### 5. Loading States
- [ ] Skeleton untuk landing page
- [ ] Skeleton untuk product grid
- [ ] Skeleton untuk product detail

## Verification
- [ ] `/store/warung-berkah` (dari seed data) → landing page muncul
- [ ] `/store/random-slug` → 404 page
- [ ] Data produk dari Prisma muncul

## Labels
`frontend`, `web-store`, 🔴 high

## Dependencies
FND-04, FND-03

## Estimasi
1 hari
