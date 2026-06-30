# Code Quality Improvements — Tahap 2

> Rencana refactoring untuk membersihkan code smells

---

## `as any` Cleanup — API

### Lokasi yang Perlu Dibersihkan

| File | Line | Current | Fix |
|------|------|---------|-----|
| `controllers/store-payment.ts` | 31-37 | `const data: any = { ... }` | Gunakan Prisma input type |
| `controllers/website.ts` | beberapa | Cast data objects | Gunakan typed interfaces |
| `controllers/products.ts` | create/update | `req.body as any` | Gunakan Zod validated body |
| `models/base.ts` | berbagai | Prisma delegate casting | Gunakan proper generic constraint |

### Pattern Fix

```typescript
// ❌ Sebelum
const data: any = {
  storeId: "default",
  type: req.body.type,
  label: req.body.label,
  ...req.body,
}
const result = await model.create(data)

// ✅ Sesudah
import type { Prisma } from "@db/index"
const data: Prisma.StorePaymentMethodCreateInput = {
  store: { connect: { id: "default" } },
  type: req.body.type,
  label: req.body.label,
  accountName: req.body.accountName ?? null,
  accountNumber: req.body.accountNumber ?? null,
  // ... explicit fields
}
const result = await model.create(data)
```

---

## Duplicate Upload Logic — Dashboard

### Lokasi Duplikasi

1. `components/ui/ImageUpload.tsx:124-145`
2. `pages/ProductForm.tsx:124-145`
3. `components/StoreTab.tsx:272-293`
4. `components/PaymentTab.tsx:121-144`

### Pattern Fix — Extract ke Shared Utility

```typescript
// dashboard/src/lib/upload.ts
interface UploadResult {
  url: string
  filename: string
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const token = localStorage.getItem('wani_auth_token')
  if (!token) throw new Error('Not authenticated')

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Upload failed')
  }

  const json = await res.json()
  return { url: json.data.url, filename: json.data.filename }
}
```

---

## Duplicate Injection Patterns — API

### Masalah

Pattern regex injection muncul di dua tempat:
- `guardrails/input.ts` — 16 patterns
- `guardrails/firewall/injection.ts` — expanded patterns

### Fix — Single Source of Truth

```typescript
// guardrails/injection-patterns.ts (NEW)
export const INJECTION_PATTERNS = {
  delimiter_escape: /.../,
  instruction_override: /.../,
  // ... all patterns here
}

// guardrails/input.ts
import { INJECTION_PATTERNS } from './injection-patterns'

// guardrails/firewall/injection.ts
import { INJECTION_PATTERNS } from '../injection-patterns'
```

---

## Model Name Mismatch — API

### Masalah

- `env.ts` default: `deepseek-v4-flash-free`
- `AiConfig` model default: `opencode/deepseek-v4-flash-free`
- `.env`: `opencode/deepseek-v4-flash-free`

### Fix

```typescript
// api/src/config/env.ts
export const env = {
  ai: {
    defaultModel: "opencode/deepseek-v4-flash-free",  // Konsisten
    // ...
  }
}
```

---

## Non-Null Assertions — API

### Masalah

`req.validatedQuery!` dan `req.validatedParams!` digunakan extensively meskipun `noUncheckedIndexedAccess` enabled.

### Pattern Fix

```typescript
// ❌ Sebelum
const page = parseInt(req.validatedQuery!.page ?? '1')

// ✅ Sesudah — guard dulu
const query = req.validatedQuery
if (!query) throw new InternalServerError('Validation middleware missing')
const page = parseInt(String(query.page ?? '1'))
```

Atau — tambahkan type guard utility:
```typescript
// api/src/utils/request.ts
export function getValidatedQuery<T>(req: Request): T {
  if (!req.validatedQuery) {
    throw new InternalServerError('Query not validated')
  }
  return req.validatedQuery
}
```

---

## Code Smell: Context Overflow di messageBuilder

### File: `api/src/ai/pipeline/steps/messageBuilder.ts`

**Masalah:** Customer message sekarang diexclude dari history via filter hacky.

**Fix:** Gunakan explicit message ID atau timestamp cutoff, bukan content matching.

```typescript
// ✅ Lebih reliable
const historyMessages = conversation.messages
  .filter(m => m.id !== ctx.currentMessageId)  // Exclude by ID, not content
  .slice(-20)
```

---

## Code Smell: `_htmlPath` Unused Parameter

### File: `web-gen/src/generator.ts:46`

**Fix:** Hapus parameter jika tidak digunakan, atau gunakan sebagai fallback.

---

## Code Smell: `MarkDelivered` hack

### File: `api/src/controllers/outgoing.ts`

**Masalah:** `waMsgId` diset ke `sent-${id}` — bisa collision.

**Fix:** Gunakan UUID atau timestamp-based ID:
```typescript
const waMsgId = `sent-${id}-${Date.now()}`
```

---

## Checklist Code Quality

- [ ] Semua `as any` diganti type-safe alternatives
- [ ] Duplicate upload logic diextract ke `lib/upload.ts`
- [ ] Duplicate injection patterns di-merge ke single source
- [ ] Model name mismatch resolved
- [ ] Non-null assertions guarded dengan proper check
- [ ] Unused parameters removed
- [ ] Hacky IDs diganti proper unique IDs
- [ ] Semua file ≤ 800 lines (cek: `find . -name "*.ts" -exec wc -l {} + | sort -rn | head -20`)
- [ ] Semua fungsi ≤ 50 lines (cek: manual review)
- [ ] Tidak ada nested logic > 4 level
