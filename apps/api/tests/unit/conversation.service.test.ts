import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/prisma.js', () => {
  const mockPrisma = {
    conversation: { findUnique: vi.fn(), update: vi.fn() },
    message: { findMany: vi.fn(), count: vi.fn() },
    activityLog: { create: vi.fn() },
  };
  return { prisma: mockPrisma };
});

const { prisma } = await import('../../src/config/prisma.js');

describe('Conversation Service', () => {
  const conversationId = '00000000-0000-4000-a000-000000000010';
  const merchantId = '00000000-0000-4000-a000-000000000100';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveConversation', () => {
    it('should resolve active conversation', async () => {
      const { resolveConversation } = await import('../../src/services/conversation.service.js');

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: conversationId,
        merchantId,
        status: 'ACTIVE',
      } as any);
      vi.mocked(prisma.conversation.update).mockResolvedValue({
        id: conversationId,
        status: 'RESOLVED',
      } as any);

      const result = await resolveConversation(conversationId);
      expect(result.success).toBe(true);
    });

    it('should reject archived conversation', async () => {
      const { resolveConversation } = await import('../../src/services/conversation.service.js');

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: conversationId,
        merchantId,
        status: 'ARCHIVED',
      } as any);

      const result = await resolveConversation(conversationId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('archived');
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages', async () => {
      const { getMessages } = await import('../../src/services/conversation.service.js');

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: conversationId,
      } as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);
      vi.mocked(prisma.message.count).mockResolvedValue(0);

      const result = await getMessages(conversationId, { page: 1, limit: 20 });
      expect(result.success).toBe(true);
    });
  });
});
