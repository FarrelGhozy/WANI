import axios, { isAxiosError } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// ─── Types ────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** How many times to retry on network/5xx errors (default 2) */
  retries?: number;
  /** Request timeout in ms (default 30_000) */
  timeout?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  finishReason: string;
}

// ─── OpenRouter Client ────────────────────────────────────

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const apiClient = axios.create({
  baseURL: OPENROUTER_BASE,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.ai.openrouterApiKey}`,
    'HTTP-Referer': 'https://wani.app',
    'X-Title': 'WANI',
  },
});

// ─── Retry Helper ─────────────────────────────────────────

function isRetryable(error: unknown): boolean {
  if (!isAxiosError(error)) return true; // network error
  const status = error.response?.status;
  if (!status) return true; // no response = network error
  // Retry on 429 (rate-limit), 5xx (server errors)
  return status === 429 || (status >= 500 && status < 600);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Completion ───────────────────────────────────────────

/**
 * Send a chat completion request to OpenRouter.
 * Handles retries with exponential backoff.
 *
 * @param messages - Array of chat messages
 * @param options  - Model, token limits, retry config
 * @returns The parsed completion result
 */
export async function complete(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  const model = options.model ?? config.ai.defaultModel;
  const maxTokens = options.maxTokens ?? config.ai.maxTokens;
  const temperature = options.temperature ?? config.ai.temperature;
  const maxRetries = options.retries ?? 2;
  const timeout = options.timeout ?? 30_000;

  let lastModel = model;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const isFallbackAttempt = attempt > 0 && lastModel !== config.ai.fallbackModel;

    if (isFallbackAttempt) {
      lastModel = config.ai.fallbackModel;
      logger.warn({ fallback: true, model: lastModel }, 'Falling back to secondary model');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await apiClient.post(
        '/chat/completions',
        {
          model: lastModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      const choice = response.data?.choices?.[0];
      if (!choice?.message?.content) {
        throw new Error('Invalid response structure from OpenRouter');
      }

      const result: CompletionResult = {
        content: choice.message.content,
        model: lastModel,
        finishReason: choice.finish_reason ?? 'unknown',
      };

      logger.debug(
        { model: lastModel, finishReason: result.finishReason, attempt },
        'OpenRouter completion succeeded',
      );

      return result;
    } catch (error: unknown) {
      // Abort errors are not retryable
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      // Non-retryable error? Throw immediately.
      if (!isRetryable(error)) {
        const statusCode = isAxiosError(error) ? error.response?.status : undefined;
        const errMsg = isAxiosError(error)
          ? error.response?.data?.error?.message ?? error.message
          : String(error);

        throw new Error(`OpenRouter API error (${statusCode ?? 'unknown'}): ${errMsg}`);
      }

      // On last attempt, throw the accumulated error
      if (attempt === maxRetries) {
        const errMsg = isAxiosError(error)
          ? error.response?.data?.error?.message ?? error.message
          : String(error);

        throw new Error(
          `OpenRouter request failed after ${maxRetries + 1} attempt(s): ${errMsg}`,
        );
      }

      // Exponential backoff: 1s, 2s, 4s…
      const delay = Math.min(1000 * 2 ** attempt, 10_000);
      logger.warn(
        { attempt, delay, model: lastModel },
        'OpenRouter request failed, retrying…',
      );
      await sleep(delay);
    }
  }

  // Should never reach here
  throw new Error('Unexpected exit from retry loop');
}

/**
 * Convenience function: send a user message with a system prompt and get back the parsed content.
 */
export async function chat(
  systemPrompt: string,
  userMessage: string,
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  return complete(messages, options);
}
