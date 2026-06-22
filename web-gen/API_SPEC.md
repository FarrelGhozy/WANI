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

```sql
CREATE TABLE "WebSite" (
  "id"          TEXT PRIMARY KEY DEFAULT 'default',
  "slug"        TEXT NOT NULL UNIQUE,
  "template"    TEXT NOT NULL DEFAULT 'default',
  "config"      JSONB NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMP,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Default Config Shape

```typescript
interface SiteConfig {
  hero: {
    headline: string
    subheadline: string
    ctaText: string
  }
  about: {
    description: string
    mission: string | null
  }
  contact: {
    email: string | null
    mapsUrl: string | null
  }
  selectedProductIds: string[]
  colors: {
    primary: string    // hex, default "#059669"
    secondary: string  // hex, default "#f59e0b"
  }
  waOrderTemplate: string  // default lihat ARCHITECTURE.md
}
```

### Default Values (first create)

Saat pertama kali `GET /api/site` dan belum ada data, endpoint akan return `data: null`. Dashboard bisa auto-create dengan `PUT /api/site` dengan body minimal.

---

## 3. Endpoint Site Config

### GET /api/site

Ambil konfigurasi website generator.

```typescript
// Response 200 — site sudah ada
{
  "status": "success",
  "data": {
    "id": "default",
    "slug": "toko-ayu",
    "template": "default",
    "config": {
      "hero": {
        "headline": "Toko Ayu",
        "subheadline": "Kuliner enak sejak 2010",
        "ctaText": "Lihat Produk"
      },
      "about": {
        "description": "Toko Ayu menyediakan...",
        "mission": null
      },
      "contact": {
        "email": null,
        "mapsUrl": null
      },
      "selectedProductIds": ["uuid-1", "uuid-2"],
      "colors": {
        "primary": "#059669",
        "secondary": "#f59e0b"
      },
      "waOrderTemplate": "Halo {store.businessName}, saya tertarik dengan produk berikut:\n\n• {product.name}\n• Harga: Rp {product.price}\n\nApakah produk ini tersedia?"
    },
    "publishedAt": null,
    "createdAt": "2026-06-22T00:00:00.000Z",
    "updatedAt": "2026-06-22T00:00:00.000Z"
  }
}

// Response 200 — site belum pernah dibuat (data null)
{
  "status": "success",
  "message": "site not configured yet",
  "data": null
}
```

### PUT /api/site 🔒

Buat atau update konfigurasi website generator. **Idempotent** — panggil pertama = create, selanjutnya = update.

```typescript
// Request body
{
  "slug": "toko-ayu",                    // required, URL-safe
  "template": "default",                  // optional, default "default"
  "config": {                             // required
    "hero": {
      "headline": "Toko Ayu",             // required
      "subheadline": "Kuliner enak sejak 2010", // optional
      "ctaText": "Lihat Produk"           // optional
    },
    "about": {
      "description": "Toko Ayu menyediakan...", // required
      "mission": null                     // optional
    },
    "contact": {
      "email": null,                      // optional
      "mapsUrl": null                     // optional
    },
    "selectedProductIds": ["uuid-1", "uuid-2"], // required, array of Product IDs
    "colors": {
      "primary": "#059669",               // optional, default "#059669"
      "secondary": "#f59e0b"              // optional, default "#f59e0b"
    },
    "waOrderTemplate": "Halo..."          // optional, default template
  }
}

// Response 200
{
  "status": "success",
  "message": "site config updated",
  "data": {
    "id": "default",
    "slug": "toko-ayu",
    "template": "default",
    "config": { ... },
    "publishedAt": null,
    "createdAt": "2026-06-22T00:00:00.000Z",
    "updatedAt": "2026-06-22T00:00:00.000Z"
  }
}
```

```typescript
// Error 400 — slug tidak valid
{
  "status": "failure",
  "message": "Validation failed",
  "data": [
    { "path": "slug", "message": "Must be URL-safe (letters, numbers, hyphens only)" }
  ]
}
```

---

## 4. Endpoint Preview

### POST /api/site/preview 🔒

Generate website preview. Server akan:

1. Ambil site config dari DB
2. Fetch data Store, Products (filtered), Orders stats
3. Panggil `web-gen/generate()` → build Astro
4. Output ke `web-gen/generated-sites/preview/{slug}/`
5. Dashboard bisa lihat hasil di `/s/{slug}/`

```typescript
// Request body — kosong (gunakan data yang sudah disimpan)
{}

// Response 200 — sukses
{
  "status": "success",
  "message": "preview generated",
  "data": {
    "success": true,
    "outputPath": "/abs/path/web-gen/generated-sites/preview/toko-ayu",
    "previewUrl": "/s/toko-ayu/"
  }
}

// Response 400 — site belum dikonfigurasi
{
  "status": "failure",
  "message": "Configure site first via PUT /api/site"
}

// Response 500 — build gagal
{
  "status": "failure",
  "message": "Build failed",
  "data": {
    "success": false,
    "error": "npm install failed: ..."
  }
}
```

**Timeout:** 120 detik (build Astro + install dependencies).

---

## 5. Endpoint Download

### GET /api/site/download 🔒

Download hasil preview terakhir sebagai file `.zip`.

```typescript
// Response 200 — stream file
// Content-Type: application/zip
// Content-Disposition: attachment; filename="toko-ayu.zip"

// Response 400 — preview belum di-generate
{
  "status": "failure",
  "message": "Generate preview first via POST /api/site/preview"
}
```

**Isi ZIP:**
```
toko-ayu.zip
└── toko-ayu/
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

### POST /api/site/publish 🔒

Generate dan publish website final. Beda dengan preview:

| Aspek | Preview | Publish |
|-------|---------|---------|
| Output | `preview/{slug}/` | `{slug}/` |
| Serve via Express | ✅ Ya | ❌ Tidak |
| Set `publishedAt` | ❌ Tidak | ✅ Ya |
| ZIP download | ✅ Dari sini | ❌ Dari folder publish |
| Dapat diakses publik | Tidak langsung | Via deploy manual |

```typescript
// Request body — kosong
{}

// Response 200
{
  "status": "success",
  "message": "site published",
  "data": {
    "success": true,
    "outputPath": "/abs/path/web-gen/generated-sites/toko-ayu",
    "publishedAt": "2026-06-22T10:30:00.000Z"
  }
}

// Response 400
{
  "status": "failure",
  "message": "Configure site first via PUT /api/site"
}
```

---

## 7. Static File Serving

Express menyajikan folder `preview/` sebagai static files untuk preview di iframe dashboard:

```typescript
// api/src/index.ts
app.use("/s", express.static(path.join(__dirname, "../../web-gen/generated-sites/preview")))
```

Dengan ini, preview bisa diakses di browser:

```
http://localhost:3001/s/toko-ayu/         → index.html
http://localhost:3001/s/toko-ayu/produk/  → produk/index.html
http://localhost:3001/s/toko-ayu/kontak/  → kontak/index.html
```

### Vite Proxy (Development)

```typescript
// dashboard/vite.config.ts
server: {
  proxy: {
    "/api": "http://localhost:3001",
    "/s":   "http://localhost:3001",    // forward ke Express static
  },
}
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
| `GET` | `/api/site` | — | ❌ Belum di-backend | Ambil config website |
| `PUT` | `/api/site` | 🔒 | ❌ Belum di-backend | Simpan config website |
| `POST` | `/api/site/preview` | 🔒 | ❌ Belum di-backend | Generate preview site |
| `GET` | `/api/site/download` | 🔒 | ❌ Belum di-backend | Download ZIP preview |
| `POST` | `/api/site/publish` | 🔒 | ❌ Belum di-backend | Publish site final |
| `GET` | `/s/{slug}/*` | — | ❌ Belum di-backend | Static file serving (preview) |

---

> **Catatan Implementasi**: Semua endpoint di atas perlu diimplementasikan di `api/` bersamaan
> dengan pembuatan model `WebSite`, migration database, dan integrasi dengan `web-gen/` package.
