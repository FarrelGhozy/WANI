# Performance Optimization — Tahap 2

> **Status:** 🟡 Partially complete (2026-07-03)
> - [x] Fix duplicate data fetching → **StoreContext + ProductsContext** ✅
> - [ ] Parallel CSS build — not started
> - [ ] Template caching — not started

---

## 1. Dashboard: Fix Duplicate Data Fetching

### Masalah Dual Polling `useWaStatus`

**File:** `dashboard/src/hooks/useWaStatus.ts`

Hook dipanggil di `Layout.tsx` DAN `Dashboard.tsx` → 2 interval timer jalan.

### Fix: Context-based Singleton

```typescript
// dashboard/src/contexts/WaStatusContext.tsx
const WaStatusContext = createContext<WaStatus | null>(null)

export function WaStatusProvider({ children }: { children: ReactNode }) {
  const status = useWaStatus()  // HANYA dipanggil di sini
  return (
    <WaStatusContext.Provider value={status}>
      {children}
    </WaStatusContext.Provider>
  )
}

export function useWaStatusContext() {
  const ctx = useContext(WaStatusContext)
  if (!ctx) throw new Error('useWaStatusContext must be used within WaStatusProvider')
  return ctx
}
```

### Masalah `useSettings` Dipanggil di Layout

**File:** `dashboard/src/components/Layout.tsx:12`

### Fix: Move ke Context

```typescript
// dashboard/src/contexts/SettingsContext.tsx
export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}
```

---

## 2. Web-Gen: Parallel CSS Build

### File: `web-gen/src/build-css.ts`

**Masalah:** 5 template CSS dibuild sequential. Masing-masing 60s timeout.

**Current:** ~5 menit total

### Fix:

```typescript
async function buildAllTemplates(): Promise<void> {
  const templateNames = Object.keys(SRC_MAP)

  const results = await Promise.allSettled(
    templateNames.map(async (name) => {
      console.log(`Building CSS for ${name}...`)
      await buildTemplate(name)
      console.log(`✓ ${name} done`)
    })
  )

  // Report failures
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`Template build failed:`, result.reason)
    }
  }
}
```

**Expected:** ~60 detik (worst-case template) instead of 5 menit.

---

## 3. Web-Gen: Astro Template Caching

### File: `web-gen/src/generator.ts`

**Masalah:** `bun install --silent` setiap `generateAstro()` dipanggil.

### Fix:

```typescript
const ASTRO_CACHE_DIR = join(os.tmpdir(), 'wani-astro-cache')

async function ensureAstroDeps(templateDir: string): Promise<string> {
  const hash = createHash('md5').update(templateDir).digest('hex')
  const cacheDir = join(ASTRO_CACHE_DIR, hash)

  if (existsSync(join(cacheDir, 'node_modules'))) {
    // Use cached node_modules
    const tmpDir = mkdtempSync(join(os.tmpdir(), 'wani-gen-'))
    copySync(cacheDir, tmpDir)
    return tmpDir
  }

  // Install + cache
  const tmpDir = mkdtempSync(join(os.tmpdir(), 'wani-gen-'))
  copySync(templateDir, tmpDir)
  spawnSync('bun', ['install', '--silent'], { cwd: tmpDir, timeout: 120_000 })

  // Cache untuk next time
  copySync(tmpDir, cacheDir)
  return tmpDir
}
```

---

## 4. API: Rate Limiter Cleanup Optimization

### File: `api/src/guardrails/ratelimit.ts`

**Current:** Setiap 5 menit iterasi semua entries untuk bersihin stale.

**Optimization:** Gunakan TTL-based Map (seperti `lru-cache` atau implementasi sendiri):

```typescript
class TTLCache<V> {
  private store = new Map<string, { value: V; expiresAt: number }>()

  set(key: string, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }
}
```

---

## 5. Dashboard: React Compiler Optimization

Dashboard sudah pakai React Compiler (via Babel plugin). Tapi pastikan:

### Cek komponen yang tidak ter-optimasi

```bash
cd dashboard
bun run build  # Akan menampilkan React Compiler warnings
```

### Fix Common Issues

1. **Mutable refs di render:** Pindahkan side effects ke `useEffect`
2. **Array/object literals di JSX:** Extract ke constant atau `useMemo`
3. **Conditional hook calls:** Restruktur komponen

---

## 6. API: Database Query Optimization

### Potensi N+1: Order Detail

**File:** `api/src/controllers/orders.ts` — `getOrder`

**Cek:** Apakah order items + payment di-fetch dalam satu query atau separate?

```typescript
// ✅ Pastikan pakai Prisma include
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    items: { include: { product: true } },
    payment: true,
    customer: true,
  },
})
```

### Tambah Index (jika belum ada)

```sql
-- Prisma migration
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order"("status");
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON "ActivityLog"("createdAt");
```

---

## 7. Bundle Size Audit — Dashboard

```bash
cd dashboard
bun run build
ls -lh dist/assets/*.js  # Cek ukuran bundle
```

### Target

| Aset | Target (gzip) |
|------|---------------|
| JS total | < 300KB |
| CSS total | < 50KB |
| LCP | < 2.5s |
| FCP | < 1.5s |

### Jika Over Budget

1. Lazy load routes: `React.lazy(() => import('./pages/Website'))`
2. Tree shake `lucide-react` (hanya 3 icon yang dipakai)
3. Optimalkan `qrcode.react` — bisa di-lazy load

---

## Performance Checklist

- [ ] Dashboard: Tidak ada duplicate polling
- [ ] Dashboard: Shared Context untuk data yang sering diakses
- [ ] Dashboard: Route-based code splitting (lazy)
- [ ] Dashboard: Bundle JS < 300KB gzip
- [ ] Web-Gen: Parallel CSS build
- [ ] Web-Gen: Astro template cached
- [ ] API: Rate limiter pakai TTL-based cleanup
- [ ] API: Query pakai Prisma include (no N+1)
- [ ] API: Database indexes untuk frequent queries
- [ ] Semua: React Compiler warnings resolved
