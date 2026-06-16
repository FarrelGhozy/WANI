import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { success } from '../utils/helpers.js';

export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  timezone: z.string().optional(),
  min_order: z.number().optional(),
  free_delivery_km: z.number().optional(),
  delivery_fee_city: z.number().optional(),
  delivery_fee_outside: z.number().optional(),
  estimated_delivery: z.string().optional(),
  delivery_area: z.string().optional(),
  business_hours: z.any().optional(),
  payment_methods: z.any().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_holder: z.string().optional(),
  qris_image: z.string().optional(),
  qris_holder: z.string().optional(),
});

export async function getSettings(merchantId: string) {
  try {
    const rows = await prisma.setting.findMany({ where: { merchantId } });
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return success(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get settings';
    return { success: false, error: message };
  }
}

export async function updateSettings(merchantId: string, input: Record<string, unknown>) {
  try {
    const parsed = updateSettingsSchema.parse(input);
    const entries = Object.entries(parsed).filter(([_, v]) => v !== undefined);

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { merchantId_key: { merchantId, key } },
          update: { value: value as any },
          create: { merchantId, key, value: value as any },
        }),
      ),
    );

    return await getSettings(merchantId);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update settings';
    return { success: false, error: message };
  }
}
