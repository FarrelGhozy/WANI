import { env } from "@/src/config/env"
import { logger } from "@/src/config/logger"
import type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  TokenUsage,
} from "@/src/types/ai"

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = "LLMError"
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface LLMChoice {
  message?: { content?: string }
  finish_reason?: string
}

interface LLMResponse {
  choices?: LLMChoice[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  error?: { message?: string }
}

/**
 * Send a chat completion to the configured LLM provider with retry + backoff
 * and a one-time fallback to a secondary model. Throws LLMError on permanent failure.
 */
export async function complete(
  messages: ChatMessage[],
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  if (!env.ai.llmApiKey) {
    throw new LLMError("LLM_API_KEY (or OPENROUTER_API_KEY) is not configured", false)
  }

  const baseUrl = env.ai.llmBaseUrl
  const maxTokens = options.maxTokens ?? env.ai.maxTokens
  const temperature = options.temperature ?? env.ai.temperature
  const maxRetries = options.retries ?? 2
  const timeout = options.timeout ?? 30_000

  let model = options.model ?? env.ai.defaultModel

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // After the first failed attempt, fall back to the secondary model once.
    if (attempt > 0 && model !== env.ai.fallbackModel) {
      model = env.ai.fallbackModel
      logger.warn("Falling back to secondary LLM model", { fallback: true, model })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ai.llmApiKey}`,
      }

      // OpenRouter-specific metadata headers
      if (baseUrl.includes("openrouter.ai")) {
        headers["HTTP-Referer"] = "https://wani.app"
        headers["X-Title"] = "WANI"
      }

      const res = await fetch(baseUrl, {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      })

      if (!res.ok) {
        const retryable = res.status === 429 || res.status >= 500
        let detail = res.statusText
        try {
          const body = (await res.json()) as LLMResponse
          detail = body.error?.message ?? detail
        } catch {
          /* ignore body parse errors */
        }
        throw new LLMError(`LLM ${res.status}: ${detail}`, retryable)
      }

      const data = (await res.json()) as LLMResponse
      const choice = data.choices?.[0]
      const content = choice?.message?.content
      if (!content) {
        throw new LLMError("Invalid response structure from LLM", true)
      }

      const usage: TokenUsage = {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      }

      logger.info("LLM completion succeeded", {
        model,
        finishReason: choice?.finish_reason,
        attempt,
        usage,
      })

      return {
        content,
        model,
        finishReason: choice?.finish_reason ?? "unknown",
        usage,
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === "AbortError"
      const retryable = isAbort || !(err instanceof LLMError) || err.retryable
      const message = isAbort
        ? `Request timed out after ${timeout}ms`
        : err instanceof Error
          ? err.message
          : String(err)

      if (!retryable) {
        throw err instanceof LLMError ? err : new LLMError(message, false)
      }

      if (attempt === maxRetries) {
        throw new LLMError(
          `LLM failed after ${maxRetries + 1} attempt(s): ${message}`,
          false,
        )
      }

      const delay = Math.min(1000 * 2 ** attempt, 10_000)
      logger.warn("LLM request failed, retrying", { attempt, delay, model, message })
      await sleep(delay)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw new LLMError("Unexpected exit from retry loop", false)
}

/** Convenience: system prompt + single user message. */
export async function chat(
  systemPrompt: string,
  userMessage: string,
  options: CompletionOptions = {},
): Promise<CompletionResult> {
  return complete(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    options,
  )
}
