# BUG-005: Stock Tidak Direstor Saat Order Dicancel

| Field | Value |
|-------|-------|
| **ID** | BUG-005 |
| **Severity** | 🟡 HIGH |
| **Modul** | api |
| **File** | `api/src/controllers/orders.ts` |
| **Status** | OPEN |
| **Ditemukan** | 2026-07-01 |

## Deskripsi

Ketika order status berubah dari `CONFIRMED` atau `PROCESSING` ke `CANCELLED`, stok produk yang sudah di-release (`stockReleased: true`) tidak dikembalikan. Akibatnya stok produk berkurang permanen meskipun order dibatalkan.

## Kode Bermasalah

```typescript
// api/src/controllers/orders.ts — updateOrderStatus
export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body

  const order = await OrderModel.getById(id)
  if (!order) throw new NotFoundError('Pesanan', id)

  // Validasi transisi status
  const validTransition = statusFlow[order.status]?.includes(status)
  if (!validTransition) {
    throw new BadRequestError(`Tidak bisa mengubah status dari ${order.status} ke ${status}`)
  }

  // Update status
  await OrderModel.update(id, { status })

  // ❌ BUG: Tidak ada stock restoration saat cancel!
  // Jika order.status sebelumnya CONFIRMED/PROCESSING dan stockReleased = true,
  // stok harus dikembalikan ke produk.

  return sendResponse(res, 200, 'Status pesanan diperbarui')
}
```

## Dampak

1. **Stok tidak akurat** — produk kehilangan stok yang seharusnya kembali
2. **Revenue loss** — produk yang sebenarnya available jadi kelihatan out of stock
3. **Data integrity issue** — `stockReleased` flag true tapi order cancelled

## Cara Reproduksi

1. Buat order baru (stok produk: 10)
2. Order dikonfirmasi → `stockReleased: true`, stok produk: 9
3. Customer cancel → status jadi `CANCELLED`
4. **Actual:** Stok produk tetap 9 (tidak kembali ke 10)
5. **Expected:** Stok produk kembali ke 10

## Rekomendasi Fix

```typescript
export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body

  const order = await OrderModel.getById(id)
  if (!order) throw new NotFoundError('Pesanan', id)

  // Validasi transisi
  const validTransition = statusFlow[order.status]?.includes(status)
  if (!validTransition) {
    throw new BadRequestError(`Tidak bisa mengubah status dari ${order.status} ke ${status}`)
  }

  // ✅ Restore stock jika cancel
  if (
    status === 'CANCELLED' &&
    order.stockReleased &&
    ['CONFIRMED', 'PROCESSING'].includes(order.status)
  ) {
    await prisma.$transaction(async (tx) => {
      // Restore stock untuk setiap item
      for (const item of order.items ?? []) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        })
      }
      // Update order
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED', stockReleased: false },
      })
    })

    await ActivityLogModel.create({
      type: 'order_cancelled',
      referenceId: id,
      description: 'Pesanan dibatalkan, stok dikembalikan',
    })

    return sendResponse(res, 200, 'Pesanan dibatalkan, stok dikembalikan')
  }

  // Normal update
  await OrderModel.update(id, { status })
  return sendResponse(res, 200, 'Status pesanan diperbarui')
}
```
