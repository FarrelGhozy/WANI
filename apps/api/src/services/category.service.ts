import { prisma } from '../config/prisma.js';
import { success } from '../utils/helpers.js';

export async function listCategories(merchantId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: { merchantId },
      orderBy: { name: 'asc' },
    });
    return success(categories);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list categories';
    return { success: false, error: message };
  }
}
