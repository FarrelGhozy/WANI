# TPL-29 — Static Site Generator Script

## Deskripsi
Buat script untuk meng-generate static HTML version dari web store. Hasilnya bisa di-host di mana aja (Netlify, Vercel, GitHub Pages, S3) tanpa perlu Node.js server.

## Task Checklist

### 1. Generate Script
```typescript
// scripts/generate-static-store.ts
import { prisma } from '@wani/database';
import { renderToString } from 'react-dom/server';
import fs from 'fs/promises';
import path from 'path';

interface GenerateOptions {
  slug?: string;        // Generate specific store
  outputDir?: string;   // Default: ./out
  minify?: boolean;     // Minify HTML
}

async function generateStores(options: GenerateOptions) {
  const where = options.slug 
    ? { slug: options.slug, isPublished: true }
    : { isPublished: true };
  
  const stores = await prisma.webStore.findMany({
    where,
    include: {
      merchant: {
        include: {
          products: { where: { isAvailable: true }, include: { category: true } },
          categories: true,
        },
      },
    },
  });

  for (const store of stores) {
    console.log(`📦 Generating ${store.slug}...`);
    await generateStore(store, options.outputDir || './out');
    console.log(`✅ ${store.slug} generated`);
  }
}
```

### 2. CLI Interface
- [ ] `pnpm generate:store` — generate semua store
- [ ] `pnpm generate:store --slug warung-berkah` — generate satu store
- [ ] `pnpm generate:store --output ./dist` — custom output dir
- [ ] `pnpm generate:store --minify` — minify output

```bash
# package.json scripts
{
  "generate:store": "tsx scripts/generate-static-store.ts",
  "generate:store:all": "tsx scripts/generate-static-store.ts --all"
}
```

### 3. Output Structure
```
out/
├── warung-berkah/
│   ├── index.html              # Landing page
│   ├── products/
│   │   ├── index.html          # Catalog page
│   │   └── nasi-goreng/        # Product detail
│   │       └── index.html
│   ├── css/
│   │   └── style.css           # Inline or bundled CSS
│   ├── js/
│   │   └── app.js              # Minimal JS (lazy loading, WA button)
│   └── images/
│       ├── hero.jpg
│       └── products/
│           ├── nasi-goreng.jpg
│           └── ...
├── toko-budi/
│   └── ...
└── index.html                  # List semua store (optional)
```

### 4. HTML Template
- [ ] Buat HTML template dengan placeholder untuk data
- [ ] Inject: product data, categories, theme config, SEO meta
- [ ] Inline critical CSS
- [ ] Minimal JavaScript untuk:
  - [ ] WA button
  - [ ] Category filter
  - [ ] Search
  - [ ] Lazy loading images

### 5. Asset Pipeline
- [ ] Copy images ke output directory
- [ ] Optimize images (compress)
- [ ] Generate sitemap.xml
- [ ] Generate robots.txt

### 6. Dashboard Integration (Optional)
- [ ] Button: "Generate Static Site" di `/dashboard/web-store`
- [ ] Status: "Last generated: 12 Mar 2025, 10:23"
- [ ] "Download" link untuk hasil static files (zip)
- [ ] "Auto-generate on publish" toggle

### 7. Deployment Guide Output
- [ ] Generate `_redirects` atau `netlify.toml` untuk SPA fallback
- [ ] Generate `.htaccess` untuk Apache server
- [ ] README.txt dengan instruksi deploy

## Verification
- [ ] `pnpm generate:store --slug warung-berkah` → `out/warung-berkah/index.html`
- [ ] HTML file bisa dibuka langsung di browser (file://)
- [ ] Semua link internal berfungsi
- [ ] WA button redirect ke wa.me
- [ ] Sitemap.xml ter-generate
- [ ] Images tercopy

## Labels
`frontend`, `static-generation`, 🟢 low

## Dependencies
TPL-27

## Estimasi
2 hari
