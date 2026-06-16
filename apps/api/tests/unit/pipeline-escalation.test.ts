import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConversationUpdate = vi.fn();
const mockActivityCreate = vi.fn();
const mockMerchantFindUnique = vi.fn();

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    conversation: { update: mockConversationUpdate },
    activityLog: { create: mockActivityCreate },
    merchant: { findUnique: mockMerchantFindUnique },
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('escalateConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update conversation status to ESCALATED', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockActivityCreate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue({ phone: '6281234567890', businessName: 'Test' });

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    await escalateConversation('conv-1', 'merchant-1', 'Customer meminta admin');

    expect(mockConversationUpdate).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { status: 'ESCALATED' },
    });
  });

  it('should log escalation activity', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockActivityCreate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue({ phone: '6281234567890', businessName: 'Test' });

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    await escalateConversation('conv-1', 'merchant-1', 'Keluhan pelanggan');

    expect(mockActivityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchantId: 'merchant-1',
        type: 'ESCALATION',
        referenceId: 'conv-1',
        description: expect.stringContaining('Keluhan pelanggan'),
      }),
    });
  });

  it('should return notification with merchant phone', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockActivityCreate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue({
      phone: '6281234567890',
      businessName: 'Warung Sate',
    });

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    const result = await escalateConversation('conv-1', 'merchant-1', 'Test reason');

    expect(result.merchantPhone).toBe('6281234567890');
    expect(result.notification).toContain('Warung Sate');
    expect(result.notification).toContain('Test reason');
  });

  it('should handle missing merchant gracefully', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockActivityCreate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue(null);

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    const result = await escalateConversation('conv-1', 'merchant-1', 'Test');

    expect(result.merchantPhone).toBeUndefined();
    expect(result.notification).toContain('Merchant');
  });

  it('should include reason in metadata', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue(null);

    let capturedMetadata: Record<string, unknown> = {};
    mockActivityCreate.mockImplementation(async (args: { data: { metadata: Record<string, unknown> } }) => {
      capturedMetadata = args.data.metadata;
      return {};
    });

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    await escalateConversation('conv-1', 'merchant-1', 'Spam message');

    expect(capturedMetadata.reason).toBe('Spam message');
    expect(capturedMetadata.conversationId).toBe('conv-1');
    expect(capturedMetadata.escalatedAt).toBeDefined();
  });

  it('should handle empty reason', async () => {
    mockConversationUpdate.mockResolvedValue({});
    mockActivityCreate.mockResolvedValue({});
    mockMerchantFindUnique.mockResolvedValue({ phone: '62812', businessName: 'Toko' });

    const { escalateConversation } = await import('../../src/pipeline/escalation.js');
    const result = await escalateConversation('conv-1', 'merchant-1', '');

    expect(result.notification).toBeDefined();
  });
});
