# WANI Web-Gen — API Specification

> REST API untuk Website Generator WANI. Base URL: `http://localhost:3001/api`

---

## Daftar Isi

1. [Format Respons & Auth](#1-format-respons--auth)
2. [Database — WebSite](#2-database--website)
3. [Endpoint Site Config](#3-endpoint-site-config)
4. [Endpoint Preview](#4-endpoint-preview)
5. [Endpoint Download](#5-endpoint-download)
6. [Endpoint Publish](#6-endpoint-publish)
7. [Static File Serving](#7-static-file-serving)
8. [Error Codes](#8-error-codes)
9. [Ringkasan Endpoint](#9-ringkasan-endpoint)

---

## 1. Format Respons & Auth

### Unified JSON Response

```typescript
// Success (status < 400)
{
  "status": "success",
  "message": string,
  "data": T | null
}

// Error (status >= 400)
{
  "status": "failure",
  "message": string,
  "data": null | ZodIssue[]
}
```

### Authentication

Untuk endpoint yang butuh auth:
```
Authorization: Bearer {API_TOKEN}
```

`API_TOKEN` dari env variable. Endpoint yang butuh auth ditandai dengan 🔒.

---

## 2. Database — WebSite

Single-row table (`id: "default"`) — satu site per instalasi WANI.

```prisma
model WebSite {
  id        String   @id @default("default")
  config    Json     @default("{}")
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Semua konfigurasi disimpan di field `config` (JSON). Default config shape:

```typescript
interface SiteConfig {
  heroHeadline: string
  heroSubheadline?: string
  aboutText: string
  primaryColor: string         // hex, default "#059669"
  secondaryColor: string       // hex, default "#f59e0b"
  phone?: string
  selectedProductIds: string[]
  template: string             // default "default"
  theme: string                // "classic" | "modern" | "vibrant" | "elegant"
  contactEmail?: string
  contactMapsUrl?: string
  socialMedia?: Record<string, string>  // platform → URL
  heroImageUrl?: string | null
  aboutImageUrl?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  ctaText?: string
}
```

---

## 3. Endpoint Site Config

### GET /api/website

Ambil konfigurasi website generator.

```typescript
// Response 200
{
  "status": "success",
  "data": {
    "heroHeadline": "Toko Ayu",
    "heroSubheadline": "Kuliner enak sejak 2010",
    "aboutText": "Toko Ayu menyediakan...",
    "primaryColor": "#059669",
    "secondaryColor": "#f59e0b",
    "phone": "6281234567890",
    "selectedProductIds": ["uuid-1", "uuid-2"],
    "template": "default",
    "theme": "classic",
    "contactEmail": "toko@example.com",
    "contactMapsUrl": "",
    "socialMedia": {},
    "heroImageUrl": null,
    "aboutImageUrl": null,
    "logoUrl": null,
    "faviconUrl": null,
    "ctaText": "Pesan Sekarang"
  }
}
```

### PUT /api/website 🔒 JWT

Buat atau update konfigurasi website generator. **Idempotent** — panggil pertama = create, selanjutnya = update.

```typescript
// Request body (partial — semua field optional)
{
  "heroHeadline": "Toko Ayu",                    // optional
  "heroSubheadline": "Kuliner enak sejak 2010",  // optional
  "aboutText": "Toko Ayu menyediakan...",        // optional
  "primaryColor": "#059669",                     // optional, hex color
  "secondaryColor": "#f59e0b",                   // optional, hex color
  "phone": "6281234567890",                      // optional
  "selectedProductIds": ["uuid-1", "uuid-2"],    // optional
  "template": "default",                         // optional
  "theme": "classic",                            // optional, "classic"|"modern"|"vibrant"|"elegant"
  "contactEmail": "toko@example.com",            // optional
  "contactMapsUrl": "",                          // optional
  "socialMedia": {},                             // optional
  "heroImageUrl": null,                          // optional
  "aboutImageUrl": null,                         // optional
  "logoUrl": null,                               // optional
  "faviconUrl": null,                            // optional
  "ctaText": "Pesan Sekarang"                    // optional
}

// Response 200
{
  "status": "success",
  "message": "website config updated",
  "data": {
    "heroHeadline": "Toko Ayu",
    // ... (same shape as GET response)
  }
}
```

```typescript
// Error 400 — invalid hex color
{
  "status": "failure",
  "message": "Validation failed",
  "data": [
    { "path": "primaryColor", "message": "Must be hex color" }
  ]
}
```

---

## 4. Endpoint Generate (Preview + Production)

### POST /api/website/generate 🔒 JWT

Generate website. Server akan:

1. Validasi request + simpan config ke DB (WebSite table)
2. Fetch data Store, Products (filtered), Orders stats dari DB
3. Panggil `generate()` dari web-gen → copy template → inject data → `bun install` → `bunx astro build`
4. Output ke `api/generated-sites/default/`
5. Dashboard bisa lihat hasil di `/s/default/`

```typescript
// Request body
{
  "template": "default"     // optional, default "default"
}

// Response 200 — sukses
{
  "status": "success",
  "message": "website generated",
  "data": {
    "outputPath": "/abs/path/api/generated-sites/default"
  }
}

// Response 500 — build gagal
{
  "status": "failure",
  "message": "Generate failed: ..."
}
```

**Timeout:** 120 detik (build Astro + install dependencies).

---

## 5. Endpoint Download

### GET /api/website/download 🔒 JWT

Download hasil generate terakhir sebagai file `.zip`.

```typescript
// Response 200 — stream file
// Content-Type: application/zip
// Content-Disposition: attachment; filename="website-default.zip"

// Response 404 — belum di-generate
{
  "status": "failure",
  "message": "no generated website found — generate first"
}
```

**Isi ZIP:**
```
website-default.zip
└── default/
    ├── index.html
    ├── produk/index.html
    ├── kontak/index.html
    ├── _astro/
    │   ├── index.[hash].css
    │   ├── index.[hash].js
    │   └── ...
    └── favicon.ico
```

---

## 6. Endpoint Publish

### POST /api/website/publish 🔒 JWT

Tandai website sebagai published (set `published: true` di database). Generate harus dilakukan terlebih dahulu.

```typescript
// Request body — kosong
{}

// Response 200
{
  "status": "success",
  "message": "website published"
}

// Response 404 — belum di-generate
{
  "status": "failure",
  "message": "no generated website found — generate first"
}
```

---

## 7. Static File Serving

Express menyajikan folder `generated-sites/` sebagai static files:

```typescript
// api/src/server.ts
const generatedDir = path.resolve(import.meta.dir, "..", "generated-sites")
app.use("/s", express.static(generatedDir))
```

Hasil generate bisa diakses di browser:

```
http://localhost:3001/s/default/            → index.html
http://localhost:3001/s/default/produk/     → produk/index.html
http://localhost:3001/s/default/kontak/     → kontak/index.html
```

---

## 8. Error Codes

| Status | Class | Penyebab |
|--------|-------|----------|
| 400 | `BadRequestError` | Body tidak valid (Zod), slug tidak URL-safe, config kurang |
| 401 | `UnauthorizedError` | Token tidak ada atau tidak cocok |
| 404 | `NotFoundError` | Resource tidak ditemukan |
| 500 | `InternalServerError` | Build gagal, generator error, database error |

### Contoh Error Response

```json
{
  "status": "failure",
  "message": "Validation failed",
  "data": [
    { "path": "config.selectedProductIds", "message": "Required" },
    { "path": "config.hero.headline", "message": "String must contain at least 1 character(s)" }
  ]
}
```

---

## 9. Ringkasan Endpoint

| Method | Path | Auth | Status | Deskripsi |
|--------|------|------|--------|-----------|
| `GET` | `/api/website` | — | ✅ Existing | Ambil config website |
| `PUT` | `/api/website` | 🔒 JWT | ✅ Existing | Simpan config website |
| `POST` | `/api/website/generate` | 🔒 JWT | ✅ Existing | Generate static site via web-gen |
| `GET` | `/api/website/download` | 🔒 JWT | ✅ Existing | Download ZIP hasil generate |
| `POST` | `/api/website/publish` | 🔒 JWT | ✅ Existing | Tandai sebagai published |
| `GET` | `/api/website/generations` | 🔒 JWT | ✅ Existing | Riwayat generate |
| `DELETE` | `/api/website/generations/:id` | 🔒 JWT | ✅ Existing | Hapus riwayat generate |
| `GET` | `/s/:slug` | — | ✅ Existing | Serve generated static site |

---

> **Catatan Implementasi**: Semua endpoint sudah diimplementasikan di `api/`.
> Static file diserve dari `api/generated-sites/` via Express `express.static` di path `/s`.
