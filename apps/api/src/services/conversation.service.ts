import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse, PaginationParams } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { Prisma } from '@prisma/client';

// ─── Zod Schemas ─────────────────────────────────────────

export const createConversationSchema = z.object({
  merchantId: z.string().uuid(),
  customerId: z.string().uuid(),
});

export const updateConversationSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED', 'ARCHIVED', 'ESCALATED']).optional(),
});

export const sendMessageSchema = z.object({
  role: z.enum(['CUSTOMER', 'BOT', 'HUMAN']),
  content: z.string().min(1),
  msgType: z.string().default('text'),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ─── CRUD Methods ────────────────────────────────────────

export async function listConversations(
  merchantId: string,
  params: PaginationParams,
  filters?: { status?: string; customerId?: string },
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = { merchantId };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.customerId) where.customerId = filters.customerId;

    const [data, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list conversations';
    return { success: false, error: message };
  }
}

export async function getConversationById(id: string): Promise<ApiResponse> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        merchant: { select: { id: true, businessName: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });
    if (!conversation) return { success: false, error: 'Conversation not found' };
    return success(conversation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get conversation';
    return { success: false, error: message };
  }
}

export async function getConversationByParticipants(
  merchantId: string,
  customerId: string,
): Promise<ApiResponse> {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { merchantId, customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });
    if (!conversation) return { success: false, error: 'Conversation not found' };
    return success(conversation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to find conversation';
    return { success: false, error: message };
  }
}

export async function createConversation(input: CreateConversationInput): Promise<ApiResponse> {
  try {
    const parsed = createConversationSchema.parse(input);

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.merchantId } });
    if (!merchant) return { success: false, error: 'Merchant not found' };

    // Verify customer exists and belongs to merchant
    const customer = await prisma.customer.findFirst({
      where: { id: parsed.customerId, merchantId: parsed.merchantId },
    });
    if (!customer) return { success: false, error: 'Customer not found for this merchant' };

    // Check for existing active conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        merchantId: parsed.merchantId,
        customerId: parsed.customerId,
        status: 'ACTIVE',
      },
    });
    if (existing) return { success: false, error: 'An active conversation already exists with this customer' };

    const conversation = await prisma.conversation.create({
      data: {
        merchantId: parsed.merchantId,
        customerId: parsed.customerId,
        status: 'ACTIVE',
      },
      include: { customer: true },
    });

    return success(conversation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create conversation';
    return { success: false, error: message };
  }
}

export async function updateConversation(
  id: string,
  input: UpdateConversationInput,
): Promise<ApiResponse> {
  try {
    const parsed = updateConversationSchema.parse(input);

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Conversation not found' };

    const conversation = await prisma.conversation.update({
      where: { id },
      data: parsed,
      include: {
        customer: true,
        _count: { select: { messages: true } },
      },
    });
    return success(conversation);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update conversation';
    return { success: false, error: message };
  }
}

export async function deleteConversation(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Conversation not found' };

    // Delete associated messages first
    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });

    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete conversation';
    return { success: false, error: message };
  }
}

// ─── Message Methods ─────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<ApiResponse> {
  try {
    const parsed = sendMessageSchema.parse(input);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return { success: false, error: 'Conversation not found' };

    // Create message and update conversation timestamp in a transaction
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          role: parsed.role,
          content: parsed.content,
          msgType: parsed.msgType,
          metadata: parsed.metadata as any,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return success(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to send message';
    return { success: false, error: message };
  }
}

export async function getMessages(
  conversationId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return { success: false, error: 'Conversation not found' };

    const [data, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return success(data, { page, limit, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get messages';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function resolveConversation(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Conversation not found' };
    if (existing.status === 'ARCHIVED') {
      return { success: false, error: 'Cannot resolve an archived conversation' };
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status: 'RESOLVED' },
    });
    return success(conversation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve conversation';
    return { success: false, error: message };
  }
}

export async function escalateConversation(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Conversation not found' };

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status: 'ESCALATED' },
    });
    return success(conversation);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to escalate conversation';
    return { success: false, error: message };
  }
}

export async function getActiveConversations(
  merchantId: string,
  params: PaginationParams,
): Promise<ApiResponse> {
  try {
    return await listConversations(merchantId, params, { status: 'ACTIVE' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get active conversations';
    return { success: false, error: message };
  }
}

export async function getConversationStats(merchantId: string): Promise<ApiResponse> {
  try {
    const [total, active, resolved, archived, escalated] = await Promise.all([
      prisma.conversation.count({ where: { merchantId } }),
      prisma.conversation.count({ where: { merchantId, status: 'ACTIVE' } }),
      prisma.conversation.count({ where: { merchantId, status: 'RESOLVED' } }),
      prisma.conversation.count({ where: { merchantId, status: 'ARCHIVED' } }),
      prisma.conversation.count({ where: { merchantId, status: 'ESCALATED' } }),
    ]);

    return success({ total, active, resolved, archived, escalated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get conversation stats';
    return { success: false, error: message };
  }
}
