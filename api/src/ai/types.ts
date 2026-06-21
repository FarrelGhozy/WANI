// Shared AI / pipeline types.

export interface OrderItemInput {
  name: string
  qty: number
}

export type LLMOutput =
  | { intent: "order"; items: OrderItemInput[]; notes?: string }
  | { intent: "inquiry"; query: string }
  | { intent: "greeting"; reply: string }
  | { intent: "complaint"; reply: string; escalate: boolean }
  | { intent: "unknown"; reply: string }
  | { intent: "escalate"; reason: string }

export type LLMIntent = LLMOutput["intent"]

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CompletionOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  retries?: number
  timeout?: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
}

export interface CompletionResult {
  content: string
  model: string
  finishReason: string
  usage: TokenUsage
}
