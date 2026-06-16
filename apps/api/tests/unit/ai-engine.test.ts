import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();

vi.mock('axios', () => {
  const mockAxiosInstance = { post: mockPost };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
    isAxiosError: vi.fn((error: unknown) => (error as Record<string, unknown>)?.isAxiosError === true),
  };
});

vi.mock('../../src/config/index.js', () => ({
  config: {
    logLevel: 'silent',
    nodeEnv: 'test',
    ai: {
      openrouterApiKey: 'sk-test-key',
      defaultModel: 'test-model',
      fallbackModel: 'fallback-model',
      maxTokens: 2048,
      temperature: 0.7,
    },
  },
}));

vi.mock('../../src/config/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('AI Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chat', () => {
    it('should return content on successful response', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [
            {
              message: { content: '{"intent": "greeting", "reply": "Halo!"}' },
              finish_reason: 'stop',
            },
          ],
        },
      });

      const { chat } = await import('../../src/ai/engine.js');
      const result = await chat('system prompt', 'user message');
      expect(result.content).toBe('{"intent": "greeting", "reply": "Halo!"}');
      expect(result.model).toBe('test-model');
      expect(result.finishReason).toBe('stop');
    });

    it('should send system and user messages', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        },
      });

      const { chat } = await import('../../src/ai/engine.js');
      await chat('You are a helper', 'Hello');

      const callArgs = mockPost.mock.calls[0];
      expect(callArgs[0]).toBe('/chat/completions');
      expect(callArgs[1].messages).toHaveLength(2);
      expect(callArgs[1].messages[0].role).toBe('system');
      expect(callArgs[1].messages[0].content).toBe('You are a helper');
      expect(callArgs[1].messages[1].role).toBe('user');
      expect(callArgs[1].messages[1].content).toBe('Hello');
    });
  });

  describe('complete', () => {
    it('should use custom model when provided', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        },
      });

      const { complete } = await import('../../src/ai/engine.js');
      await complete([{ role: 'user', content: 'hi' }], { model: 'custom-model' });

      expect(mockPost.mock.calls[0][1].model).toBe('custom-model');
    });

    it('should retry on network error and succeed', async () => {
      mockPost
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
          },
        });

      const { complete } = await import('../../src/ai/engine.js');
      const result = await complete([{ role: 'user', content: 'hi' }]);
      expect(result.content).toBe('ok');
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('should fallback to fallback model after primary fails', async () => {
      mockPost
        .mockRejectedValueOnce({ isAxiosError: true, response: { status: 503 } })
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: 'fallback ok' }, finish_reason: 'stop' }],
          },
        });

      const { complete } = await import('../../src/ai/engine.js');
      const result = await complete([{ role: 'user', content: 'hi' }]);
      expect(result.content).toBe('fallback ok');
      expect(result.model).toBe('fallback-model');
    });

    it('should throw on non-retryable 4xx error', async () => {
      mockPost.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { error: { message: 'Bad request' } } },
        message: 'Bad request',
      });

      const { complete } = await import('../../src/ai/engine.js');
      await expect(complete([{ role: 'user', content: 'hi' }])).rejects.toThrow('OpenRouter API error (400): Bad request');
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should throw after exhausting all retries', async () => {
      mockPost.mockRejectedValue({
        isAxiosError: true,
        response: { status: 503 },
        message: 'Service unavailable',
      });

      const { complete } = await import('../../src/ai/engine.js');
      await expect(complete([{ role: 'user', content: 'hi' }], { retries: 1 })).rejects.toThrow(
        'OpenRouter request failed after 2 attempt(s): Service unavailable',
      );
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('should throw on timeout', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockPost.mockRejectedValue(abortError);

      const { complete } = await import('../../src/ai/engine.js');
      await expect(
        complete([{ role: 'user', content: 'hi' }], { timeout: 100 }),
      ).rejects.toThrow('Request timed out after 100ms');
    });

    it('should throw on invalid response structure', async () => {
      mockPost.mockResolvedValue({ data: {} });

      const { complete } = await import('../../src/ai/engine.js');
      await expect(complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        'Invalid response structure from OpenRouter',
      );
    });

    it('should use custom options', async () => {
      mockPost.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
        },
      });

      const { complete } = await import('../../src/ai/engine.js');
      await complete([{ role: 'user', content: 'hi' }], {
        maxTokens: 512,
        temperature: 0.5,
        retries: 0,
        timeout: 5000,
      });

      expect(mockPost.mock.calls[0][1].max_tokens).toBe(512);
      expect(mockPost.mock.calls[0][1].temperature).toBe(0.5);
    });
  });
});
