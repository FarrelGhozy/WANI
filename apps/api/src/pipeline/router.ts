import { LLMOutput } from '../types/index.js';

/**
 * Main message router — deduplicates by message ID, ensures conversation exists,
 * classifies intent, and delegates to the appropriate handler.
 *
 * Designed to be called by Baileys message-handler hooks.
 */

// ─── Types ─────────────────────────────────────────────

export interface WaIncomingMessage {
  /** Unique WhatsApp message ID (e.g. 'ABEGkZ...') */
  id: string;
  /** Sender's phone number (already formatted, e.g. 62812...) */
  from: string;
  /** The text content of the message */
  text: string;
  /** Sender's display name (if available) */
  senderName?: string;
}

export interface RoutingContext {
  merchantId: string;
  customerId: string;
  conversationId: string;
  message: WaIncomingMessage;
}

// ─── Prisma + logger ───────────────────────────────────

import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { classifyIntent } from './intent-classifier.js';
import { processOrder } from './order-parser.js';
import { handleInquiry } from './inquiry-handler.js';
import { escalateConversation } from './escalation.js';

// ─── Main Handler ──────────────────────────────────────

/**
 * Handle an incoming WhatsApp message.
 * 1. Deduplicate by message ID.
 * 2. Find or create conversation.
 * 3. Save incoming message.
 * 4. Classify intent.
 * 5. Route to the appropriate handler.
 */
export async function handleIncomingMessage(
  merchantId: string,
  msg: WaIncomingMessage,
): Promise<string | null> {
  logger.info({ msgId: msg.id, from: msg.from }, 'Incoming message');

  // ── 1. Deduplication ──────────────────────────────
  const existing = await prisma.message.findFirst({
    where: { id: msg.id },
    select: { id: true },
  });
  if (existing) {
    logger.warn({ msgId: msg.id }, 'Duplicate message, skipping');
    return null;
  }

  // ── 2. Find or create customer + conversation ────
  const customer = await prisma.customer.upsert({
    where: {
      merchantId_phone: { merchantId, phone: msg.from },
    },
    update: {
      name: msg.senderName ?? undefined,
      totalOrders: undefined, // don't update counter on upsert
    },
    create: {
      merchantId,
      phone: msg.from,
      name: msg.senderName ?? 'Customer',
    },
  });

  let conversation = await prisma.conversation.findFirst({
    where: {
      merchantId,
      customerId: customer.id,
      status: { in: ['ACTIVE', 'ESCALATED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        merchantId,
        customerId: customer.id,
        status: 'ACTIVE',
      },
    });
  }

  // ── 3. Save incoming message ──────────────────────
  await prisma.message.create({
    data: {
      id: msg.id,
      conversationId: conversation.id,
      role: 'CUSTOMER',
      content: msg.text,
      msgType: 'text',
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  // ── 4. Check AI agent enabled ─────────────────────
  const aiAgent = await prisma.aIAgent.findUnique({
    where: { merchantId },
    select: { isActive: true },
  });

  if (aiAgent && !aiAgent.isActive) {
    logger.info({ merchantId }, 'AI agent disabled, skipping auto-reply');
    return null;
  }

  // ── 5. Skip AI reply if conversation is ESCALATED ──
  if (conversation.status === 'ESCALATED') {
    logger.info({ conversationId: conversation.id }, 'Conversation escalated, skipping AI reply');
    return null;
  }

  // ── 6. Build routing context ──────────────────────
  const ctx: RoutingContext = {
    merchantId,
    customerId: customer.id,
    conversationId: conversation.id,
    message: msg,
  };

  // ── 7. Classify intent ────────────────────────────
  let output: LLMOutput;
  try {
    output = await classifyIntent(merchantId, msg.text);
  } catch (err) {
    logger.error({ err }, 'Intent classification failed');
    await _saveBotMessage(ctx, 'Maaf, terjadi gangguan teknis. Silakan coba lagi.');
    return 'Maaf, terjadi gangguan teknis. Silakan coba lagi.';
  }

  // ── 8. Route ─────────────────────────────────────
  try {
    switch (output.intent) {
      case 'order':
        return await _routeOrder(ctx, output);

      case 'inquiry':
        return await _routeInquiry(ctx, output);

      case 'greeting':
        return await _routeGreeting(ctx, output);

      case 'complaint':
        return await _routeComplaint(ctx, output);

      case 'escalate':
        return await _routeEscalate(ctx, output);

      case 'unknown':
      default:
        return await _routeUnknown(ctx, output);
    }
  } catch (err) {
    logger.error({ err, intent: output.intent }, 'Routing handler error');
    await _saveBotMessage(ctx, 'Maaf, terjadi kesalahan saat memproses pesan Anda.');
    return 'Maaf, terjadi kesalahan saat memproses pesan Anda.';
  }
}

// ─── Route Handlers ────────────────────────────────────

async function _routeOrder(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'order' },
): Promise<string> {
  const result = await processOrder(
    ctx.merchantId,
    ctx.customerId,
    output.items,
    output.notes,
  );

  if (result.invoice) {
    await _saveBotMessage(ctx, result.invoice);
    return result.invoice;
  }

  const errorReply = result.error ?? 'Gagal memproses pesanan.';
  await _saveBotMessage(ctx, errorReply);
  return errorReply;
}

async function _routeInquiry(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'inquiry' },
): Promise<string> {
  const reply = await handleInquiry(ctx.merchantId, output.query);
  await _saveBotMessage(ctx, reply);
  return reply;
}

async function _routeGreeting(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'greeting' },
): Promise<string> {
  await _saveBotMessage(ctx, output.reply);
  return output.reply;
}

async function _routeComplaint(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'complaint' },
): Promise<string> {
  const { reply, escalate } = output;

  // Always send the empathetic bot reply first
  await _saveBotMessage(ctx, reply);

  if (escalate) {
    await escalateConversation(
      ctx.conversationId,
      ctx.merchantId,
      'Keluhan pelanggan — butuh tindakan manual.',
    );
    const escalationNotice =
      'Pesan Anda akan segera ditangani oleh tim kami. Mohon tunggu, ya. 🙏';
    await _saveBotMessage(ctx, escalationNotice);
    return `${reply}\n\n${escalationNotice}`;
  }

  return reply;
}

async function _routeEscalate(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'escalate' },
): Promise<string> {
  await escalateConversation(
    ctx.conversationId,
    ctx.merchantId,
    output.reason,
  );
  const notice =
    'Baik, saya hubungkan Anda dengan tim kami. Mohon tunggu sebentar. ⏳';
  await _saveBotMessage(ctx, notice);
  return notice;
}

async function _routeUnknown(
  ctx: RoutingContext,
  output: LLMOutput & { intent: 'unknown' },
): Promise<string> {
  await _saveBotMessage(ctx, output.reply);
  return output.reply;
}

// ─── Internal Helpers ──────────────────────────────────

async function _saveBotMessage(
  ctx: RoutingContext,
  text: string,
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId: ctx.conversationId,
      role: 'BOT',
      content: text,
      msgType: 'text',
    },
  });

  await prisma.conversation.update({
    where: { id: ctx.conversationId },
    data: { lastMessageAt: new Date() },
  });
}
