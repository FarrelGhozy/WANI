# API-08 — WA Session Management Endpoints

## Deskripsi
Buat dan polish endpoint untuk mengelola koneksi WhatsApp via Baileys. Dashboard akan pake endpoint ini untuk nampilin QR code, status koneksi, dan kontrol connect/disconnect.

## Task Checklist

### 1. Service: `apps/api/src/services/wa-session.service.ts`
- [ ] `getSessionStatus(merchantId)` — status koneksi terkini
- [ ] `initiateConnection(merchantId)` — mulai koneksi, return QR code
- [ ] `getQRCode(merchantId)` — QR code terbaru (base64)
- [ ] `disconnectSession(merchantId)` — disconnect
- [ ] `getSessionHistory(merchantId)` — log koneksi

### 2. Routes: `apps/api/src/routes/wa-session.routes.ts`
```typescript
GET    /api/wa-session/:merchantId/status     → status + nomor WA
POST   /api/wa-session/:merchantId/connect    → initiate / return QR
GET    /api/wa-session/:merchantId/qr         → QR code (base64 image)
POST   /api/wa-session/:merchantId/disconnect → disconnect
GET    /api/wa-session/:merchantId/history    → connection log
```

### 3. Response format
```typescript
// GET /status
{
  success: true,
  data: {
    status: 'connected' | 'connecting' | 'disconnected' | 'expired',
    phone: '6281234567890',        // nomor WA terhubung
    connectedSince: '2025-03-12T10:00:00Z',
    lastDisconnected: null,
    retryCount: 0,
  }
}

// GET /qr
{
  success: true,
  data: {
    qrCode: 'data:image/png;base64,...',
    expiresIn: 45,   // detik
    refreshedAt: '...',
  }
}
```

### 4. Integration dengan Baileys
- [ ] Panggil `BaileysManager.getInstance(merchantId).doConnect()` di endpoint connect
- [ ] Ambil QR dari `WaSession.qrCode` field
- [ ] Listen `connection.update` event untuk update status real-time
- [ ] Pastikan singleton BaileysManager handle multi-merchant (current code single)

### 5. Error handling
- [ ] Kalo WA session expired → return status + QR baru
- [ ] Kalo connect gagal → return error message + retry count
- [ ] Kalo mencoba connect padahal already connected → return 409

## Verification
- [ ] Endpoint status return current connection state
- [ ] QR code muncul setelah initiate connection
- [ ] QR refresh otomatis setelah expired
- [ ] Disconnect menghentikan koneksi

## Labels
`api`, `whatsapp`, `baileys`, 🟡 medium

## Dependencies
FND-02

## Estimasi
1-2 hari
