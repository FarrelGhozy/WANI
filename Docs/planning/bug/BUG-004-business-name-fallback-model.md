# BUG-004: `businessName` Fallback ke Nama Model LLM, Bukan Nama Toko

| Field | Value |
|-------|-------|
| **ID** | BUG-004 |
| **Severity** | 🟡 HIGH |
| **Modul** | api |
| **File** | `api/src/ai/pipeline/steps/contextLoader.ts:40` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Di step `contextLoader`, ketika `store.businessName` undefined, code fallback ke `env.ai.defaultModel` (nama model LLM, misalnya `"opencode/deepseek-v4-flash-free"`) bukan ke nama toko yang masuk akal.

Akibatnya AI chatbot akan menyapa customer dengan nama model LLM sebagai nama toko.

## Kode Bermasalah

```typescript
// api/src/ai/pipeline/steps/contextLoader.ts
export async function contextLoaderStep(ctx: PipelineContext): Promise<StepOutcome> {
  const store = await StoreModel.getById('default')
  const products = await ProductModel.getAllAvailable()
  const aiConfig = await AiConfigModel.getById('default')

  if (!aiConfig?.isActive) {
    return { kind: 'break', reply: aiConfig?.greetingMessage ?? 'Bot sedang tidak aktif' }
  }

  ctx.storeContext = {
    // ❌ BUG: Fallback ke nama model LLM!
    businessName: store?.businessName || env.ai.defaultModel,
    //                                      ^^^^^^^^^^^^^^
    // "opencode/deepseek-v4-flash-free" — ini nama model, bukan nama toko!
    phone: store?.phone ?? '',
    address: store?.address ?? '',
    // ...
  }

  return { kind: 'continue' }
}
```

## Dampak

1. Chatbot menyapa dengan nama model LLM, misalnya: *"Selamat datang di opencode/deepseek-v4-flash-free! Ada yang bisa kami bantu?"*
2. Customer bingung dengan nama toko yang aneh
3. Sistem prompt AI mengandung informasi yang salah

## Cara Reproduksi

1. Setup API tanpa mengisi `Store.businessName` (null/undefined)
2. Kirim chat via WA: "Halo"
3. Lihat reply bot — akan menyebut nama model LLM sebagai nama toko

## Rekomendasi Fix

```typescript
ctx.storeContext = {
  // ✅ Fallback ke string yang masuk akal
  businessName: store?.businessName || 'Toko Kami',
  phone: store?.phone ?? '',
  address: store?.address ?? '',
  // ...
}
```

Atau lebih baik, validasi saat startup/upsert store:

```typescript
// api/src/controllers/store.ts
export async function upsertStore(req: Request, res: Response) {
  if (!req.body.businessName || req.body.businessName.trim() === '') {
    throw new BadRequestError('Nama toko wajib diisi')
  }
  // ...
}
```
