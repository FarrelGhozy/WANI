# BUG-012: HTML Unescaped di Template Engine — XSS Risk

| Field | Value |
|-------|-------|
| **ID** | BUG-012 |
| **Severity** | 🔵 LOW |
| **Modul** | web-gen |
| **File** | `web-gen/src/generator.ts:124` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Template engine di `web-gen/src/generator.ts` tidak meng-escape HTML entities saat mensubstitusi variable. Jika product name atau description mengandung karakter HTML (misalnya `<script>alert('xss')</script>`), itu akan di-inject langsung ke HTML output.

Meskipun risk rendah karena:
- Data produk diinput oleh store owner (tepercaya)
- Generated website adalah static HTML (tidak ada dynamic content)

Ini tetap merupakan bad practice dan bisa menjadi celah jika nanti ada fitur user-generated content.

## Kode Bermasalah

```typescript
// web-gen/src/generator.ts
function renderItem(item: Record<string, unknown>): string {
  const template = `
    <div class="product-card">
      <h3>${item.name ?? ''}</h3>
      <p>${item.description ?? ''}</p>
      <span>${formatPrice(Number(item.price ?? 0))}</span>
    </div>
  `
  return template
}

function renderTemplate(template: string, data: Record<string, unknown>): string {
  // Simple {{variable}} replacement
  return template.replace(/{{([a-zA-Z.]+)}}/g, (_, key) => {
    const value = getNestedValue(data, key)
    // ❌ BUG: Tidak ada HTML escaping!
    return String(value ?? '')
    // Jika value = "<script>alert('xss')</script>"
    // Maka output = "<script>alert('xss')</script>"
  })
}
```

## Dampak

1. **Stored XSS** — jika store owner iseng input `<script>` di product name
2. **HTML injection** — markup rusak jika data mengandung `<`, `>`, `&`
3. **Generated website invalid HTML** — karakter khusus tidak di-escape

## Cara Reproduksi

1. Dashboard → Products → New Product
2. Name: `<script>alert('XSS')</script>`
3. Description: `<img src=x onerror=alert('XSS')>`
4. Website → Generate
5. Buka generated website → script tereksekusi

## Rekomendasi Fix

```typescript
// ✅ Tambahkan HTML escape utility
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ✅ Gunakan di template rendering
function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/{{([a-zA-Z.]+)}}/g, (_, key) => {
    const value = getNestedValue(data, key)
    return escapeHtml(String(value ?? ''))  // ← Selalu escape
  })
}

// ✅ Untuk data yang memang boleh HTML (misal: knowledge base content),
// gunakan triple bracket {{{content}}} sebagai raw marker
function renderTemplate(template: string, data: Record<string, unknown>): string {
  // Raw HTML (tidak di-escape)
  template = template.replace(/{{{([a-zA-Z.]+)}}}/g, (_, key) => {
    const value = getNestedValue(data, key)
    return String(value ?? '')  // No escaping — trusted content only
  })

  // Escaped HTML (default)
  template = template.replace(/{{([a-zA-Z.]+)}}/g, (_, key) => {
    const value = getNestedValue(data, key)
    return escapeHtml(String(value ?? ''))
  })

  return template
}
```

## Catatan

Web-gen saat ini tidak punya use case untuk raw HTML injection. Semua variable sebaiknya di-escape. Jika nanti butuh rich content (misal product description dengan formatting), bisa tambahkan markdown rendering.
