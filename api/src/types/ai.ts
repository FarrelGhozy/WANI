// ─────────────────────────────────────────────────────────────
//  AI pipeline types — consolidated
// ─────────────────────────────────────────────────────────────

// ---- LLM core types (ex: ai/types.ts) ----

export interface OrderItemInput {
  name: string
  qty: number
}

export type LLMOutput =
  | { intent: "order"; items: OrderItemInput[]; notes?: string }
  | { intent: "inquiry"; query: string; reply?: string }
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
  baseUrl?: string
  apiKey?: string
  fallbackModel?: string
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

// ---- Domain types (ex: ai/prompts.ts) ----

export interface PaymentMethodEntry {
  type: string
  label?: string | null
  bankName?: string | null
  accountNumber?: string | null
  accountName?: string | null
  providerName?: string | null
  phoneNumber?: string | null
  qrImageUrl?: string | null
  instructions?: string | null
}

export interface StoreInfo {
  businessName: string
  address?: string | null
  phone: string
  businessHours?: string | null
  paymentMethods?: string | null
  activePaymentMethods?: PaymentMethodEntry[]
  shippingInfo?: string | null
  returnPolicy?: string | null
}

export interface ProductEntry {
  id: string
  name: string
  price: number
  stock: number
  isAvailable: boolean
  categoryName?: string | null
}

// ---- Action types (ex: ai/actions.ts) ----

export interface ActionCtx {
  ownerId: string
  customerId: string
  conversationId: string
  greetingMessage?: string | null
}

export interface ActionResult {
  reply: string
  qrisImageUrl?: string | null
}

// ---- Pipeline types (ex: ai/pipeline.ts) ----

export interface PipelineInput {
  ownerId: string
  phone: string
  name?: string
  text: string
  waMsgId?: string
}

export interface PipelineResult {
  reply: string
  intent: string
  blocked: boolean
  qrisImageUrl?: string | null
}

// ---- Circuit breaker types (ex: ai/circuit-breaker) ----

export enum State {
  Closed = "closed",
  Open = "open",
  HalfOpen = "half-open",
}

export interface CircuitState {
  state: State
  failures: number
}

export type CircuitResult<T> =
  | { allowed: true; result: T }
  | { allowed: false; error?: Error }


