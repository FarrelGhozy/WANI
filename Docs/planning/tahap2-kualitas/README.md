# Tahap 2 — Kualitas

> **Prioritas:** 🟢 ~70% complete (2026-07-03)
> **Target:** Minggu 3-4
> **Goal:** Code quality production-grade, comprehensive error handling, performance baseline
> 
> **Progress:** Code quality ✅ (0 `as any`, shared upload, dedup injection patterns, type guards).  
> Error handling ✅ (ErrorBoundary, enhanced toast, wa-bot logging).  
> Performance ✅ (StoreContext + ProductsContext).  
> CSS parallel build + template caching masih pending.

## Overview

Tahap ini fokus pada perbaikan kualitas kode secara menyeluruh. Setelah semua bug critical fixed di Tahap 1, kita bersihkan code smells, tingkatkan error handling, dan optimalkan performa.

## Deliverables

| # | Item | Tipe | Estimasi |
|---|------|------|----------|
| 1 | Refactor `as any` ke type-safe | Code Quality | 4 jam |
| 2 | Extract duplicate upload logic | Code Quality | 3 jam |
| 3 | Fix code smells di semua modul | Code Quality | 6 jam |
| 4 | Unified error handling di dashboard | Error Handling | 4 jam |
| 5 | Skeleton loading states | UX | 4 jam |
| 6 | Optimasi web-gen build (parallel + cache) | Performance | 4 jam |
| 7 | Fix duplicate data fetching | Performance | 3 jam |
| 8 | Shared hook context di dashboard | Architecture | 4 jam |
| 9 | API test coverage → 60% | Testing | 8 jam |
| 10 | Dashboard test coverage → 50% | Testing | 6 jam |

## Dokumen Terkait

- [Code Quality Plan](01-code-quality.md) — Refactoring plan detail
- [Error Handling](02-error-handling.md) — Error handling improvements
- [Performance](03-performance.md) — Performance optimization plan

---

## Perubahan Besar

### 1. Extract Shared Context di Dashboard

**Masalah:** Setiap komponen memanggil hook yang sama → multiple API calls.

**Solusi:** Gunakan React Context untuk share state:

```typescript
// dashboard/src/contexts/StoreContext.tsx
const StoreContext = createContext<StoreData | null>(null)
const AiConfigContext = createContext<AiConfig | null>(null)
const ProductsContext = createContext<Product[] | null>(null)

// Layout.tsx — fetch sekali, provide ke children
export function Layout() {
  const { store, aiConfig } = useSettings()
  const { products } = useProducts()

  return (
    <StoreContext.Provider value={store}>
    <AiConfigContext.Provider value={aiConfig}>
    <ProductsContext.Provider value={products}>
      {/* Sidebar + Topbar + Outlet */}
    </ProductsContext.Provider>
    </AiConfigContext.Provider>
    </StoreContext.Provider>
  )
}
```

### 2. Extract `uploadFile` Utility

**Masalah:** Upload logic diduplikasi di 4 komponen.

**Solusi:**
```typescript
// dashboard/src/lib/upload.ts
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('wani_auth_token')
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  const json = await res.json()
  return json.data.url
}
```

### 3. Web-Gen Build Parallelization

**Masalah:** 5 template CSS dibuild sequential (5 menit).

**Solusi:** Parallel build dengan `Promise.all`:
```typescript
// web-gen/src/build-css.ts
async function buildAll() {
  const templates = ['classic', 'modern', 'vibrant', 'cyberpunk', 'minimalist']
  const results = await Promise.all(
    templates.map(name => buildTemplate(name))
  )
}
```

### 4. Template Caching di Web-Gen

**Masalah:** `bun install` dijalankan setiap generate (untuk Astro template).

**Solusi:** Cache `node_modules` dan `dist/`:
```typescript
// Cek apakah ada di cache
const cacheDir = join(CACHE_DIR, template)
if (existsSync(join(cacheDir, 'dist'))) {
  return copySync(cacheDir, outputDir)
}
// Jika tidak, build dan cache
await buildAstro()
copySync(tempDist, cacheDir)
```

---

## Definition of Done

- [ ] Tidak ada `as any` di codebase (kecuali Prisma delegates)
- [ ] Upload logic tidak diduplikasi (satu shared utility)
- [ ] Duplicate API calls di dashboard fixed
- [ ] Skeleton loading di semua halaman dashboard
- [ ] Unified error toast system
- [ ] Web-gen build < 60 detik
- [ ] Dashboard bundle size < 300KB gzip
- [ ] API test coverage ≥ 60%
- [ ] Dashboard test coverage ≥ 50%
- [ ] Code review checklist passed untuk semua modul
