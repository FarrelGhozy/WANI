# Website Generator Improvements — Tahap 3

---

## 1. Product Search di HTML Templates

### Masalah
HTML templates (classic, modern, vibrant, cyberpunk, minimalist) tidak punya product search — hanya Astro template yang punya.

### Solusi

Tambahkan client-side search di semua template `produk.html`:

```html
<!-- produk.html — tambah search input -->
<div class="mb-8">
  <input
    type="text"
    id="productSearch"
    placeholder="Cari produk..."
    class="w-full max-w-md px-4 py-3 border rounded-lg"
    oninput="filterProducts(this.value)"
  />
</div>

<script>
function filterProducts(query) {
  const cards = document.querySelectorAll('[data-product-card]')
  const q = query.toLowerCase()

  cards.forEach(card => {
    const name = card.dataset.name?.toLowerCase() ?? ''
    const desc = card.dataset.description?.toLowerCase() ?? ''
    card.style.display = (name.includes(q) || desc.includes(q)) ? '' : 'none'
  })
}
</script>
```

Dan update generator untuk menambahkan `data-product-name` + `data-product-description` attribute:

```typescript
// web-gen/src/generator.ts — update renderItem
function renderItem(item: Record<string, unknown>): string {
  return `<div data-product-card
    data-name="${escapeHtml(String(item.name ?? ''))}"
    data-description="${escapeHtml(String(item.description ?? ''))}">
    <!-- existing card markup -->
  </div>`
}
```

---

## 2. Dynamic Features Section

### Masalah
Semua HTML template punya features section hardcoded (pengiriman, garansi, pembayaran, layanan).

### Solusi

Tambahkan `features` ke `SiteConfig`:

```typescript
// web-gen/src/types.ts
interface SiteConfig {
  // ... existing fields

  features?: {
    title: string
    description: string
    icon: 'truck' | 'shield' | 'credit-card' | 'headphones' | 'star' | 'heart'
  }[]
}
```

Update generator untuk render features secara dinamis:

```html
<!-- _features partial baru -->
<section class="features py-16">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Keunggulan Kami</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      {{#features}}
      <div class="text-center">
        <div class="feature-icon">{{icon}}</div>
        <h3 class="font-bold mt-4">{{title}}</h3>
        <p class="text-gray-600 mt-2">{{description}}</p>
      </div>
      {{/features}}
    </div>
  </div>
</section>
```

Update dashboard Website page untuk edit features:

```typescript
// dashboard/src/pages/Website.tsx — tambah features editor
<Section title="Fitur / Keunggulan">
  {features.map((f, i) => (
    <div key={i} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
      <Select label="Icon" value={f.icon} onChange={...} />
      <Input label="Judul" value={f.title} onChange={...} />
      <Textarea label="Deskripsi" value={f.description} onChange={...} />
    </div>
  ))}
  <Button onClick={addFeature}>+ Tambah Fitur</Button>
</Section>
```

---

## 3. Elegant Template (New)

### Design Spec

**Style Direction:** Editorial / Luxury — Playfair Display + minimal palette, zero radius, no shadows.

```css
/* web-gen/src/templates/elegant/assets/tailwind.css */
@theme {
  --font-serif: 'Playfair Display', serif;
  --font-sans: 'Inter', sans-serif;
  --color-primary: oklch(0.35 0.02 30);   /* Ink brown */
  --color-secondary: oklch(0.65 0.05 30); /* Warm tan */
  --color-accent: oklch(0.45 0.03 20);     /* Deep espresso */
  --radius-none: 0;
  --shadow-none: none;
}
```

### Key Design Elements
- Serif headings, sans body
- Asymmetric layout
- Large typography scale contrast
- No border radius anywhere
- Monochrome palette with warm undertones
- Negative space emphasis
- No decorative shadows

### Pages
1. `code.html` — Home: hero dengan large serif headline, asymmetric product grid, editorial about section
2. `produk.html` — Products: grid dengan staggered layout
3. `tentang.html` — About: editorial layout dengan pull quotes
4. `kontak.html` — Contact: minimal dengan large type

---

## 4. Template Caching (Perf dari Tahap 2)

### Generate Cache

```typescript
// web-gen/src/generator.ts
interface GenerateCache {
  templateHash: string
  outputDir: string
  createdAt: Date
}

const cache = new Map<string, GenerateCache>()

export async function generate(params: GenerateParams): Promise<GenerateResult> {
  const cacheKey = createCacheKey(params)

  // Return cached result if nothing changed
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!
    if (isCacheValid(cached)) {
      return { generatedDir: cached.outputDir, cached: true }
    }
  }

  const result = await doGenerate(params)
  cache.set(cacheKey, {
    templateHash: hashParams(params),
    outputDir: result.generatedDir,
    createdAt: new Date(),
  })

  return result
}
```

### Cache Invalidation
- Store config changed → invalidate
- Product data changed → invalidate
- Template files changed → invalidate (detect via file hash)

---

## 5. Additional Improvements

### Error Feedback ke User

```typescript
// api/src/controllers/website.ts — improved generateWebsite
try {
  const result = await generate(params)
  // ... success
} catch (err) {
  if (err instanceof TemplateNotFoundError) {
    return sendResponse(res, 400, `Template tidak ditemukan: ${err.message}`)
  }
  if (err instanceof BuildFailedError) {
    // Log full error, return user-friendly message
    logger.error({ err }, 'Website generation build failed')
    return sendResponse(res, 500, 'Gagal membangun website. Silakan coba lagi.')
  }
  throw err
}
```

### Preview Sebelum Publish

```typescript
// POST /api/website/preview — generate ke temporary directory
export async function previewWebsite(req: Request, res: Response) {
  const params = { ...buildParams(store, products), slug: `preview-${Date.now()}` }
  const result = await generate(params)
  return sendResponse(res, 200, 'Preview siap', {
    url: `/s/${path.basename(result.generatedDir)}`,
  })
}
```

---

## Checklist Web-Gen

- [ ] Product search di semua HTML templates
- [ ] Dynamic features section (dari store config)
- [ ] Elegant template selesai
- [ ] Template caching untuk generate
- [ ] Preview sebelum publish
- [ ] Error feedback yang jelas ke user
- [ ] Web-gen test coverage ≥ 80%
