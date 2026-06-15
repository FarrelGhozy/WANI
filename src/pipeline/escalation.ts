import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

/**
 * Escalate a conversation to human agent.
 *
 * 1. Updates conversation status to ESCALATED.
 * 2. Logs the escalation reason.
 * 3. Returns a notification object describing what the merchant should know.
 *
 * Future: integrate with a real notification service to forward to the
 * merchant's personal WhatsApp number via Baileys.
 */
export async function escalateConversation(
  conversationId: string,
  merchantId: string,
  reason: string,
): Promise<{ merchantPhone?: string; notification: string }> {
  // ── 1. Update conversation status ──────────────────
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'ESCALATED' },
  });

  // ── 2. Log activity ────────────────────────────────
  await prisma.activityLog.create({
    data: {
      merchantId,
      type: 'ESCALATION',
      referenceId: conversationId,
      description: `Conversation escalated: ${reason}`,
      metadata: {
        reason,
        conversationId,
        escalatedAt: new Date().toISOString(),
      },
    },
  });

  logger.info({ conversationId, merchantId, reason }, 'Conversation escalated');

  // ── 3. Fetch merchant phone for notification ───────
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { phone: true, businessName: true },
  });

  const notification = `🔔 *Eskalasi ${merchant?.businessName ?? 'Merchant'}*\n\nPercakapan membutuhkan perhatian manusia.\nAlasan: ${reason}\n\nBuka dashboard untuk merespon.`;

  return {
    merchantPhone: merchant?.phone,
    notification,
  };
}
