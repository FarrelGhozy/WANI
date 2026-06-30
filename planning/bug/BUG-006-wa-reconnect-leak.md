# BUG-006: Recursive Reconnect Tanpa Guard — Memory & Listener Leak

| Field | Value |
|-------|-------|
| **ID** | BUG-006 |
| **Severity** | 🟡 HIGH |
| **Modul** | wa-bot |
| **File** | `wa-bot/src/index.ts:77` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Fungsi `main()` dipanggil secara rekursif di dalam connection callback tanpa await, debounce, atau retry cap. Jika koneksi repeatedly close (network instability), ini menyebabkan:
1. Multiple `main()` call stacks berjalan bersamaan
2. Listener dan timer leak (setiap `main()` membuat event handler + interval baru)
3. Memory usage meningkat tanpa batas

## Kode Bermasalah

```typescript
// wa-bot/src/index.ts
sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update

  if (connection === 'open') {
    // ... handle open
  }

  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
    const loggedOut = statusCode === 401

    if (!loggedOut) {
      logger.info('reconnecting...')
      if (pollTimer) clearInterval(pollTimer)
      sock?.end(undefined)

      // ❌ BUG: Rekursif tanpa await, debounce, atau retry cap
      main()
      // ↑ Ini fire-and-forget promise!
      // Multiple main() bisa jalan bersamaan
    }
  }
})
```

## Dampak

1. **Memory leak** — event listener menumpuk tiap reconnect
2. **Multiple polling timers** — `pollOutgoing` dan `pollResetSignal` jalan paralel
3. **CPU spike** — banyak timer dan listener bersaing
4. **Unpredictable behavior** — multiple socket instances mungkin conflict

## Cara Reproduksi

1. Jalankan wa-bot dengan API tidak available
2. Connection close → reconnect → API masih down → close lagi
3. Loop ini terpicu berkali-kali tanpa backoff
4. Monitor memory usage — terus naik

## Rekomendasi Fix

```typescript
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_BASE_DELAY = 1000  // 1 detik
const RECONNECT_MAX_DELAY = 30000  // 30 detik

let reconnectAttempt = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let isReconnecting = false

sock.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect } = update

  if (connection === 'open') {
    reconnectAttempt = 0
    isReconnecting = false
    // ... handle open
  }

  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
    const loggedOut = statusCode === 401

    if (!loggedOut && !isReconnecting) {
      isReconnecting = true

      if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
        logger.error('Max reconnect attempts reached, exiting...')
        process.exit(1)
      }

      // ✅ Exponential backoff
      const delay = Math.min(
        RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempt),
        RECONNECT_MAX_DELAY
      )
      reconnectAttempt++

      logger.info({ attempt: reconnectAttempt, delay }, 'reconnecting...')

      // Cleanup existing resources
      if (pollTimer) clearInterval(pollTimer)
      sock?.removeAllListeners()  // Clean up old listeners
      sock?.end(undefined)

      // ✅ Pakai setTimeout dengan delay, bukan rekursif langsung
      reconnectTimer = setTimeout(() => {
        main().finally(() => {
          isReconnecting = false
        })
      }, delay)
    }
  }
})
```
