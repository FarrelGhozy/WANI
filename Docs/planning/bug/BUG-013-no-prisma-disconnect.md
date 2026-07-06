# BUG-013: Tidak Ada Prisma Disconnect di Shutdown

| Field | Value |
|-------|-------|
| **ID** | BUG-013 |
| **Severity** | 🔵 LOW |
| **Modul** | wa-bot |
| **File** | `wa-bot/src/index.ts` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Saat wa-bot menerima sinyal graceful shutdown (SIGINT/SIGTERM), handler membersihkan poll timer dan memanggil `process.exit(0)`, tapi **tidak pernah memanggil `prisma.$disconnect()`**. Ini bisa menyebabkan:
- Database connections lingering
- Connection pool tidak dibersihkan
- PostgreSQL idle connections menumpuk

## Kode Bermasalah

```typescript
// wa-bot/src/index.ts
let cleanupRegistered = false

process.once('SIGINT', () => {
  logger.info('SIGINT diterima, shutting down...')
  if (pollTimer) clearInterval(pollTimer)
  // ❌ Tidak ada prisma.$disconnect()
  process.exit(0)
})

process.once('SIGTERM', () => {
  logger.info('SIGTERM diterima, shutting down...')
  if (pollTimer) clearInterval(pollTimer)
  // ❌ Tidak ada prisma.$disconnect()
  process.exit(0)
})
```

## Dampak

1. **Database connection leak** — koneksi tidak ditutup dengan bersih
2. **PostgreSQL idle connections** — bisa mencapai max_connections limit
3. **Slow shutdown** — PostgreSQL menunggu timeout untuk membuang idle connections
4. **Log spam** — PostgreSQL log "unexpected EOF on client connection"

## Cara Reproduksi

1. Jalankan wa-bot
2. Kirim SIGTERM (`kill <pid>` atau Ctrl+C)
3. Cek PostgreSQL connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'wa_bot';
   ```
4. Connection masih ada meskipun proses sudah mati (sampai timeout)

## Rekomendasi Fix

```typescript
import { prisma } from './config/db'

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'shutting down...')

  // 1. Stop polling
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }

  // 2. Logout WhatsApp (jika belum)
  try {
    await sock?.logout()
    logger.info('whatsapp logged out')
  } catch (err) {
    logger.warn({ err }, 'logout failed (may already be disconnected)')
  }

  // 3. Close socket
  sock?.end(undefined)

  // 4. Disconnect database
  try {
    await prisma.$disconnect()
    logger.info('database disconnected')
  } catch (err) {
    logger.error({ err }, 'database disconnect failed')
  }

  // 5. Exit
  logger.info('shutdown complete')
  process.exit(0)
}

// ✅ Gunakan di semua handler
process.once('SIGINT', () => gracefulShutdown('SIGINT'))
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))
```

## Catatan

Pattern yang sama juga harus dicek di `api/src/index.ts` — pastikan API server juga punya Prisma disconnect di graceful shutdown handler.
