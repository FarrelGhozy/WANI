import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMessageFindFirst = vi.fn();
const mockMessageCreate = vi.fn();
const mockCustomerUpsert = vi.fn();
const mockConversationFindFirst = vi.fn();
const mockConversationCreate = vi.fn();
const mockConversationUpdate = vi.fn();
const mockAIAgentFindUnique = vi.fn();

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    message: { findFirst: mockMessageFindFirst, create: mockMessageCreate },
    customer: { upsert: mockCustomerUpsert },
    conversation: {
      findFirst: mockConversationFindFirst,
      create: mockConversationCreate,
      update: mockConversationUpdate,
    },
    aIAgent: { findUnique: mockAIAgentFindUnique },
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockClassifyIntent = vi.fn();
const mockProcessOrder = vi.fn();
const mockHandleInquiry = vi.fn();
const mockEscalateConversation = vi.fn();

vi.mock('../../src/pipeline/intent-classifier.js', () => ({
  classifyIntent: mockClassifyIntent,
}));

vi.mock('../../src/pipeline/order-parser.js', () => ({
  processOrder: mockProcessOrder,
}));

vi.mock('../../src/pipeline/inquiry-handler.js', () => ({
  handleInquiry: mockHandleInquiry,
}));

vi.mock('../../src/pipeline/escalation.js', () => ({
  escalateConversation: mockEscalateConversation,
}));

const baseMsg = {
  id: 'msg-1',
  from: '6281234567890',
  text: 'Halo',
  senderName: 'Budi',
};

describe('handleIncomingMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockMessageFindFirst.mockResolvedValue(null);
    mockCustomerUpsert.mockResolvedValue({ id: 'customer-1' });
    mockConversationFindFirst.mockResolvedValue({ id: 'conv-1', status: 'ACTIVE' });
    mockMessageCreate.mockResolvedValue({});
    mockConversationUpdate.mockResolvedValue({});
    mockAIAgentFindUnique.mockResolvedValue({ isActive: true });
  });

  it('should skip duplicate messages', async () => {
    mockMessageFindFirst.mockResolvedValue({ id: 'msg-1' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBeNull();
    expect(mockCustomerUpsert).not.toHaveBeenCalled();
  });

  it('should skip when AI agent is disabled', async () => {
    mockAIAgentFindUnique.mockResolvedValue({ isActive: false });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBeNull();
    expect(mockClassifyIntent).not.toHaveBeenCalled();
  });

  it('should proceed when AI agent record does not exist (default enabled)', async () => {
    mockAIAgentFindUnique.mockResolvedValue(null);
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Halo!');
    expect(mockClassifyIntent).toHaveBeenCalled();
  });

  it('should skip when conversation is ESCALATED', async () => {
    mockConversationFindFirst.mockResolvedValue({ id: 'conv-1', status: 'ESCALATED' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBeNull();
    expect(mockClassifyIntent).not.toHaveBeenCalled();
  });

  it('should create new conversation if none active', async () => {
    mockConversationFindFirst.mockResolvedValue(null);
    mockConversationCreate.mockResolvedValue({ id: 'conv-new', status: 'ACTIVE' });
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    await handleIncomingMessage('m1', baseMsg);

    expect(mockConversationCreate).toHaveBeenCalledWith({
      data: {
        merchantId: 'm1',
        customerId: 'customer-1',
        status: 'ACTIVE',
      },
    });
  });

  it('should route greeting intent', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo, ada yang bisa dibantu?' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Halo, ada yang bisa dibantu?');
    expect(mockMessageCreate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'BOT' }),
      }),
    );
  });

  it('should route order intent', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'order',
      items: [{ name: 'Sate Ayam', qty: 2 }],
    });
    mockProcessOrder.mockResolvedValue({ invoice: '🧾 INVOICE ...' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toContain('INVOICE');
    expect(mockProcessOrder).toHaveBeenCalled();
  });

  it('should route order intent with error response', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'order',
      items: [{ name: 'Unknown', qty: 1 }],
    });
    mockProcessOrder.mockResolvedValue({ error: 'Produk tidak ditemukan.' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Produk tidak ditemukan.');
  });

  it('should route inquiry intent', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'inquiry',
      query: 'Berapa harga sate?',
    });
    mockHandleInquiry.mockResolvedValue('Sate Ayam Rp15.000');

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Sate Ayam Rp15.000');
  });

  it('should route complaint without escalation', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'complaint',
      reply: 'Maaf atas ketidaknyamanannya.',
      escalate: false,
    });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Maaf atas ketidaknyamanannya.');
    expect(mockEscalateConversation).not.toHaveBeenCalled();
  });

  it('should route complaint with escalation', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'complaint',
      reply: 'Maaf, kami tindak lanjuti.',
      escalate: true,
    });
    mockEscalateConversation.mockResolvedValue({
      merchantPhone: '62812',
      notification: '🔔 Eskalasi',
    });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toContain('Maaf, kami tindak lanjuti');
    expect(result).toContain('akan segera ditangani');
    expect(mockEscalateConversation).toHaveBeenCalledWith(
      'conv-1',
      'm1',
      'Keluhan pelanggan — butuh tindakan manual.',
    );
  });

  it('should route escalate intent', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'escalate',
      reason: 'Saya ingin bicara admin',
    });
    mockEscalateConversation.mockResolvedValue({
      merchantPhone: '62812',
      notification: '🔔 Eskalasi',
    });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toContain('saya hubungkan Anda dengan tim kami');
    expect(mockEscalateConversation).toHaveBeenCalledWith('conv-1', 'm1', 'Saya ingin bicara admin');
  });

  it('should route unknown intent', async () => {
    mockClassifyIntent.mockResolvedValue({
      intent: 'unknown',
      reply: 'Maaf, saya tidak mengerti.',
    });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toBe('Maaf, saya tidak mengerti.');
  });

  it('should handle intent classification failure gracefully', async () => {
    mockClassifyIntent.mockRejectedValue(new Error('LLM error'));

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toContain('gangguan teknis');
  });

  it('should save bot message on routing handler error', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    let callIndex = 0;
    mockMessageCreate.mockImplementation(() => {
      callIndex++;
      if (callIndex === 2) { // 2nd call = BOT message save in _routeGreeting
        return Promise.reject(new Error('save failed'));
      }
      return Promise.resolve({});
    });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    const result = await handleIncomingMessage('m1', baseMsg);

    expect(result).toContain('kesalahan saat memproses');
  });

  it('should create customer via upsert with sender name', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    await handleIncomingMessage('m1', baseMsg);

    expect(mockCustomerUpsert).toHaveBeenCalledWith({
      where: { merchantId_phone: { merchantId: 'm1', phone: '6281234567890' } },
      update: { name: 'Budi' },
      create: {
        merchantId: 'm1',
        phone: '6281234567890',
        name: 'Budi',
      },
    });
  });

  it('should save incoming message before AI processing', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    await handleIncomingMessage('m1', baseMsg);

    const customerMsgCalls = mockMessageCreate.mock.calls.filter(
      (call: [{ data: { role: string } }]) => call[0].data.role === 'CUSTOMER',
    );
    expect(customerMsgCalls).toHaveLength(1);
    expect(customerMsgCalls[0][0].data.content).toBe('Halo');
  });

  it('should update conversation lastMessageAt when saving messages', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    await handleIncomingMessage('m1', baseMsg);

    expect(mockConversationUpdate).toHaveBeenCalled();
  });

  it('should handle customer upsert without sender name', async () => {
    mockClassifyIntent.mockResolvedValue({ intent: 'greeting', reply: 'Halo!' });

    const { handleIncomingMessage } = await import('../../src/pipeline/router.js');
    await handleIncomingMessage('m1', { ...baseMsg, senderName: undefined });

    expect(mockCustomerUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { name: undefined },
        create: expect.objectContaining({ name: 'Customer' }),
      }),
    );
  });
});
