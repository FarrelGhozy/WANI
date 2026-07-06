# BUG-010: Hardcoded Path `../../api/uploads/` di Web-Gen

| Field | Value |
|-------|-------|
| **ID** | BUG-010 |
| **Severity** | 🟢 MEDIUM |
| **Modul** | web-gen |
| **File** | `web-gen/src/generator.ts:371` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Fungsi `copyAssetImages` di web-gen menggunakan hardcoded relative path ke `../../api/uploads/`. Path ini hanya valid jika struktur direktori persis seperti development (web-gen/ dan api/ bersebelahan). Ini akan break jika:
- Web-gen di-install sebagai package
- Struktur direktori berubah
- Running di Docker (beda filesystem layout)

## Kode Bermasalah

```typescript
// web-gen/src/generator.ts
function copyAssetImages(templatePath: string, outputDir: string): void {
  // ❌ Hardcoded relative path — fragile!
  const uploadsDir = join(dirname(TEMPLATES_DIR), '..', 'api', 'uploads')

  if (!existsSync(uploadsDir)) {
    logger.warn(`Uploads directory not found: ${uploadsDir}`)
    return
  }

  // Copy image files referenced in template
  // ...
}
```

## Dampak

1. **Generate gagal di Docker** — filesystem layout berbeda
2. **Missing images** — gambar produk tidak muncul di generated website
3. **Hard to debug** — error tidak jelas (silent warning)

## Cara Reproduksi

1. Jalankan web-gen dari lokasi yang berbeda (bukan dari monorepo root)
2. Atau jalankan di Docker container (API dan web-gen di container berbeda)
3. Generate website → gambar dari `/uploads/` tidak ikut tercopy

## Rekomendasi Fix

```typescript
// ✅ Pakai environment variable atau parameter
function copyAssetImages(templatePath: string, outputDir: string): void {
  const uploadsDir = process.env.UPLOADS_DIR
    ?? process.env.WANI_UPLOADS_DIR
    ?? join(dirname(TEMPLATES_DIR), '..', 'api', 'uploads')  // Fallback

  if (!existsSync(uploadsDir)) {
    logger.warn(`Uploads directory not found: ${uploadsDir}`)
    return
  }

  // ...
}
```

Atau — lebih baik — uploads path di-pass sebagai parameter dari API:

```typescript
// api/src/controllers/website.ts
const result = await generate({
  ...params,
  uploadsDir: join(process.cwd(), 'uploads'),  // Explicit path
})
```
