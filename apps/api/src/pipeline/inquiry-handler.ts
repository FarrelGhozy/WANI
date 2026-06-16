import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { formatProductList } from '../utils/wa-formatter.js';

/**
 * Handle a product inquiry from a customer.
 * Searches products by keyword (name and description), formats the result
 * with wa-formatter, and returns the reply text.
 */
export async function handleInquiry(
  merchantId: string,
  query: string,
): Promise<string> {
  try {
    // ── Search products by keyword ────────────────────
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 1);

    // If query is very short or just "menu", return all available products
    const showAll = keywords.length === 0 || keywords.some((k) => ['menu', 'produk', 'product', 'list', 'daftar'].includes(k));

    let products;

    if (showAll) {
      products = await prisma.product.findMany({
        where: {
          merchantId,
          isAvailable: true,
          stock: { gt: 0 },
        },
        select: { name: true, price: true, stock: true },
        orderBy: { name: 'asc' },
        take: 50,
      });
    } else {
      // Build a search filter across name and description
      const nameConditions = keywords.map((kw) => ({
        name: { contains: kw, mode: 'insensitive' as const },
      }));

      const descConditions = keywords.map((kw) => ({
        description: { contains: kw, mode: 'insensitive' as const },
      }));

      products = await prisma.product.findMany({
        where: {
          merchantId,
          isAvailable: true,
          OR: [
            { AND: nameConditions },
            { AND: descConditions },
            // Also match partial keywords across name
            ...keywords.map((kw) => ({ name: { contains: kw, mode: 'insensitive' as const } })),
          ],
        },
        select: { name: true, price: true, stock: true },
        orderBy: { name: 'asc' },
        take: 50,
      });
    }

    // ── Format response ───────────────────────────────
    if (products.length === 0) {
      return showAll
        ? '📦 *Belum ada produk tersedia.*'
        : `Maaf, tidak ada produk yang cocok dengan "${query}". Coba kata kunci lain atau ketik *MENU* untuk lihat semua produk.`;
    }

    // Convert Decimal prices to numbers for the formatter
    const formatted = products.map((p: { name: string; price: { toNumber?: () => number; toString?: () => string }; stock: number }) => ({
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
    }));

    return formatProductList(formatted);
  } catch (err) {
    logger.error({ err, merchantId, query }, 'Inquiry handling failed');
    return 'Maaf, terjadi kesalahan saat mencari produk. Silakan coba lagi.';
  }
}
