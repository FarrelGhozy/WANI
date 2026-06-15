/**
 * Format pesan WhatsApp dengan template yang rapi.
 */

export function formatProductList(products: Array<{ name: string; price: number; stock: number }>): string {
  if (products.length === 0) return '📦 *Belum ada produk tersedia.*';

  const lines = products.map((p, i) => {
    const tersedia = p.stock > 0 ? '✅' : '❌';
    const harga = `Rp${p.price.toLocaleString('id-ID')}`;
    return `${i + 1}. ${tersedia} *${p.name}* — ${harga}`;
  });

  return `📋 *Daftar Produk*\n\n${lines.join('\n')}\n\nKetik *MENU* untuk lihat lagi.`;
}

export function formatInvoice(order: {
  id: string;
  items: Array<{ name: string; qty: number; subtotal: number }>;
  totalAmount: number;
}): string {
  const lines = order.items.map(
    (i) => `  ${i.qty}x ${i.name} — Rp${i.subtotal.toLocaleString('id-ID')}`
  );

  return `🧾 *INVOICE #${order.id.slice(0, 8)}*\n\n${lines.join('\n')}\n\n─────────────────\n💰 *Total: Rp${order.totalAmount.toLocaleString('id-ID')}*\n\nTerima kasih! Pesanan akan segera diproses ✅`;
}

export function formatGreeting(businessName: string, _productsCount: number): string {
  return `Halo! 👋 Selamat datang di *${businessName}*.\n\nKetik *MENU* untuk lihat produk kami.\nAtau langsung chat aja kalo mau pesan 😊`;
}
