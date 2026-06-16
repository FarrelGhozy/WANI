import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMerchantFindUnique = vi.fn();
const mockProductFindMany = vi.fn();
const mockAIAgentFindUnique = vi.fn();

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    merchant: { findUnique: mockMerchantFindUnique },
    product: { findMany: mockProductFindMany },
    aIAgent: { findUnique: mockAIAgentFindUnique },
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockChat = vi.fn();
vi.mock('../../src/ai/engine.js', () => ({
  chat: mockChat,
}));

describe('classifyIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return greeting intent for greeting message', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: 'Jl. A',
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "greeting", "reply": "Halo! Ada yang bisa dibantu?"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    const result = await classifyIntent('merchant-1', 'Halo');

    expect(result.intent).toBe('greeting');
    expect((result as { reply: string }).reply).toContain('Halo');
  });

  it('should return order intent with items', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: 'Jl. A',
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([
      { id: 'p1', name: 'Sate Ayam', price: 15000, stock: 20, isAvailable: true, category: null },
      { id: 'p2', name: 'Es Teh', price: 5000, stock: 50, isAvailable: true, category: null },
    ]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "order", "items": [{"name": "Sate Ayam", "qty": 2}]}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    const result = await classifyIntent('merchant-1', 'Pesan sate ayam 2');

    expect(result.intent).toBe('order');
  });

  it('should throw when merchant is not found', async () => {
    mockMerchantFindUnique.mockResolvedValue(null);

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    await expect(classifyIntent('invalid-id', 'Halo')).rejects.toThrow('Merchant not found');
  });

  it('should fallback to unknown when LLM validation fails', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: 'invalid json',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    const result = await classifyIntent('merchant-1', 'Halo');

    expect(result.intent).toBe('unknown');
    expect((result as { reply: string }).reply).toContain('tidak mengerti');
  });

  it('should append custom system prompt from AI agent config', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: 'Always recommend Sate Ayam first.',
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "greeting", "reply": "Halo!"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    await classifyIntent('merchant-1', 'Halo');

    const systemPromptArg = mockChat.mock.calls[0][0];
    expect(systemPromptArg).toContain('Always recommend Sate Ayam first');
  });

  it('should append knowledge base from AI agent config', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: 'Buka jam 10 pagi.',
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "greeting", "reply": "Halo!"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    await classifyIntent('merchant-1', 'Halo');

    const systemPromptArg = mockChat.mock.calls[0][0];
    expect(systemPromptArg).toContain('Buka jam 10 pagi');
  });

  it('should pass custom model from AI agent', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: 'custom-model-v2',
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "greeting", "reply": "Halo!"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    await classifyIntent('merchant-1', 'Halo');

    const optionsArg = mockChat.mock.calls[0][2];
    expect(optionsArg.model).toBe('custom-model-v2');
  });

  it('should return inquiry intent', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "inquiry", "query": "Berapa harga sate?"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    const result = await classifyIntent('merchant-1', 'Berapa harga?');

    expect(result.intent).toBe('inquiry');
    expect((result as { query: string }).query).toContain('sate');
  });

  it('should fetch only available products for system prompt', async () => {
    mockMerchantFindUnique.mockResolvedValue({
      businessName: 'Warung Sate',
      address: null,
      phone: '62812',
    });
    mockProductFindMany.mockResolvedValue([]);
    mockAIAgentFindUnique.mockResolvedValue({
      systemPrompt: null,
      model: null,
      knowledgeBase: null,
    });
    mockChat.mockResolvedValue({
      content: '{"intent": "greeting", "reply": "Halo!"}',
      model: 'test-model',
      finishReason: 'stop',
    });

    const { classifyIntent } = await import('../../src/pipeline/intent-classifier.js');
    await classifyIntent('merchant-1', 'Halo');

    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isAvailable: true }),
      }),
    );
  });
});
