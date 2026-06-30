# Error Handling Improvements — Tahap 2

---

## Dashboard: Unified Error Toast System

### Masalah
Saat ini error handling di dashboard tidak konsisten. Beberapa hook throw error, beberapa catch dan ignore, beberapa set state error tapi tidak ditampilkan.

### Solusi: ErrorBoundary + Toast System

#### 1. Global Error Boundary

```typescript
// dashboard/src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mt-2">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

#### 2. Enhanced Toast System

```typescript
// dashboard/src/hooks/useToast.ts — enhanced
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

export function useToast() {
  // ... existing logic
  
  function apiError(err: unknown, fallback = 'Terjadi kesalahan') {
    const message = err instanceof Error ? err.message : fallback
    addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 6000,
      action: {
        label: 'Coba Lagi',
        onClick: () => window.location.reload(),
      },
    })
  }

  return { toasts, success, error: apiError, warning, info, dismiss }
}
```

#### 3. Hook-Level Error Handling Pattern

```typescript
// Standar pattern untuk semua hooks
export function useProducts() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { error: toastError } = useToast()

  async function fetchProducts() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchApi<Product[]>('/api/products')
      setProducts(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat produk'
      setError(msg)
      toastError(err)  // Juga tampilkan sebagai toast
    } finally {
      setLoading(false)
    }
  }

  // Return error state untuk ditampilkan di UI
  return { products, loading, error, refetch: fetchProducts }
}
```

---

## API: Consistent Error Response Format

### Audit Error yang Tidak Konsisten

Beberapa controller mungkin return error format yang berbeda. Semua harus pakai `sendResponse()`:

```typescript
// ❌ Tidak konsisten
res.status(500).json({ error: 'Something broke' })

// ✅ Konsisten
sendResponse(res, 500, 'Gagal memproses permintaan')
```

### Enrich Error Context

```typescript
// api/src/utils/errors.ts — tambahkan error code
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const detail = id ? `${resource} dengan ID ${id}` : resource
    super(404, `${detail} tidak ditemukan`)
  }
}

// Usage
throw new NotFoundError('Produk', productId)
// → { status: "failure", message: "Produk dengan ID xxx tidak ditemukan" }
```

---

## WA-Bot: Fix Silent Catch Blocks

### File: `wa-bot/src/index.ts`

**Masalah:** Error di `pollResetSignal` dan `pollOutgoing` di-silent.

```typescript
// ❌ Sebelum
async function pollOutgoing() {
  try {
    // ... fetch and send
  } catch (_err) {
    // only comment, no logging
  }
}

// ✅ Sesudah
async function pollOutgoing() {
  try {
    // ... fetch and send
  } catch (err) {
    logger.error({ err }, 'outgoing poll failed')
    // Exponential backoff for retry
    await sleep(Math.min(pollBackoff * 2, 30000))
  }
}
```

---

## Web-Gen: Error Handling di Generator

### Masalah

`generateHtml()` dan `generateAstro()` throw generic errors.

### Fix

```typescript
// web-gen/src/errors.ts (NEW)
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly template: string,
    public readonly cause?: Error
  ) {
    super(`[${template}] ${message}`)
    this.name = 'GenerationError'
  }
}

export class TemplateNotFoundError extends GenerationError {
  constructor(template: string) {
    super(`Template "${template}" tidak ditemukan`, template)
  }
}

export class BuildFailedError extends GenerationError {
  constructor(template: string, stderr: string) {
    super(`Build gagal: ${stderr.slice(0, 200)}`, template)
  }
}

// Usage di generator.ts
if (!existsSync(templatePath)) {
  throw new TemplateNotFoundError(template)
}
```

---

## Web-Gen: Path Resolution Fix

### File: `web-gen/src/generator.ts:371`

```typescript
// ❌ Sebelum — hardcoded relative path
const uploadsDir = join(dirname(TEMPLATES_DIR), "..", "api", "uploads")

// ✅ Sesudah — dari ENV atau parameter
const uploadsDir = process.env.UPLOADS_DIR
  ?? join(dirname(TEMPLATES_DIR), "..", "api", "uploads")
```

---

## Checklist Error Handling

- [ ] Dashboard: ErrorBoundary terpasang di App root
- [ ] Dashboard: Semua hooks punya error state + toast notification
- [ ] Dashboard: Skeleton loading di semua halaman
- [ ] API: Semua controller pakai `sendResponse()` konsisten
- [ ] API: Error codes jelas (resource name + ID)
- [ ] WA-Bot: Tidak ada silent catch blocks
- [ ] WA-Bot: Error logging dengan structured logger
- [ ] Web-Gen: Error classes hierarchical
- [ ] Web-Gen: Path resolution dari ENV
