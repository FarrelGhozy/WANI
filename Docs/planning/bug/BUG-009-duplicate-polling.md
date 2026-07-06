# BUG-009: Duplicate `useWaStatus` Polling

| Field | Value |
|-------|-------|
| **ID** | BUG-009 |
| **Severity** | 🟢 MEDIUM |
| **Modul** | dashboard |
| **File** | `dashboard/src/hooks/useWaStatus.ts` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Hook `useWaStatus` (yang melakukan polling setiap 5 detik ke `/api/qr` dan `/api/qr/status`) dipanggil di dua tempat:
1. `Layout.tsx` — untuk menampilkan status di sidebar + topbar
2. `Dashboard.tsx` — untuk menampilkan QR code + connection status card

Karena hooks tidak dishare via Context, dua instance `useWaStatus` jalan dengan polling timer masing-masing. Ini menghasilkan **2x API calls setiap 5 detik**.

## Kode Bermasalah

```typescript
// dashboard/src/components/Layout.tsx
export function Layout() {
  const { status } = useWaStatus()  // ← Instance 1, polling tiap 5s
  // ...
}

// dashboard/src/pages/Dashboard.tsx
export function Dashboard() {
  const { qr, status } = useWaStatus()  // ← Instance 2, polling lagi tiap 5s
  // ...
}
```

## Dampak

1. **Double API load** — 2 request ke `/api/qr` setiap 5 detik = 24 req/menit
2. **Unnecessary network traffic** — khususnya bermasalah di mobile/3G
3. **Wasteful** — kedua instance fetch data yang sama

## Cara Reproduksi

1. Buka dashboard → buka halaman Dashboard (home)
2. Buka Network tab di DevTools
3. Lihat request ke `/api/qr` dan `/api/qr/status` — muncul 2x setiap 5 detik
4. Navigasi ke halaman lain → hanya 1x (karena Dashboard unmount)

## Rekomendasi Fix

### Option A: Context Provider (Recommended)

```typescript
// dashboard/src/contexts/WaStatusContext.tsx
const WaStatusContext = createContext<ReturnType<typeof useWaStatus> | null>(null)

export function WaStatusProvider({ children }: { children: ReactNode }) {
  const status = useWaStatus()  // ← HANYA dipanggil di sini
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

// App.tsx — wrap dengan provider
<WaStatusProvider>
  <Layout />
</WaStatusProvider>

// Layout.tsx — pakai context
const { status } = useWaStatusContext()

// Dashboard.tsx — pakai context juga
const { qr, status } = useWaStatusContext()
```

### Option B: Pass as props (simpler)

```typescript
// Layout.tsx
const waStatus = useWaStatus()
// Pass ke Dashboard via Outlet context atau props
<Outlet context={{ waStatus }} />

// Dashboard.tsx
const { waStatus } = useOutletContext<{ waStatus: WaStatus }>()
```
