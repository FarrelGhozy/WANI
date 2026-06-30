# Multi-Store Support — Tahap 3

> Dari single-store ke multi-store architecture

---

## Current State

Semua tabel utama pakai single-row pattern (`id: "default"`):
- `Store` — id default
- `AiConfig` — id default
- `WebSite` — id default
- `WaSession` — id default

## Target State

Satu user bisa manage multiple store. Tiap store punya:
- Profil toko sendiri (nama, alamat, logo)
- AI config sendiri (system prompt, model)
- Katalog produk sendiri
- Website sendiri
- WA session sendiri (1 nomor per toko)

---

## 1. Schema Migration

### Store — dari single-row ke multi-row

```prisma
// Sebelum
model Store {
  id String @id @default("default")
  // ...
}

// Sesudah
model Store {
  id        String @id @default(uuid())
  ownerId   String  // FK ke User
  owner     User @relation(fields: [ownerId], references: [id])
  name      String  // Nama toko (untuk display di UI)
  slug      String  @unique  // URL-friendly identifier
  // ... existing fields
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
}

// User sekarang bisa punya banyak Store
model User {
  // ... existing fields
  stores Store[]
}
```

### AiConfig — per Store

```prisma
model AiConfig {
  id      String @id @default(uuid())
  storeId String @unique  // FK ke Store
  store   Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  // ... existing AI fields
}
```

### WebSite — per Store

```prisma
model WebSite {
  id      String @id @default(uuid())
  storeId String @unique
  store   Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  // ... existing fields
}
```

### WaSession — per Store

```prisma
model WaSession {
  id      String @id @default(uuid())
  storeId String @unique
  store   Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  // ... existing fields
}
```

### Product — sudah per-store via relations

Product sudah terhubung via Category → Store, jadi tidak perlu diubah.

---

## 2. API Changes

### Store-scoped middleware

```typescript
// api/src/middleware/store.ts
export function requireStore(req: Request, res: Response, next: NextFunction) {
  const storeId = req.headers['x-store-id'] as string
  if (!storeId) {
    throw new BadRequestError('X-Store-ID header required')
  }
  req.storeId = storeId
  next()
}
```

### Updated Routes

Semua endpoint yang sekarang pakai hardcoded `id: "default"` harus pakai `storeId` dari middleware:

```typescript
// Sebelum
const store = await StoreModel.getById("default")

// Sesudah
const store = await StoreModel.getById(req.storeId!)
```

### Store Management Endpoints (baru)

```typescript
// POST /api/stores — buat toko baru
// GET /api/stores — list toko user
// GET /api/stores/:id — detail toko
// PUT /api/stores/:id — update toko
// DELETE /api/stores/:id — hapus toko
```

---

## 3. Dashboard Changes

### Store Switcher

```typescript
// dashboard/src/components/StoreSwitcher.tsx
export function StoreSwitcher() {
  const { stores, activeStore, setActiveStore } = useStoreContext()

  return (
    <Select
      value={activeStore?.id}
      onChange={(id) => setActiveStore(id)}
      options={stores.map(s => ({ value: s.id, label: s.name }))}
    />
  )
}
```

### Store-scoped API calls

```typescript
// dashboard/src/lib/api.ts — update fetchApi
export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('wani_auth_token')
  const storeId = localStorage.getItem('wani_active_store')

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  if (storeId) {
    headers['X-Store-ID'] = storeId
  }

  const res = await fetch(path, { ...options, headers })
  const json = await res.json()

  if (json.status === 'failure') {
    throw new Error(json.message)
  }
  return json.data as T
}
```

### Onboarding Flow

```
1. User register → auto-create store pertama
2. User bisa tambah store baru (Settings → Store → + Toko Baru)
3. Store switcher di sidebar
4. Semua data otomatis ter-filter per store aktif
```

---

## 4. WA-Bot Changes

WA-Bot saat ini single-session. Untuk multi-store:

### Option A: Multiple Bot Instances

Jalankan multiple instance wa-bot — satu per store.

```yaml
# docker-compose.yml — multiple wa-bot instances
wa-bot-store1:
  environment:
    STORE_ID: store1-uuid
    # ...

wa-bot-store2:
  environment:
    STORE_ID: store2-uuid
    # ...
```

### Option B: Multi-Session in Single Process

Baileys support multiple sessions:

```typescript
// wa-bot/src/index.ts — revised
const sessions = new Map<string, WASocket>()

async function startSession(storeId: string) {
  const sock = makeWASocket({
    auth: await usePrismaAuthState(storeId),  // store-scoped auth
    // ...
  })
  sessions.set(storeId, sock)
}

// Start session untuk semua active store
const stores = await fetchActiveStores()
for (const store of stores) {
  await startSession(store.id)
}
```

---

## 5. Migration Strategy

### Tahapan

1. **Non-destructive schema update** — tambah `storeId` column dengan default
2. **Data migration** — copy existing data ke store default
3. **Code update** — ganti semua hardcoded `"default"` dengan dynamic storeId
4. **Test** — semua test harus passing dengan multi-store
5. **UI update** — store switcher + onboarding

### Backward Compatibility

```typescript
// Fallback ke store default jika X-Store-ID tidak ada
const storeId = req.headers['x-store-id'] as string || 'default'
```

---

## Checklist Multi-Store

- [ ] Schema migration selesai (Store, AiConfig, WebSite, WaSession per-store)
- [ ] Data migration dari single-row ke multi-row
- [ ] Store-scoped middleware
- [ ] Store management CRUD endpoints
- [ ] Dashboard store switcher
- [ ] Store-scoped API calls di dashboard
- [ ] WA-bot multi-session support
- [ ] Onboarding flow untuk toko baru
- [ ] Backward compatibility untuk existing clients
- [ ] Unit tests untuk store-scoped queries
- [ ] Integration tests untuk multi-store flows
