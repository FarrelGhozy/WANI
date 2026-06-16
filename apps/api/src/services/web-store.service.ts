import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { updateWebStoreSchema } from '../lib/validation.js';
import type { UpdateWebStoreInput } from '../lib/validation.js';

export async function getWebStore(merchantId: string): Promise<ApiResponse> {
  try {
    let store = await prisma.webStore.findUnique({ where: { merchantId } });
    if (!store) {
      store = await prisma.webStore.create({
        data: { merchantId, slug: `toko-${merchantId.slice(0, 8)}` },
      });
    }
    return success(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get web store';
    return { success: false, error: message };
  }
}

export async function updateWebStore(merchantId: string, input: UpdateWebStoreInput): Promise<ApiResponse> {
  try {
    const parsed = updateWebStoreSchema.parse(input);

    const existing = await prisma.webStore.findUnique({ where: { merchantId } });
    if (!existing) {
      return { success: false, error: 'Web store not found. Create it first.' };
    }

    if (parsed.slug && parsed.slug !== existing.slug) {
      const slugTaken = await prisma.webStore.findUnique({ where: { slug: parsed.slug } });
      if (slugTaken) {
        return { success: false, error: 'Slug already taken' };
      }
    }

    const store = await prisma.webStore.update({
      where: { merchantId },
      data: parsed,
    });
    return success(store);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update web store';
    return { success: false, error: message };
  }
}

export async function publishWebStore(merchantId: string): Promise<ApiResponse> {
  try {
    const store = await prisma.webStore.update({
      where: { merchantId },
      data: { isPublished: true },
    });
    return success(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish';
    return { success: false, error: message };
  }
}

export async function unpublishWebStore(merchantId: string): Promise<ApiResponse> {
  try {
    const store = await prisma.webStore.update({
      where: { merchantId },
      data: { isPublished: false },
    });
    return success(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to unpublish';
    return { success: false, error: message };
  }
}

export async function getWebStoreBySlug(slug: string): Promise<ApiResponse> {
  try {
    const store = await prisma.webStore.findUnique({
      where: { slug, isPublished: true },
      include: {
        merchant: {
          select: {
            businessName: true,
            phone: true,
            address: true,
            categories: {
              include: {
                products: {
                  where: { isAvailable: true, stock: { gt: 0 } },
                  orderBy: { name: 'asc' },
                },
              },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });
    if (!store) return { success: false, error: 'Store not found or not published' };
    return success(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get store';
    return { success: false, error: message };
  }
}

export async function listTemplates(): Promise<ApiResponse> {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' },
    });
    return success(templates);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list templates';
    return { success: false, error: message };
  }
}

export async function getTemplate(name: string): Promise<ApiResponse> {
  try {
    const template = await prisma.template.findUnique({ where: { name } });
    if (!template) return { success: false, error: 'Template not found' };
    return success(template);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get template';
    return { success: false, error: message };
  }
}
