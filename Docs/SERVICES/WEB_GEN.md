# Service: Web Generator (`web-gen/`)

Library Bun + Astro untuk mengubah data toko menjadi **static site** siap di-upload. Paket ini **bukan** service berdiri sendiri dan **tidak menyentuh database** — semua data dikirim oleh `api/`.

---

## 1. Public API (`src/index.ts`)

```ts
import { generate, createZipStream, createZipFile } from "@web-gen/index.ts"
import type { GenerateParams, GenerateResult, StoreData, ProductData,
              OrdersStats, SiteConfig, ZipParams } from "@web-gen/index.ts"

const result = await generate({
  slug, template, theme?, store, products, config, stats, outputDir, uploadsDir?,
})
// → { success: boolean, outputPath: string | null, error?: string }

createZipStream({ sourceDir, slug })                 // NodeJS.ReadableStream
await createZipFile({ sourceDir, slug, outputPath })
```

`GenerateParams` (lihat `src/types.ts`):

| Field | Isi |
|-------|-----|
| `slug` | ID output, mis. `gen-20261022-101500` |
| `template` | Nama folder di `src/templates/` |
| `theme?` | Hanya untuk template Astro: `classic` (default) \| `modern` \| `vibrant` \| `elegant` |
| `store` | `businessName`, `phone`, `address`, `businessHours`, `paymentMethods`, `shippingInfo`, `returnPolicy`, `logoUrl` |
| `products[]` | `id`, `name`, `description`, `price`, `stock`, `isAvailable`, `imageUrl` |
| `config` | `hero {headline, subheadline, ctaText, imageUrl}`, `about {description, mission, imageUrl}`, `socialMedia`, `contact {email, mapsUrl}`, `selectedProductIds`, `colors {primary, secondary}`, `waOrderTemplate`, `logoUrl`, `faviconUrl` |
| `stats` | `totalOrders`, `completed`, `pending` (dipakai sebagai trust signal di template) |
| `outputDir` | Direktori tujuan (ditimpa bila sudah ada) |
| `uploadsDir?` | Sumber gambar yang di-copy ke output |

---

## 2. Pemilihan Template (`src/generator.ts`)

```
templates/<template>/code.html ada?  → generateHtml()   (template HTML flat)
tidak                                → generateAstro()  (template Astro)
Template folder tidak ada            → { success:false, error:"Template '<x>' not found" }
```

### Template yang tersedia

| Folder | Jenis | Catatan |
|--------|-------|---------|
| `default` | Astro 7 | Satu-satunya template Astro; punya `src/themes/{base,classic,modern,vibrant,elegant}.css` |
| `classic` | HTML multi-halaman | `code.html` (beranda), `produk.html`, `tentang.html`, `kontak.html` + partial `_navbar.html`, `_footer.html` |
| `cyberpunk`, `minimalist`, `modern`, `vibrant` | HTML | Struktur serupa (`code.html` + partial) |
| `mini` | HTML | Ada di repo, **tidak** ditawarkan di picker dashboard |

Picker di dashboard (`Website.tsx`) menampilkan: `default`, `modern`, `vibrant`, `cyberpunk`, `minimalist`, `classic`.

---

## 3. Generator HTML (`generateHtml`)

1. Muat semua partial `_*.html` (nama partial = nama file tanpa `_` dan `.html`).
2. Kumpulkan halaman = semua `*.html` non-partial (fallback ke `code.html`).
3. **Copy gambar** dari `config`/`store`/produk (mendukung path lokal & URL) ke `assets/`, lalu hasil path-nya di-inject ke konteks (`store.logoUrl`, `hero.imageUrl`, `product.<id>.imageUrl`, `favicon.url`).
4. Suntik `assets/fonts.css` lokal dan **buang** link Google Fonts (kecuali Material Symbols).
5. Render template dengan sintaks minimal:

| Sintaks | Arti |
|---------|------|
| `{{key}}` | Substitusi nilai **ter-escape HTML** |
| `{{{key}}}` | Substitusi nilai mentah (tanpa escape) |
| `{{>partial}}` | Inline partial (nama file `_nama.html`) |
| `{{#key}} … {{/key}}` | Blok bila `key` ada/truthy |
| `{{^key}} … {{/key}}` | Blok bila `key` kosong/falsy (dilakukan iteratif, mendukung blok bersarang hingga 10 tingkat) |
| `{{#.field}} … {{/.field}}` / `{{^.field}}` | Sama, tetapi untuk field item di dalam loop produk (tanpa blok bersarang) |
| `{{.field}}` / `{{{.field}}}` | Field item product loop, versi escaped / raw |

6. Konteks navigasi: `page.beranda`, `page.produk`, `page.tentang`, `page.kontak` (berisi `"1"` untuk halaman aktif; `code.html` dipetakan ke `beranda`).

Output: HTML statis + `assets/` (CSS template, gambar, `fonts.css`), plus `assets-manifest.json` berisi pemetaan gambar yang di-copy. Halaman `code.html` (atau `index.html`) ditulis sebagai `index.html`; halaman lain mempertahankan namanya.

---

## 4. Generator Astro (`generateAstro`)

1. Copy template ke direktori temporer (`mkdtemp` di `os.tmpdir()`).
2. Tulis file data ke `src/data/`: `store.json`, `products.json`, `site-config.json` (berisi `basePath: /s/<slug>/` dan `waOrderTemplate`), `orders-stats.json`.
3. Tulis `public/theme.css` (dan `base.css`) sesuai `theme`.
4. `bun install --silent` lalu `bunx astro build` (timeout 120 detik masing-masing).
5. Copy hasil `dist/` ke `outputDir`, lalu hapus direktori temporer.
6. Kegagalan install/build → `{ success:false, error: <stderr> }`.

`basePath` penting: build harus menulis aset dengan prefix `/s/<slug>/` agar bisa disajikan dari sub-path API.

---

## 5. Build-time Assets

| Script | Peran |
|--------|-------|
| `src/build-fonts.ts` | Unduh + ubah Google Fonts (Inter, Plus Jakarta Sans, JetBrains Mono, Bodoni Moda, Playfair Display, Outfit, Material Symbols Outlined) ke `src/assets/fonts/*.woff2` + `fonts.css` → template jadi offline-friendly |
| `src/build-css.ts` | Membaca **sumber desain** di `web-gen/templates_webgen/<nama>_wani_store/code.html`, mengekstrak blok `tailwind.config.theme.extend` (warna, spacing, borderRadius, fontFamily, fontSize), menyusun `input.css` (`@import "tailwindcss"` + `@source "**/*.html"` + `@theme`), lalu menjalankan `@tailwindcss/cli` untuk menghasilkan `src/templates/<template>/assets/tailwind.css`. Warna `primary*`/`secondary*` dibuat dinamis via variabel `--twc-*`; ada file `_known.html` yang memaksa utility umum ikut ter-generate |

`templates_webgen/` adalah **materi sumber desain** (mockup HTML + screenshot), bukan template runtime. Keduanya ikut di-commit; image Docker API menjalankan kedua script ini saat build. Output-nya (`src/assets/fonts/*.woff2`, `src/templates/*/assets/tailwind.css`) ikut terbawa ke image.

```
bun run src/build-fonts.ts && bun run src/build-css.ts   # dijalankan otomatis oleh api/Dockerfile
```

---

## 6. ZIP (`src/zip.ts`)

`createZipStream({ sourceDir, slug })` dan `createZipFile({ … outputPath })` memakai `archiver` level kompresi 9, membungkus seluruh `sourceDir` di dalam folder bernama `slug` (jadi hasil ekstrak = satu folder rapi). Dipakai `api` pada `GET /api/website/download`.

---

## 7. Cara API Memanggilnya

`api/src/controllers/website.ts` (lihat [API_CONTRACT.md §3.10](../API_CONTRACT.md)):

1. Ambil `Store` + produk tersedia (difilter `selectedProductIds` bila diisi) + statistik order.
2. `slug = gen-YYYYMMDD-HHmmss`, `theme` dari `WebSite.config.theme`.
3. `await import("@web-gen/index.ts")` → `generate(...)` dengan `outputDir = api/generated-sites/<slug>` dan `uploadsDir = api/uploads`.
4. Simpan riwayat ke tabel `WebsiteGeneration` (status `success`/`failed` + pesan).
5. Perbarui symlink `generated-sites/latest` → slug terbaru (dipakai `/s/latest/` dan `/s/preview`).
6. `bun build` API menyalin `web-gen/src/templates` + `web-gen/src/assets` ke `dist/`, sehingga `import.meta.dir`-based path tetap benar di image produksi.

---

## 8. Menjalankan Secara Lokal

```bash
cd web-gen
bun install
bun run src/generator.ts      # CLI demo: template "modern" → generated-sites/demo-toko
bun run build:template        # install + build template default (Astro) standalone
bun test                      # test/generator.test.ts + test/zip.test.ts
bun run tsc --noEmit          # type check (tidak ada script bawaan; jalankan manual)
```

`bun run src/generator.ts` menjalankan mode demo (`import.meta.main`): data contoh toko, output ke `web-gen/generated-sites/demo-toko`.

---

## 9. Batasan

- Template HTML hanya mendukung sintaks minimal di atas — tidak ada loop bersarang, filter, atau ekspresi logika kompleks.
- Template Astro membutuhkan `bun install` + `astro build` (jaringan + waktu); kegagalan di sini menggagalkan seluruh proses generate.
- `mini` tidak dapat dipilih dari dashboard.
- Theme Astro (`classic`/`modern`/`vibrant`/`elegant`) menggantikan variabel CSS; warna `primary`/`secondary` dari `WebSite.config` tetap diinjeksi sebagai `--twc-*`.
