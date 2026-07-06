# BUG-007: `process.exit(0)` Race dengan Async `sock.logout()`

| Field | Value |
|-------|-------|
| **ID** | BUG-007 |
| **Severity** | 🔴 CRITICAL |
| **Modul** | wa-bot |
| **File** | `wa-bot/src/index.ts:138-139` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Saat menerima sinyal reset/disconnect, kode memanggil `sock.logout()` (operasi async) lalu langsung `process.exit(0)` tanpa menunggu logout selesai. Ini mencegah WhatsApp session di-invalidasi dengan benar di server, yang bisa menyebabkan session lama tetap valid dan mencegah koneksi baru.

## Kode Bermasalah

```typescript
// wa-bot/src/index.ts
async function pollResetSignal() {
  try {
    const res = await fetch(`${API_URL}/api/qr/status`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    })
    const data = await res.json()
    const status = data.data

    // Jika API minta disconnect (tidak ada phone, tidak ada QR)
    if (status?.status === 'disconnected' && !status?.phone && !status?.qr) {
      logger.info('reset signal diterima, logging out...')

      // ❌ BUG: logout() async, process.exit() langsung jalan!
      sock?.logout()
      process.exit(0)
      // ↑ logout() belum selesai saat process.exit() terpanggil
      // WhatsApp server tidak menerima logout request → session masih valid
    }
  } catch (_err) {
    // silent
  }
}
```

## Dampak

1. **Session tidak di-invalidate** — WhatsApp menganggap session masih connected
2. **Gagal reconnect** — saat bot restart, WhatsApp mungkin menolak koneksi baru karena session lama masih "active"
3. **QR scan gagal** — user tidak bisa scan QR baru karena session conflict
4. **Rate limiting** — multiple failed reconnects bisa memicu WhatsApp rate limit

## Cara Reproduksi

1. Dashboard → Settings → WA Session → Reset/Disconnect
2. API set status ke `disconnected`
3. wa-bot poll mendeteksi reset signal
4. `sock.logout()` dipanggil → async, belum selesai
5. `process.exit(0)` langsung dieksekusi → proses mati
6. WhatsApp server TIDAK menerima logout → session tetap "active"
7. Bot restart → gagal connect → harus hapus session manual dari DB

## Rekomendasi Fix

```typescript
async function pollResetSignal() {
  try {
    const res = await fetch(`${API_URL}/api/qr/status`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    })
    const data = await res.json()
    const status = data.data

    if (status?.status === 'disconnected' && !status?.phone && !status?.qr) {
      logger.info('reset signal diterima, logging out...')

      // ✅ Tunggu logout selesai
      try {
        await sock?.logout()
        logger.info('logout berhasil')
      } catch (err) {
        logger.error({ err }, 'logout gagal')
      }

      // ✅ Cleanup sebelum exit
      clearInterval(pollTimer)
      await prisma.$disconnect()
      sock?.end(undefined)

      logger.info('bot berhenti karena reset signal')
      process.exit(0)
    }
  } catch (err) {
    logger.error({ err }, 'pollResetSignal error')
  }
}
```
