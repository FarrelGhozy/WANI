# BUG-002: `convLoading` selalu `false` — Loading Spinner Conversation Tidak Pernah Tampil

| Field | Value |
|-------|-------|
| **ID** | BUG-002 |
| **Severity** | 🟡 HIGH |
| **Modul** | dashboard |
| **File** | `dashboard/src/hooks/useCustomers.ts:14` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

State `convLoading` di hook `useCustomers` diinisialisasi dengan `false` dan **tidak pernah di-update** (`setConvLoading` tidak pernah dipanggil). Akibatnya loading spinner untuk conversation tidak pernah tampil meskipun data sedang di-fetch.

## Kode Bermasalah

```typescript
// dashboard/src/hooks/useCustomers.ts
export function useCustomers() {
  // ... state lainnya

  // ❌ BUG: convLoading selalu false, setConvLoading tidak ada
  const [convLoading] = useState(false)
  //     ^^^^^^^^^^ Missing setConvLoading!

  // ... fetchCustomer, sendMessage, dll

  return {
    // ...
    convLoading,  // ← Selalu false!
  }
}
```

## Dampak

1. User tidak mendapat feedback visual saat conversation sedang di-load
2. UX buruk: panel chat kosong tanpa loading indicator
3. `sending={convLoading}` di `ChatView.tsx` selalu false → tombol kirim tidak menunjukkan loading state

## Cara Reproduksi

1. Buka dashboard → Customers
2. Klik salah satu customer
3. Panel chat muncul — seharusnya ada spinner saat loading conversation
4. **Actual:** Tidak ada spinner sama sekali
5. **Expected:** Spinner muncul saat conversation di-fetch dari API

## Rekomendasi Fix

```typescript
export function useCustomers() {
  // ✅ Tambahkan setConvLoading
  const [convLoading, setConvLoading] = useState(false)

  async function fetchConversation(customerId: string) {
    if (cancelled) return
    setConvLoading(true)  // ← Set loading true
    try {
      const [customer, conversations] = await Promise.all([
        fetchApi<Customer>(`/api/customers/${customerId}`),
        fetchApi<Conversation[]>(`/api/conversations/${customerId}`),
      ])
      if (!cancelled) {
        setSelectedCustomer(customer)
        setMessages(conversations)
      }
    } catch (err) {
      // error handling
    } finally {
      if (!cancelled) setConvLoading(false)  // ← Set loading false
    }
  }

  return {
    // ...
    convLoading,
  }
}
```

## Related
- [[BUG-009]] — Duplicate polling issue (mirip pattern kurang cleanup)
