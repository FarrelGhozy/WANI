# WANI Web-Gen — Architecture

> Static site generator untuk UMKM. Package standalone (Bun + Astro 7) yang menghasilkan multi-page website statis dari data toko, produk, dan pesanan.

---

## Daftar Isi

1. [Stack](#stack)
2. [Peran & Batasan](#peran--batasan)
3. [Workflow Overview](#workflow-overview)
4. [Directory Structure](#directory-structure)
5. [Data Flow](#data-flow)
6. [Template Architecture](#template-architecture)
7. [WhatsApp Integration](#whatsapp-integration)
8. [Generator Service](#generator-service)
9. [ZIP Download](#zip-download)
10. [Output Structure](#output-structure)
11. [API Integration](#api-integration)
12. [Dashboard UI — Halaman /website](#dashboard-ui--halaman-website)
13. [Commands](#commands)
14. [Design System (Generated Site)](#design-system-generated-site)

---

## Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Runtime** | Bun | 1.3.x |
| **Generator** | TypeScript (Bun native) | — |
| **Template Engine** | Astro | 7.x |
| **Output** | Static HTML + CSS + JS | — |

### Prinsip

- **No downgrade.** Jika ada error, cari solusi via searching — jangan turunin versi.
- **Latest stable.** Astro 7.x, bukan beta/rc.
- **Statis murni.** Output adalah folder HTML/CSS/JS siap deploy — zero server runtime.
- **Satu template per folder.** Setiap template di `src/templates/{nama}/` adalah project Astro yang lengkap dan standalone.

---

## Peran & Batasan

| Aspek | Keterangan |
|-------|-----------|
| **Tugas** | Generate static HTML dari data yang diberikan |
| **Bukan tugas** | Menyimpan config, menyajikan API, autentikasi |
| **Sumber data** | Diterima via parameter function dari API (`import { generate }`) |
| **Output** | Folder static files di `api/generated-sites/{slug}/` |
| **Preview** | Sama seperti publish, output ke `api/generated-sites/{slug}/` |
| **Integrasi** | Dipanggil langsung (`import`) dari `api/` — Bun resolve TypeScript tanpa build |

web-gen **tidak punya akses database sendiri**. Semua data dikirim sebagai argument function oleh API.

### Preview & Download

- **Preview via ZIP** — hasil generate bisa di-download sebagai ZIP untuk preview lokal tanpa perlu deploy.
- **Tombol WhatsApp** — setiap halaman produk menyertakan tombol "Pesan via WhatsApp" yang otomatis mengisi nomor toko dan template pesanan.

---

## Workflow Overview

Proses dari klik "Generate" sampai site terpublish:

```
┌────────────┐    ┌───────────────┐    ┌────────────────┐    ┌─────────────┐
│  Dashboard  │───→│  Generator    │───→│  Static Files  │───→│  Publish    │
│  /website   │    │  (Bun)        │    │  (HTML/CSS/JS) │    │  (manual)   │
│  klik       │    │  fetch API    │    │  preview local │    │  Vercel/    │
│  Generate   │    │  + render     │    │  ZIP download  │    │  Netlify    │
└────────────┘    └───────────────┘    └────────────────┘    └─────────────┘
                       │                       │
                       ▼                       ▼
                  Data (JSON)            Output Folder
                  Store + Products       generated-sites/
                  + Orders Stats         (atau ZIP)
```

Alur detail:

1. **Dashboard** — `/website` menampilkan form "Content Config" + tombol "Generate Now"
2. **Generator** — membaca Store, Products, Orders lewat Prisma query langsung (bukan HTTP)
3. **Render** — data diformat ke JSON, di-inject ke template Astro, lalu `astro build` menghasilkan static files
4. **Preview** — hasil generate bisa dilihat via `bun run preview` (server statis lokal)
5. **Download** — hasil generate di-zip jadi `wani-website.zip` untuk di-download user
6. **Publish** — link ke panduan deploy (Vercel / Netlify / manual FTP)

---

## Directory Structure

```
web-gen/
├── ARCHITECTURE.md              # ← File ini
├── package.json                 # Bun package (module: src/index.ts)
├── tsconfig.json                # TypeScript config (Preserve module, noEmit)
├── bun.lock
├── .gitignore
├── .env.example
│
├── src/
│   ├── index.ts                 # Entrypoint — export `generate()` + `createZipStream()` / `createZipFile()`
│   ├── generator.ts             # Core logic: copy → inject → build → output
│   ├── zip.ts                   # ZIP archive generator (archiver)
│   ├── types.ts                 # Type definitions (SiteConfig, StoreData, dll)
│   └── templates/
│       └── default/             # Template Astro standalone
│           ├── astro.config.mjs
│           ├── package.json
│           └── src/
│               ├── pages/
│               │   ├── index.astro       — Home: Hero + About + Produk Unggulan
│               │   ├── produk.astro      — Katalog produk lengkap (grid)
│               │   └── kontak.astro      — Info toko + jam operasional
│               ├── components/
│               │   ├── Header.astro
│               │   ├── Footer.astro
│               │   ├── HeroSection.astro
│               │   ├── ProductCard.astro
│               │   ├── AboutSection.astro
│               │   ├── ContactInfo.astro
│               │   └── WaButton.astro         # Tombol "Pesan via WhatsApp"
│               ├── layouts/
│               │   └── BaseLayout.astro
│               └── data/                  ← DI-GENERARE oleh generator.ts
│                   ├── store.json
│                   ├── products.json
│                   ├── site-config.json
│                   └── orders-stats.json
│
└── generated-sites/             # Output static files (gitignored, mostly unused)
    └── .gitkeep                  # Output utama ada di api/generated-sites/
```

### Template Naming Convention

Template folder name = `slug` yang dipilih di API config. Default template `"default"` mengacu ke `src/templates/default/`.

Template bisa ditambah di masa depan: `src/templates/modern/`, `src/templates/minimal/`, dll.

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  API (controllers/site.ts)                                       │
│                                                                  │
│  1. Validasi request + simpan config ke DB (WebSite table)       │
│  2. Fetch data dari DB:                                          │
│     - Store (single-row)                                         │
│     - Products (filtered by selectedProductIds + isAvailable)    │
│     - Orders stats (total orders, completed, pending)            │
│  3. Panggil web-gen:                                             │
│     import { generate } from '../../web-gen/src/index.ts'        │
│     await generate({                                             │
│       slug, template, store, products, config, stats, outputDir  │
│     })                                                           │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  web-gen (generator.ts)                                          │
│                                                                  │
│  generate({ slug, template, store, products, config, stats })     │
│   ├── 1. Resolve template path sesuai nama template              │
│   ├── 2. Copy template/ → workingDir/ (fs.cpSync)                │
│   ├── 3. Generate src/data/*.json ke workingDir:                 │
│   │     - store.json         ← dari API Store                    │
│   │     - products.json      ← dari API Products                 │
│   │     - site-config.json   ← dari API site config (hero,       │
│   │                            about, colors, contact info)      │
│   │     - orders-stats.json  ← dari API Orders stats             │
│   ├── 4. bun install --silent di workingDir                      │
│   ├── 5. bunx astro build di workingDir                          │
│   ├── 6. Copy workingDir/dist/ → outputDir/{slug}/               │
│   └── 7. Bersihkan workingDir                                    │
│                                                                  │
│  return { success, outputPath }                                  │
└──────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  api/generated-sites/{slug}/                                     │
│                                                                  │
│  ├── index.html           ── hasil render index.astro            │
│  ├── produk/index.html    ── hasil render produk.astro           │
│  ├── kontak/index.html    ── hasil render kontak.astro           │
│  ├── _astro/              ── asset hashed (CSS, JS)              │
│  └── favicon.ico                                                │
│                                                                  │
│  Siap di-copy ke Vercel / Netlify / folder static apapun.        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Template Architecture

### Struktur Internal Template

Setiap template adalah **project Astro standalone** — punya `package.json`, `astro.config.mjs`, dan `src/` sendiri.

Template **tidak bisa di-build sendiri tanpa data**. Data berasal dari file `src/data/*.json` yang di-generate oleh `generator.ts`.

### Cara Template Membaca Data

Template membaca data dari `src/data/*.json` menggunakan `fs` + `parse` di frontmatter Astro:

```astro
---
// src/pages/index.astro — Contoh cara baca data
import * as fs from "node:fs"

const store = JSON.parse(fs.readFileSync("src/data/store.json", "utf-8"))
const products = JSON.parse(fs.readFileSync("src/data/products.json", "utf-8"))
const siteConfig = JSON.parse(fs.readFileSync("src/data/site-config.json", "utf-8"))
const stats = JSON.parse(fs.readFileSync("src/data/orders-stats.json", "utf-8"))
---
```

### Halaman Template (3 halaman)

| Halaman | Path | Konten |
|---------|------|--------|
| **Home** | `/` → `index.html` | Hero section (headline + subheadline + CTA), About section (deskripsi toko), Featured products grid (max 6 produk) + tombol WA per produk, Contact info ringkas |
| **Produk** | `/produk` → `produk/index.html` | Full product catalog. Grid card: image, name, price, stock badge, description, tombol "Pesan via WhatsApp" per produk. Category filter via anchor links. |
| **Kontak** | `/kontak` → `kontak/index.html` | Nama toko, alamat lengkap, nomor telepon (click-to-call + WA link), jam operasional, metode pembayaran yang diterima, link Google Maps |

### Komponen Template

| Komponen | Peran |
|----------|-------|
| `BaseLayout.astro` | HTML shell: <head> (SEO meta, title, theme-color), Tailwind CSS, font, Header + Footer |
| `Header.astro` | Navbar: logo (nama toko), links ke Home / Produk / Kontak, responsive hamburger mobile |
| `Footer.astro` | Copyright, social links (jika ada), credit |
| `HeroSection.astro` | Hero area: headline, subheadline, CTA button |
| `ProductCard.astro` | Card: image, name, price (format Rp), stock status, description truncated |
| `AboutSection.astro` | About toko: deskripsi, business hours |
| `ContactInfo.astro` | Contact details: phone, address, maps link, payment methods |
| `WaButton.astro` | Tombol "Pesan via WhatsApp" dengan nomor toko + template pesanan |

### Styling Template

Template menggunakan **Tailwind CSS v4** (CDN via `<script src="https://unpkg.com/@tailwindcss/browser@4">` — no build step needed for CSS).

Warna diambil dari `site-config.json`:
```json
{
  "colors": {
    "primary": "#059669",
    "secondary": "#f59e0b"
  }
}
```

Inline style di `<head>` untuk CSS variables:
```astro
<style>
  :root {
    --color-primary: {siteConfig.colors.primary};
    --color-secondary: {siteConfig.colors.secondary};
  }
</style>
```

Default: primary = teal-600 (`#059669`), secondary = amber-500 (`#f59e0b`).

---

## WhatsApp Integration

Setiap produk yang ditampilkan di generated site memiliki tombol **"Pesan via WhatsApp"** yang mengarah ke chat WhatsApp toko dengan pesan template pesanan.

### Cara Kerja

```
User klik "Pesan via WhatsApp"
        │
        ▼
Buka WhatsApp dengan pre-filled message:
https://wa.me/62xxxxxxxxx?text=Halo%20...%2C%20saya%20ingin%20memesan%3A%0A...
        │
        ▼
Template pesan: "Halo {store.businessName}, saya ingin memesan:
                {product.name} — Rp {product.price}
                Terima kasih."
```

### Implementasi di `WaButton.astro`

```astro
---
const waNumber = store.phone.replace(/[^0-9]/g, "")
const message = encodeURIComponent(
  `Halo ${store.businessName}, saya ingin memesan:\n` +
  `${product.name} — Rp ${product.price.toLocaleString("id-ID")}\n` +
  `Terima kasih.`
)
const waUrl = `https://wa.me/${waNumber}?text=${message}`
---
<a href={waUrl} target="_blank" rel="noopener noreferrer">
  Pesan via WhatsApp
</a>
```

### Data Produk di Template

`products.json` menyertakan field yang dibutuhkan WA button:
- `nama` — nama produk
- `harga` — number, diformat Rp di rendering
- `phone` — nomor WhatsApp toko (disalin dari store)

### Keuntungan

- **Zero backend** — semua client-side, WA link murni URL scheme
- **Pre-filled message** — customer tinggal kirim, tidak perlu ngetik manual
- **Integrasi erat** — produk dan nomor toko dari data yang sama di database

---

## Generator Service

File: `src/generator.ts`

### Function Signature

```typescript
interface GenerateParams {
  slug: string
  template: string  // nama folder di src/templates/
  theme?: string    // nama theme CSS (classic/modern/vibrant/elegant)
  store: StoreData
  products: ProductData[]
  config: SiteConfig
  stats: OrdersStats
  outputDir: string  // absolute path
}

interface GenerateResult {
  success: boolean
  outputPath: string | null
  error?: string
}

export async function generate(params: GenerateParams): Promise<GenerateResult>
```

### Steps Detail

1. **Resolve template path**: `path.join(import.meta.dir, "templates", params.template)` — error jika template tidak ada
2. **Buat working directory**: `fs.mkdtempSync()` di `/tmp/` atau `os.tmpdir()`
3. **Copy template**: `fs.cpSync(templatePath, workingDir, { recursive: true })`
4. **Generate data JSON files**:
   - `workingDir/src/data/store.json`
   - `workingDir/src/data/products.json`
   - `workingDir/src/data/site-config.json`
   - `workingDir/src/data/orders-stats.json`
5. **Install dependencies**: `Bun.spawnSync(["bun", "install", "--silent"], { cwd: workingDir })`
6. **Build**: `Bun.spawnSync(["bunx", "astro", "build"], { cwd: workingDir })`
7. **Copy output**: `fs.cpSync(path.join(workingDir, "dist"), outputDir, { recursive: true })`
8. **Cleanup**: `fs.rmSync(workingDir, { recursive: true, force: true })`
9. **Return**: `{ success: true, outputPath: outputDir }`

### Error Handling

- Jika template tidak ditemukan → return `{ success: false, error: "Template 'xxx' not found" }`
- Jika npm install gagal → return error dengan pesan dari stderr
- Jika astro build gagal → return error dengan pesan dari stderr
- Output path sudah ada → overwrite (hapus dulu sebelum copy)
- Timeout build → 120s default, bisa dikonfigurasi

---

## ZIP Download

Generator menyediakan fungsi `createZipStream()`/`createZipFile()` yang mengompres hasil generate menjadi file `.zip` untuk di-download user.

### File: `src/zip.ts`

```typescript
import archiver from "archiver"

export async function createZipFile(params: ZipParams & { outputPath: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(params.outputPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", resolve)
    archive.on("error", reject)

    archive.pipe(output)
    archive.directory(params.sourceDir, params.slug)
    archive.finalize()
  })
}
```

### Alur ZIP

1. Generator selesai build → output ada di `generated-sites/{slug}/`
2. API panggil `createZipFile({ sourceDir: outputDir, slug, outputPath })` → file `.zip` di disk
3. Atau streaming langsung via `createZipStream({ sourceDir, slug })` → pipe ke HTTP response
4. File ZIP bersifat sementara — bisa di-cache sesuai kebutuhan

### Keuntungan

- **Preview tanpa deploy** — user download ZIP, extract, buka `index.html` di browser
- **Satu file** — mudah dikirim via email/chat
- **Compressed** — level 9 zlib, ukuran minimal
- **Integrasi langsung** — `createZipStream()`/`createZipFile()` ada di export `src/index.ts`

---

## Output Structure

Setelah generate, folder `api/generated-sites/{slug}/` berisi:

```
{slug}/
├── index.html               # Home page — fully static
├── produk/index.html         # Product catalog page
├── kontak/index.html         # Contact page
├── _astro/                   # Asset files (hashed by Astro)
│   ├── index.[hash].css
│   ├── index.[hash].js
│   └── ...
├── favicon.ico
└── (file statis lain sesuai template)
```

### Preview

Preview output di `api/generated-sites/{slug}/` — struktur yang sama. API serve folder ini via Express static middleware di path `/s/{slug}`.

### ZIP Download

Hasil generate bisa di-download sebagai file ZIP (`website-{slug}.zip`). File ZIP bersifat sementara, tidak disimpan permanen.

### Publish

Publish menandai website sebagai `published: true` di database. Hasil generate tetap di `api/generated-sites/{slug}/`. Folder ini siap di-copy ke:
- Vercel (`vercel deploy --prebuilt`)
- Netlify (drag & drop folder)
- Nginx / Apache (copy ke document root)
- GitHub Pages (push ke branch `gh-pages`)
- Cloudflare Pages
- any static host

---

## Dashboard UI — Halaman /website

Halaman `/website` di Dashboard adalah antarmuka user untuk mengelola website toko. Berada di route `/dashboard/website`.

### Layout Halaman

```
┌─────────────────────────────────────────────────┐
│  Topbar: Website                                │
├─────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  Content Config   │  │  Quick Actions       │ │
│  │                   │  │                      │ │
│  │  - Hero Headline  │  │  [Generate Now]      │ │
│  │  - Hero Subhead   │  │  [Preview Website]   │ │
│  │  - About Text     │  │  [Download ZIP]      │ │
│  │  - Warna Primary  │  │  [Publish]           │ │
│  │  - Warna Second   │  │                      │ │
│  │  - Pilih Produk   │  └──────────────────────┘ │
│  │  - Template      │                            │
│  └──────────────────┘                            │
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │  Activity Log / Riwayat Generate              ││
│  │  [2025-07-20 14:30] Generate ✅ — 3 produk    ││
│  │  [2025-07-19 10:15] Publish ✅ — ke Vercel   ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Content Config

Form untuk mengatur konten website:

| Field | Type | Default | Keterangan |
|-------|------|---------|-----------|
| `heroHeadline` | text | `"Selamat Datang di {store.name}"` | Headline utama hero section |
| `heroSubheadline` | text | `"Temukan produk terbaik kami"` | Subheadline hero |
| `aboutText` | textarea | deskripsi dari Store | About section content |
| `primaryColor` | color | `#059669` | Warna utama (teal-600) |
| `secondaryColor` | color | `#f59e0b` | Warna sekunder (amber-500) |
| `phone` | text | dari Store.noWa | Nomor WhatsApp untuk tombol WA |
| `selectedProductIds` | multi-select | all | Produk yang ditampilkan |
| `template` | select | `"default"` | Template yang digunakan |

### Quick Actions

| Tombol | Aksi |
|--------|------|
| **Generate Now** | Panggil endpoint `POST /api/website/generate` → build website |
| **Preview Website** | Buka tab baru ke `/s/preview/{slug}/` |
| **Download ZIP** | Download `POST /api/website/download` → ZIP file |
| **Publish** | Panggil `POST /api/website/publish` → output ke folder final |

### API Endpoints (Dashboard → API)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/website` | Get current website config |
| `PUT` | `/api/website` | Update website config |
| `POST` | `/api/website/generate` | Generate website + preview |
| `POST` | `/api/website/download` | Download hasil generate sebagai ZIP |
| `POST` | `/api/website/publish` | Publish website (copy ke final dir) |

---

## API Integration

### Cara API Memanggil web-gen

```typescript
// api/src/controllers/website.ts
import { generate } from "@web-gen/index.ts"
import path from "node:path"

export async function generateWebsite(req: Request, res: Response) {
  const store = await StoreModel.find()
  const products = await ProductModel.getAll()
  const { totalOrders } = await OrderModel.getStats()
  const stats = await OrderModel.getStatusCounts()

  const slug = "default"
  const GENERATED_DIR = path.resolve(import.meta.dir, "..", "..", "generated-sites")

  const result = await generate({
    slug,
    template: req.body.template,
    theme: config.theme,
    store,
    products: selectedProducts,
    config: siteConfig,
    stats: { totalOrders, ...stats },
    outputDir: path.join(GENERATED_DIR, slug),
  })

  if (result.success) {
    await WebSiteModel.markPublished()
  }

  sendResponse(res, result.success ? 200 : 500, result)
}
```

### Preview — Serve Static Files

Di Express, static middleware sudah terpasang di `api/src/server.ts`:

```typescript
// api/src/server.ts
const generatedDir = path.resolve(import.meta.dir, "..", "generated-sites")
app.use("/s", express.static(generatedDir))
```

Preview bisa diakses via:
```
http://localhost:3001/s/default/               ← generated site
```

---

## Commands

Semua command dijalankan dari direktori `web-gen/`.

```bash
# Install dependencies
bun install

# Direct generate via CLI (standalone test)
# Data diambil dari argumen atau file JSON
bun run src/generator.ts --slug test --template default --data ./test-data.json

# Type check
bun run tsc --noEmit
```

### AGENTS.md Entry (nanti ditambahkan ke root)

```
**web-gen** (`web-gen/`):
- `bun install` — install dependencies
- `bun run src/index.ts` — test generate (CLI mode)
```

---

## Design System (Generated Site)

### Palet Warna

Default (bisa diubah user via dashboard):

| Peran | Default | CSS Variable |
|-------|---------|-------------|
| **Primary** | Teal-600 `#059669` | `--color-primary` |
| **Secondary** | Amber-500 `#f59e0b` | `--color-secondary` |
| **Background** | Stone-50 `#fafaf9` | — |
| **Text** | Stone-900 `#1c1917` | — |
| **Text Muted** | Stone-500 `#78716c` | — |

### Typography

- Body: system-ui, -apple-system, sans-serif
- Headings: system-ui, bold weight
- Angka: tabular-nums

### Layout

- Max-width container: 72rem (`max-w-6xl`)
- Card grid produk: responsive 1/2/3 kolom
- Navbar sticky di atas
- Footer dengan copyright

### Responsive

- Mobile-first dengan Tailwind breakpoints
- Navbar collapse ke hamburger menu di mobile
- Product grid: 1 kolom mobile, 2 tablet, 3 desktop

### SEO

Setiap halaman punya:
- `<title>` yang relevan (nama toko + halaman)
- `<meta name="description">`
- `<meta name="theme-color">` (warna primary)
- Open Graph tags (opsional)
- viewport meta

---

## Future Considerations

| Fitur | Keterangan |
|-------|-----------|
| **Template tambahan** | Cukup buat folder `src/templates/{nama}/` dengan struktur Astro yang sama |
| **Custom CSS** | Bisa ditambah field `customCss` di site-config.json, di-inject via `<style>` |
| **Custom domain** | user configurasi domain, simpan di WebSite table |
| **Auto deploy** | Integrasi dengan Vercel/Netlify API untuk auto-deploy setelah generate |
| **Multi-page** | Template bisa punya halaman lebih dari 3 (blog, testimonial, dll) |
| **Image optimization** | Integrasi dengan Astro Image untuk responsive images |
| **Markdown content** | Bisa pakai file .md untuk halaman About, Terms, dll |
| **Share via WhatsApp** | Tombol share produk/link via WA di card produk |
| **WhatsApp Catalog** | Integrasi dengan WhatsApp Catalog API untuk sync produk |
| **Order via WA** | Auto-reply dengan format pesanan dari generated product card |
| **Multi-template WA style** | Setiap template punya variasi gaya tombol WA (floating, inline, card) |
